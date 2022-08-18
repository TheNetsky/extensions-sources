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

const WEBTOONS_DOMAIN = 'https://www.webtoons.com'
const WEBTOONS_MOBILE_DOMAIN = 'https://m.webtoons.com'
const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/102.0.5005.124 Safari/537.36 Edg/102.0.1245.44'
let langString = 'en' // Only used for 'getMangaShareUrl' function

export const WebtoonsInfo: SourceInfo = {
    version: '2.1.2',
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

    parser = new Parser()

    stateManager = createSourceStateManager({})

    requestManager = createRequestManager({
        requestsPerSecond: 3,
        requestTimeout: 15000,
        interceptor: {
            interceptRequest: async (request: Request): Promise<Request> => {
                request.headers = {
                    ...(request.headers ?? {}),
                    ...{
                        'user-agent': userAgent,
                        'referer': `${WEBTOONS_DOMAIN}/`,
                        'cookie': 'pagGDPR=true;'
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
        return `${WEBTOONS_DOMAIN}/${langString}/${mangaId}` // langString is 'en' by default.
    }

    override async getMangaDetails(mangaId: string): Promise<Manga> {
        const lang = await getLanguages(this.stateManager)
        langString = lang[0] ?? 'en' // This variable is only to be used in the "getMangaShareUrl" function.

        const request = createRequestObject({
            url: `${WEBTOONS_MOBILE_DOMAIN}/${lang[0]}/${mangaId}`,
            method: 'GET'
        })

        const response = await this.requestManager.schedule(request, 3)
        const $ = this.cheerio.load(response.data)
        return this.parser.parseMangaDetails($, mangaId)
    }

    override async getChapters(mangaId: string): Promise<Chapter[]> {
        const lang = await getLanguages(this.stateManager)

        const request = createRequestObject({
            url: `${WEBTOONS_MOBILE_DOMAIN}/${lang[0]}/${mangaId}`,
            method: 'GET'
        })

        const response = await this.requestManager.schedule(request, 3)
        const $ = this.cheerio.load(response.data)
        return this.parser.parseChapters($, mangaId, lang[0] ?? 'en')
    }

    override async getChapterDetails(mangaId: string, chapterId: string): Promise<ChapterDetails> {
        const lang = await getLanguages(this.stateManager)
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
            const searchType = query?.includedTags?.map((x: any) => x.id)[0] ?? 'WEBTOON' // Search will return "Canvas" titles or "Original" titles. Original is default. Cannot return both.
            tagSearch = searchType
            request = createRequestObject({
                url: `${WEBTOONS_DOMAIN}/${lang[0]}/search?keyword=${(query.title ?? '').replace(/ /g, '+')}&searchType=${searchType}&page=${page}`,
                method: 'GET'
            })

        } else {
            const hasTag = query?.includedTags?.map((x: any) => x.id)[0]
            if (hasTag) {
                type = 'tag'
                tagSearch = hasTag
            }
            request = createRequestObject({
                url: `${WEBTOONS_DOMAIN}/${lang[0]}/genre`,
                method: 'GET'
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
            method: 'GET'
        })

        const response = await this.requestManager.schedule(request, 1)
        const $ = this.cheerio.load(response.data)
        return this.parser.parseHomeSections($, sectionCallback, lang[0])
    }

    override async getTags(): Promise<TagSection[]> {
        const lang = await getLanguages(this.stateManager)

        const request = createRequestObject({
            url: `${WEBTOONS_DOMAIN}/${lang[0]}/genre`,
            method: 'GET'
        })

        const response = await this.requestManager.schedule(request, 3)
        const $ = this.cheerio.load(response.data)
        return this.parser.parseTags($)
    }
}
