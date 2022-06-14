import {
    Chapter,
    ChapterDetails,
    ContentRating,
    HomeSection,
    Manga,
    PagedResults,
    SearchRequest,
    Section,
    Source,
    SourceInfo,
    Request,
    Response,
    TagSection,
    TagType
} from 'paperback-extensions-common'

import {
    contentSettings,
    getLanguages 
} from './WebtoonsSettings'

import { Parser } from './WebtoonsParser'

const WEBTOONS_DOMAIN = 'https://www.webtoons.com/'
const WEBTOONS_MOBILE_DOMAIN = 'https://m.webtoons.com'
const userAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.4 Mobile/15E148 Safari/604.1'

export const WebtoonsInfo: SourceInfo = {
    version: '2.2.1',
    name: 'Webtoons',
    description: 'Extension that pulls comics from Webtoons.',
    author: 'btylerh7',
    authorWebsite: 'http://github.com/btylerh7',
    icon: 'logo.png',
    contentRating: ContentRating.EVERYONE,
    websiteBaseURL: WEBTOONS_DOMAIN,
    sourceTags: [
        {
            text: 'Multi-Language',
            type: TagType.GREY,
        },
    ],
}

export class Webtoons extends Source {
    readonly cookies = [
        createCookie({ 
            name: 'pagGDPR',
            value: 'true',
            domain: '.webtoons.com'
        })
    ]
    parser = new Parser()
    stateManager = createSourceStateManager({})
    requestManager = createRequestManager({
        requestsPerSecond: 3,
        requestTimeout: 15000,
        interceptor: {
            interceptRequest: async (request: Request): Promise<Request> => {
                const lang = await getLanguages(this.stateManager)
                request.headers = {
                    ...(request.headers ?? {}),
                    ...{
                        'user-agent': userAgent,
                        'referer': `${WEBTOONS_DOMAIN}/${lang[0]}`,
                    }
                }

                return request
            },

            interceptResponse: async (response: Response): Promise<Response> => {
                return response
            }
        }
    })
    override async getSourceMenu(): Promise<Section> {
        return Promise.resolve(createSection({
            id: 'main',
            header: 'Source Settings',
            rows: async () => [
                await contentSettings(this.stateManager),
            ]
        }))
    }
    override getMangaShareUrl(mangaId: string): string {
        return `${WEBTOONS_DOMAIN}/en/${mangaId}`
    }

    override async getMangaDetails(mangaId: string): Promise<Manga> {
        const lang = await getLanguages(this.stateManager)
        const request = createRequestObject({
            url: `${WEBTOONS_MOBILE_DOMAIN}/${lang[0]}/${mangaId}`,
            method: 'GET',
            cookies: this.cookies
        })
        const response = await this.requestManager.schedule(request, 3)
        const $ = this.cheerio.load(response.data)
        return this.parser.parseMangaDetails($, mangaId)
    }

    override async getChapters(mangaId: string): Promise<Chapter[]> {
        const lang = await getLanguages(this.stateManager)
        const request = createRequestObject({
            url: `${WEBTOONS_MOBILE_DOMAIN}/${lang[0]}/${mangaId}`,
            method: 'GET',
            cookies: this.cookies
        })
        const response = await this.requestManager.schedule(request, 3)
        const $ = this.cheerio.load(response.data)
        return this.parser.parseChapters($, mangaId, lang[0] ?? 'en')
    }

    override async getChapterDetails(mangaId: string, chapterId: string): Promise<ChapterDetails> {
        const lang =await getLanguages(this.stateManager)
        const newId = mangaId.replace('list', `ep${chapterId}/viewer`)
        const request = createRequestObject({
            url: `${WEBTOONS_DOMAIN}/${lang[0]}/${newId}&episode_no=${chapterId}`,
            method: 'GET',
        })
        const response = await this.requestManager.schedule(request, 3)
        const $ = this.cheerio.load(response.data)
        return this.parser.parseChapterDetails($, mangaId, chapterId) 
    }

    override async getSearchResults(query: SearchRequest, metadata: any): Promise<PagedResults> {
        const lang = await getLanguages(this.stateManager)
        let page = metadata?.page ?? 1
        if (page == -1) return createPagedResults({ results: [], metadata: { page: -1 } })
        let request
        let type = 'title'
        let tagSearch
        if (query.title) {
            request = createRequestObject({
                url: `${WEBTOONS_DOMAIN}/${lang[0]}/search?keyword=${(query.title ?? '').replace(/ /g, '+')}&page=${page}`,
                method: 'GET',
                cookies: this.cookies
            })
        } else {
            if (query?.includedTags?.length != 0) {
                type = 'tag'
                tagSearch = query.includedTags![0]?.id
            }
            request = createRequestObject({
                url: `${WEBTOONS_DOMAIN}/${lang[0]}/genre`,
                method: 'GET',
                cookies: this.cookies
            }) 
        }
        const data = await this.requestManager.schedule(request, 3)
        const $ = this.cheerio.load(data.data)
        const manga = this.parser.parseSearchResults($, lang[0], type, tagSearch ?? '')

        page++
        if (manga.length < 18) page = -1

        return createPagedResults({
            results: manga,
            metadata: { page: page },
        })
    }

    override async getHomePageSections(sectionCallback: (section: HomeSection) => void): Promise<void> {
        const lang = await getLanguages(this.stateManager)
        const request = createRequestObject({
            url: `${WEBTOONS_DOMAIN}/${lang[0]}/top`,
            method: 'GET',
            cookies: this.cookies
        })
        const response = await this.requestManager.schedule(request, 1)
        const $ = this.cheerio.load(response.data)
        return this.parser.parseHomeSections($, sectionCallback, lang[0])
    }

    override async getTags(): Promise<TagSection[]> {
        const lang =await getLanguages(this.stateManager)
        const request = createRequestObject({
            url: `${WEBTOONS_DOMAIN}/${lang[0]}/genre`,
            method: 'GET',
            cookies: this.cookies
        })
        const response = await this.requestManager.schedule(request, 3)
        const $ = this.cheerio.load(response.data)
        return this.parser.parseTags($)
    }
}
  