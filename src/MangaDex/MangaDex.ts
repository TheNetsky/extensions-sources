/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {
    PagedResults,
    Source,
    Manga,
    Chapter,
    ChapterDetails,
    HomeSection,
    SearchRequest,
    SourceInfo,
    LanguageCode,
    TagType,
    MangaStatus,
    MangaTile,
    Tag,
    RequestHeaders,
    ContentRating,
    TagSection,
    Section,
    HomeSectionType,
    MangaUpdates
} from 'paperback-extensions-common'

import entities = require('entities')
import {
    contentSettings,
    getLanguages,
    getDemographics,
    thumbnailSettings,
    getHomepageThumbnail,
    getSearchThumbnail,
    getMangaThumbnail,
    resetSettings,
    getDataSaver,
    getSkipSameChapter,
} from './MangaDexSettings'
import {
    requestMetadata,
    MDLanguages,
    URLBuilder,
    MDDemographics,
    MDImageQuality
} from './MangaDexHelper'
import tagJSON from './external/tag.json'

const MANGADEX_DOMAIN = 'https://mangadex.org'
const MANGADEX_API = 'https://api.mangadex.org'
const COVER_BASE_URL = 'https://uploads.mangadex.org/covers'

export const MangaDexInfo: SourceInfo = {
    author: 'nar1n',
    description: 'Extension that pulls manga from MangaDex',
    icon: 'icon.png',
    name: 'MangaDex',
    version: '2.0.2',
    authorWebsite: 'https://github.com/nar1n',
    websiteBaseURL: MANGADEX_DOMAIN,
    contentRating: ContentRating.EVERYONE,
    language: LanguageCode.ENGLISH,
    sourceTags: [
        {
            text: 'Recommended',
            type: TagType.BLUE,
        },
        {
            text: 'Notifications',
            type: TagType.GREEN
        }
    ],
}

export class MangaDex extends Source {

    requestManager = createRequestManager({
        requestsPerSecond: 4,
        requestTimeout: 15000,
    })

    stateManager = createSourceStateManager({})

    override async getSourceMenu(): Promise<Section> {
        return Promise.resolve(createSection({
            id: 'main',
            header: 'Source Settings',
            rows: () => Promise.resolve([
                contentSettings(this.stateManager),
                thumbnailSettings(this.stateManager),
                resetSettings(this.stateManager),
            ])
        }))
    }

    override getMangaShareUrl(mangaId: string): string {
        return `${MANGADEX_DOMAIN}/title/${mangaId}`
    }

    override globalRequestHeaders(): RequestHeaders {
        return {
            referer: `${MANGADEX_DOMAIN}/`
        }
    }

    override async getTags(): Promise<TagSection[]> {
        const sections: Record<string, TagSection> = {}

        for(const tag of tagJSON) {
            const group = tag.data.attributes.group

            if(sections[group] == null) {
                sections[group] = createTagSection({
                    id: group,
                    label: group.charAt(0).toUpperCase() + group.slice(1),
                    tags: []
                })
            }
            const tagObject = createTag({id: tag.data.id, label: tag.data.attributes.name.en})
            sections[group]!.tags = [...sections[group]?.tags ?? [], tagObject]
        }

        return Object.values(sections)
    }

    async getMDHNodeURL(chapterId: string): Promise<string> {
        const request = createRequestObject({
            url: `${MANGADEX_API}/at-home/server/${chapterId}`,
            method: 'GET',
        })
    
        const response = await this.requestManager.schedule(request, 1)
        const json = (typeof response.data) === 'string' ? JSON.parse(response.data) : response.data

        return json.baseUrl
    }

    async getCustomListRequestURL(listId: string, demographics: string[]): Promise<string> {
        const request = createRequestObject({
            url: `${MANGADEX_API}/list/${listId}`,
            method: 'GET',
        })
    
        const response = await this.requestManager.schedule(request, 1)
        const json = (typeof response.data) === 'string' ? JSON.parse(response.data) : response.data

        return new URLBuilder(MANGADEX_API)
            .addPathComponent('manga')
            .addQueryParameter('limit', 100)
            .addQueryParameter('contentRating', demographics)
            .addQueryParameter('includes', ['cover_art'])
            .addQueryParameter('ids', json.relationships.filter((x: any) => x.type == 'manga').map((x: any) => x.id))
            .buildUrl()
    }

    async getMangaDetails(mangaId: string): Promise<Manga> {
        if (!mangaId.includes('-')) {
            // Legacy Id
            throw new Error('OLD ID: PLEASE MIGRATE')
        }

        const request = createRequestObject({
            url: new URLBuilder(MANGADEX_API)
                .addPathComponent('manga')
                .addPathComponent(mangaId)
                .addQueryParameter('includes', ['author', 'artist', 'cover_art'])
                .buildUrl(),
            method: 'GET',
        })
    
        const response = await this.requestManager.schedule(request, 1)
        const json = (typeof response.data) === 'string' ? JSON.parse(response.data) : response.data

        const mangaDetails = json.data.attributes
        const titles = [
            ...Object.values(mangaDetails.title),
            ...mangaDetails.altTitles.flatMap((x: never) => Object.values(x))
        ].map((x: string) => this.decodeHTMLEntity(x))
        const desc = this.decodeHTMLEntity(mangaDetails.description.en).replace(/\[\/{0,1}[bus]\]/g, '')  // Get rid of BBcode tags

        let status = MangaStatus.COMPLETED
        if (mangaDetails.status == 'ongoing') {
            status = MangaStatus.ONGOING
        }
        const tags: Tag[] = []
        for (const tag of mangaDetails.tags) {
            const tagName: {[index: string]: string} = tag.attributes.name
            tags.push(createTag({
                id: tag.id,
                label: Object.keys(tagName).map(keys => tagName[keys])[0] ?? 'Unknown'
            }))
        }
    
        const author = json.relationships.filter((x: any) => x.type == 'author').map((x: any) => x.attributes.name).join(', ')
        const artist = json.relationships.filter((x: any) => x.type == 'artist').map((x: any) => x.attributes.name).join(', ')

        const coverFileName = json.relationships.filter((x: any) => x.type == 'cover_art').map((x: any) => x.attributes?.fileName)[0]
        let image: string
        if (coverFileName) {
            image = `${COVER_BASE_URL}/${mangaId}/${coverFileName}${MDImageQuality.getEnding(await getMangaThumbnail(this.stateManager))}`
        } else {
            image = 'https://mangadex.org/_nuxt/img/cover-placeholder.d12c3c5.jpg'
        }

        return createManga({
            id: mangaId,
            titles,
            image,
            author,
            artist,
            desc,
            rating: 5,
            status,
            tags: [createTagSection({
                id: 'tags',
                label: 'Tags',
                tags: tags
            })]
        })
    }

    async getChapters(mangaId: string): Promise<Chapter[]> {
        if (!mangaId.includes('-')) {
            // Legacy Id
            throw new Error('OLD ID: PLEASE MIGRATE')
        }

        const languages: string[] = await getLanguages(this.stateManager)
        const skipSameChapter = await getSkipSameChapter(this.stateManager)
        const collectedChapters: string[] = []

        const chapters: Chapter[] = []
        let offset = 0
        let sortingIndex = 0

        let hasResults = true
        while (hasResults) {
            const request = createRequestObject({
                url: new URLBuilder(MANGADEX_API)
                    .addPathComponent('manga')
                    .addPathComponent(mangaId)
                    .addPathComponent('feed')
                    .addQueryParameter('limit', 500)
                    .addQueryParameter('offset', offset)
                    .addQueryParameter('includes', ['scanlation_group'])
                    .addQueryParameter('translatedLanguage', languages)
                    .addQueryParameter('order', {'volume': 'desc', 'chapter': 'desc'})
                    .buildUrl(),
                method: 'GET',
            })
            const response = await this.requestManager.schedule(request, 1)
            const json = (typeof response.data) === 'string' ? JSON.parse(response.data) : response.data
            offset += 500

            if(json.results === undefined) throw new Error(`Failed to parse json results for ${mangaId}`)

            for (const chapter of json.results) {
                const chapterId = chapter.data.id
                const chapterDetails = chapter.data.attributes
                const name =  this.decodeHTMLEntity(chapterDetails.title)
                const chapNum = Number(chapterDetails?.chapter)
                const volume = Number(chapterDetails?.volume)
                const langCode: any = MDLanguages.getPBCode(chapterDetails.translatedLanguage)
                const time = new Date(chapterDetails.publishAt)
                const group = chapter.relationships.filter((x: any) => x.type == 'scanlation_group').map((x: any) => x.attributes.name).join(', ')

                const identifier = `${volume}-${chapNum}-${chapterDetails.translatedLanguage}`
                if (!collectedChapters.includes(identifier) || !skipSameChapter) {
                    chapters.push(createChapter({
                        id: chapterId,
                        mangaId: mangaId,
                        name,
                        chapNum,
                        volume,
                        langCode,
                        group,
                        time,
                        // @ts-ignore
                        sortingIndex
                    }))

                    sortingIndex--
                    collectedChapters.push(identifier)
                }
            }

            if (json.total <= offset) {
                hasResults = false
            }
        }

        return chapters
    }

    async getChapterDetails(mangaId: string, chapterId: string): Promise<ChapterDetails> {
        if (!chapterId.includes('-')) {
            // Numeric ID
            throw new Error('OLD ID: PLEASE REFRESH AND CLEAR ORPHANED CHAPTERS')
        }

        const serverUrl = await this.getMDHNodeURL(chapterId)
        const dataSaver = await getDataSaver(this.stateManager)

        const request = createRequestObject({
            url: `${MANGADEX_API}/chapter/${chapterId}`,
            method: 'GET',
        })

        const response = await this.requestManager.schedule(request, 1)
        const json = (typeof response.data) === 'string' ? JSON.parse(response.data) : response.data

        const chapterDetails = json.data.attributes

        let pages: string[]
        if (dataSaver) {
            pages = chapterDetails.dataSaver.map(
                (x: string) => `${serverUrl}/data-saver/${chapterDetails.hash}/${x}`
            )
        } else {
            pages = chapterDetails.data.map(
                (x: string) => `${serverUrl}/data/${chapterDetails.hash}/${x}`
            )
        }

        return createChapterDetails({
            id: chapterId,
            mangaId: mangaId,
            pages,
            longStrip: false
        })
    }

    async searchRequest(query: SearchRequest, metadata: requestMetadata): Promise<PagedResults> {
        const demographics: string[] = await getDemographics(this.stateManager)
        const offset: number = metadata?.offset ?? 0
        const results: MangaTile[] = []
        const searchType = query.title?.match(/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i) ? 'ids[]' : 'title'

        const url = new URLBuilder(MANGADEX_API)
            .addPathComponent('manga')
            .addQueryParameter(searchType, (query.title?.length ?? 0) > 0 ? encodeURIComponent(query.title!) : undefined)
            .addQueryParameter('limit', 100)
            .addQueryParameter('offset', offset)
            .addQueryParameter('contentRating', demographics)
            .addQueryParameter('includes', ['cover_art'])
            .addQueryParameter('includedTags', query.includedTags?.map(x => x.id))
            .addQueryParameter('includedTagsMode', query.includeOperator)
            .addQueryParameter('excludedTags', query.excludedTags?.map(x => x.id))
            .addQueryParameter('excludedTagsMode', query.excludeOperator)
            .buildUrl()

        const request = createRequestObject({
            url: url,
            method: 'GET',
        })

        const response = await this.requestManager.schedule(request, 1)
        if (response.status != 200) {
            return createPagedResults({results})
        }

        const json = (typeof response.data) === 'string' ? JSON.parse(response.data) : response.data

        if(json.results === undefined) {throw new Error('Failed to parse json for the given search')}

        for (const manga of json.results) {
            const mangaId = manga.data.id
            const mangaDetails = manga.data.attributes
            const title = this.decodeHTMLEntity(Object.values(mangaDetails.title)[0] as string)
            const coverFileName = manga.relationships.filter((x: any) => x.type == 'cover_art').map((x: any) => x.attributes?.fileName)[0]
            let image: string
            if (coverFileName) {
                image = `${COVER_BASE_URL}/${mangaId}/${coverFileName}${MDImageQuality.getEnding(await getSearchThumbnail(this.stateManager))}`
            } else {
                image = 'https://mangadex.org/_nuxt/img/cover-placeholder.d12c3c5.jpg'
            }

            results.push(createMangaTile({
                id: mangaId,
                title: createIconText({text: title}),
                image
            }))
        }

        return createPagedResults({
            results,
            metadata: {offset: offset + 100}
        })
    }

    override async getHomePageSections(sectionCallback: (section: HomeSection) => void): Promise<void> {
        const demographics: string[] = await getDemographics(this.stateManager)

        const sections = [
            {
                request: createRequestObject({
                    url: await this.getCustomListRequestURL('8018a70b-1492-4f91-a584-7451d7787f7a', demographics),
                    method: 'GET',
                }),
                section: createHomeSection({
                    id: 'seasonal',
                    title: 'Seasonal',
                    type: HomeSectionType.featured
                }),
            },
            {
                request: createRequestObject({
                    url: new URLBuilder(MANGADEX_API)
                        .addPathComponent('manga')
                        .addQueryParameter('limit', 20)
                        .addQueryParameter('contentRating', demographics)
                        .addQueryParameter('includes', ['cover_art'])
                        .buildUrl(),
                    method: 'GET',
                }),
                section: createHomeSection({
                    id: 'popular',
                    title: 'Popular',
                    view_more: true,
                }),
            },
            {
                request: createRequestObject({
                    url: new URLBuilder(MANGADEX_API)
                        .addPathComponent('manga')
                        .addQueryParameter('limit', 20)
                        .addQueryParameter('contentRating', demographics)
                        .addQueryParameter('includes', ['cover_art'])
                        .addQueryParameter('order', {'updatedAt': 'desc'})
                        .buildUrl(),
                    method: 'GET',
                }),
                section: createHomeSection({
                    id: 'recently_updated',
                    title: 'Recently Updated',
                    view_more: true,
                }),
            },
        ]
        const promises: Promise<void>[] = []

        for (const section of sections) {
            // Let the app load empty sections
            sectionCallback(section.section)

            // Get the section data
            promises.push(
                this.requestManager.schedule(section.request, 1).then(async response => {
                    const json = (typeof response.data) === 'string' ? JSON.parse(response.data) : response.data
                    const results = []

                    if(json.results === undefined) throw new Error(`Failed to parse json results for section ${section.section.title}`)

                    for (const manga of json.results) {
                        const mangaId = manga.data.id
                        const mangaDetails = manga.data.attributes
                        const title = this.decodeHTMLEntity(Object.values(mangaDetails.title)[0] as string)
                        const coverFileName = manga.relationships.filter((x: any) => x.type == 'cover_art').map((x: any) => x.attributes?.fileName)[0]
                        let image: string
                        if (coverFileName) {
                            image = `${COVER_BASE_URL}/${mangaId}/${coverFileName}${MDImageQuality.getEnding(await getHomepageThumbnail(this.stateManager))}`
                        } else {
                            image = 'https://mangadex.org/_nuxt/img/cover-placeholder.d12c3c5.jpg'
                        }

                        results.push(createMangaTile({
                            id: mangaId,
                            title: createIconText({text: title}),
                            image
                        }))
                    }

                    section.section.items = results
                    sectionCallback(section.section)
                }),
            )
        }

        // Make sure the function completes
        await Promise.all(promises)
    }

    override async getViewMoreItems(homepageSectionId: string, metadata: requestMetadata): Promise<PagedResults> {
        const offset: number = metadata?.offset ?? 0
        const collectedIds: string[] = metadata?.collectedIds ?? []
        const results: MangaTile[] = []
        const demographics: string[] = await getDemographics(this.stateManager)
        let url = ''

        switch(homepageSectionId) {
            case 'popular': {
                url = new URLBuilder(MANGADEX_API)
                    .addPathComponent('manga')
                    .addQueryParameter('limit', 100)
                    .addQueryParameter('offset', offset)
                    .addQueryParameter('contentRating', demographics)
                    .addQueryParameter('includes', ['cover_art'])
                    .buildUrl()
                break
            }
            case 'recently_updated': {
                url = new URLBuilder(MANGADEX_API)
                    .addPathComponent('manga')
                    .addQueryParameter('limit', 100)
                    .addQueryParameter('offset', offset)
                    .addQueryParameter('contentRating', demographics)
                    .addQueryParameter('includes', ['cover_art'])
                    .addQueryParameter('order', {'updatedAt': 'desc'})
                    .buildUrl()
                break
            }
        }

        const request = createRequestObject({
            url,
            method: 'GET',
        })

        const response = await this.requestManager.schedule(request, 1)
        const json = (typeof response.data) === 'string' ? JSON.parse(response.data) : response.data

        if(json.results === undefined) throw new Error('Failed to parse json results for getViewMoreItems')

        for (const manga of json.results) {
            const mangaId = manga.data.id
            const mangaDetails = manga.data.attributes
            const title = this.decodeHTMLEntity(Object.values(mangaDetails.title)[0] as string)
            const coverFileName = manga.relationships.filter((x: any) => x.type == 'cover_art').map((x: any) => x.attributes?.fileName)[0]
            let image: string
            if (coverFileName) {
                image = `${COVER_BASE_URL}/${mangaId}/${coverFileName}${MDImageQuality.getEnding(await getHomepageThumbnail(this.stateManager))}`
            } else {
                image = 'https://mangadex.org/_nuxt/img/cover-placeholder.d12c3c5.jpg'
            }

            if (!collectedIds.includes(mangaId)) {
                results.push(createMangaTile({
                    id: mangaId,
                    title: createIconText({text: title}),
                    image
                }))
                collectedIds.push(mangaId)
            }
        }

        return createPagedResults({
            results,
            metadata: {offset: offset + 100, collectedIds}
        })
    }

    override async filterUpdatedManga(mangaUpdatesFoundCallback: (updates: MangaUpdates) => void, time: Date, ids: string[]): Promise<void> {
        let offset = 0
        const maxRequests = 100
        let loadNextPage = true
        let updatedManga: string[] = []
        const updatedAt = time.toISOString().split('.')[0] // They support a weirdly truncated version of an ISO timestamp

        while (loadNextPage) {
            const request = createRequestObject({
                url: new URLBuilder(MANGADEX_API)
                    .addPathComponent('manga')
                    .addQueryParameter('limit', 100)
                    .addQueryParameter('offset', offset)
                    .addQueryParameter('contentRating', MDDemographics.getEnumList())
                    .addQueryParameter('order', {'updatedAt': 'desc'})
                    .buildUrl(),
                method: 'GET',
            })

            const response = await this.requestManager.schedule(request, 1)

            // If we have no content, there are no updates available
            if(response.status == 204) {
                return
            }

            const json = (typeof response.data) === 'string' ? JSON.parse(response.data) : response.data

            if(json.results === undefined) {
                // Log this, no need to throw.
                console.log(`Failed to parse JSON results for filterUpdatedManga using the date ${updatedAt} and the offset ${offset}`)
                return
            }

            for (const manga of json.results) {
                const mangaId = manga.data.id
                const mangaTime = new Date(manga.data.attributes.updatedAt)

                if (mangaTime <= time) {
                    loadNextPage = false
                } else if (ids.includes(mangaId)) {
                    updatedManga.push(mangaId)
                }
            }

            offset = offset + 100
            if (json.total <= offset || offset >= 100 * maxRequests) {
                loadNextPage = false
            }
            if (updatedManga.length > 0) {
                mangaUpdatesFoundCallback(createMangaUpdates({
                    ids: updatedManga
                }))
            }
            updatedManga = []
        }
    }

    decodeHTMLEntity(str: string): string {
        return entities.decodeHTML(str)
    }
}
