/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable no-case-declarations */
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
    getRatings,
    thumbnailSettings,
    getHomepageThumbnail,
    getSearchThumbnail,
    getMangaThumbnail,
    resetSettings,
    getDataSaver,
    getSkipSameChapter,
    homepageSettings,
    getEnabledRecommendations,
    getEnabledHomePageSections
} from './MangaDexSettings'
import {
    requestMetadata,
    MDLanguages,
    URLBuilder,
    MDImageQuality
} from './MangaDexHelper'
import {
    addRecommendedId,
    getRecommendedIds
} from './MangaDexSimilarManga'
import tagJSON from './external/tag.json'
import {
    parseChapterList,
    parseMangaList
} from './MangaDexParser'

const MANGADEX_DOMAIN = 'https://mangadex.org'
const MANGADEX_API = 'https://api.mangadex.org'
const COVER_BASE_URL = 'https://uploads.mangadex.org/covers'

// Titles recommendations are shown on the homepage when enabled in source settings.
// Recommendations are made using https://github.com/Similar-Manga
const RECOMMENDATION_URL = 'https://framboisepi.github.io/SimilarData'

export const MangaDexInfo: SourceInfo = {
    author: 'nar1n',
    description: 'Extension that pulls manga from MangaDex',
    icon: 'icon.png',
    name: 'MangaDex',
    version: '2.1.0',
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
    MANGADEX_DOMAIN = MANGADEX_DOMAIN
    MANGADEX_API = MANGADEX_API
    COVER_BASE_URL = COVER_BASE_URL

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
                homepageSettings(this.stateManager),
                resetSettings(this.stateManager),
            ])
        }))
    }

    override getMangaShareUrl(mangaId: string): string {
        return `${this.MANGADEX_DOMAIN}/title/${mangaId}`
    }

    override globalRequestHeaders(): RequestHeaders {
        return {
            referer: `${this.MANGADEX_DOMAIN}/`
        }
    }

    override async getSearchTags(): Promise<TagSection[]> {
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

    override async supportsSearchOperators(): Promise<boolean> {
        return true
    }

    override async supportsTagExclusion(): Promise<boolean> {
        return true
    }

    async getMDHNodeURL(chapterId: string): Promise<string> {
        const request = createRequestObject({
            url: `${this.MANGADEX_API}/at-home/server/${chapterId}`,
            method: 'GET',
        })
    
        const response = await this.requestManager.schedule(request, 1)
        const json = (typeof response.data) === 'string' ? JSON.parse(response.data) : response.data

        return json.baseUrl
    }

    async getCustomListRequestURL(listId: string, ratings: string[]): Promise<string> {
        const request = createRequestObject({
            url: `${this.MANGADEX_API}/list/${listId}`,
            method: 'GET',
        })
    
        const response = await this.requestManager.schedule(request, 1)
        const json = (typeof response.data) === 'string' ? JSON.parse(response.data) : response.data

        return new URLBuilder(this.MANGADEX_API)
            .addPathComponent('manga')
            .addQueryParameter('limit', 100)
            .addQueryParameter('contentRating', ratings)
            .addQueryParameter('includes', ['cover_art'])
            .addQueryParameter('ids', json.relationships.filter((x: any) => x.type == 'manga').map((x: any) => x.id))
            .buildUrl()
    }

    async getCoversMapping(mangaIds: string[], ratings: string[]): Promise<{[id: string]: string}> {
        const mapping: {[id: string]: string} = {}

        const request = createRequestObject({
            url: new URLBuilder(this.MANGADEX_API)
                .addPathComponent('manga')
                .addQueryParameter('limit', 100)
                .addQueryParameter('contentRating', ratings)
                .addQueryParameter('ids', mangaIds)
                .addQueryParameter('includes', ['cover_art'])
                .buildUrl(),
            method: 'GET'
        })

        const response = await this.requestManager.schedule(request, 1)
        const json = (typeof response.data) === 'string' ? JSON.parse(response.data) : response.data

        for (const manga of json.results) {
            const mangaId = manga.data.id
            const coverFileName = manga.relationships.filter((x: any) => x.type == 'cover_art').map((x: any) => x.attributes?.fileName)[0]

            if (!mangaId || !coverFileName) continue

            mapping[mangaId] = coverFileName
        }

        return mapping
    }

    async getMangaDetails(mangaId: string): Promise<Manga> {
        if (!mangaId.includes('-')) {
            // Legacy Id
            console.log('OLD ID: PLEASE MIGRATE')
            throw new Error('OLD ID: PLEASE MIGRATE')
        }

        const request = createRequestObject({
            url: new URLBuilder(this.MANGADEX_API)
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
            image = `${this.COVER_BASE_URL}/${mangaId}/${coverFileName}${MDImageQuality.getEnding(await getMangaThumbnail(this.stateManager))}`
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
            console.log('OLD ID: PLEASE MIGRATE')
            throw new Error('OLD ID: PLEASE MIGRATE')
        }

        const languages: string[] = await getLanguages(this.stateManager)
        const skipSameChapter = await getSkipSameChapter(this.stateManager)
        const ratings: string[] = await getRatings(this.stateManager)
        const collectedChapters: string[] = []

        const chapters: Chapter[] = []
        let offset = 0
        let sortingIndex = 0

        let hasResults = true
        while (hasResults) {
            const request = createRequestObject({
                url: new URLBuilder(this.MANGADEX_API)
                    .addPathComponent('manga')
                    .addPathComponent(mangaId)
                    .addPathComponent('feed')
                    .addQueryParameter('limit', 500)
                    .addQueryParameter('offset', offset)
                    .addQueryParameter('includes', ['scanlation_group'])
                    .addQueryParameter('translatedLanguage', languages)
                    .addQueryParameter('order', {'volume': 'desc', 'chapter': 'desc', 'publishAt': 'desc'})
                    .addQueryParameter('contentRating', ratings)
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
                        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                        // @ts-ignore
                        sortingIndex
                    }))

                    collectedChapters.push(identifier)
                    sortingIndex--
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
            console.log('OLD ID: PLEASE MIGRATE')
            throw new Error('OLD ID: PLEASE REFRESH AND CLEAR ORPHANED CHAPTERS')
        }

        const serverUrl = await this.getMDHNodeURL(chapterId)
        const dataSaver = await getDataSaver(this.stateManager)

        const request = createRequestObject({
            url: `${this.MANGADEX_API}/chapter/${chapterId}`,
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

        // The chapter is being read, add the mangaId to the recommendation list
        addRecommendedId(this.stateManager, mangaId)

        return createChapterDetails({
            id: chapterId,
            mangaId: mangaId,
            pages,
            longStrip: false
        })
    }

    async getSearchResults(query: SearchRequest, metadata: requestMetadata): Promise<PagedResults> {
        const ratings: string[] = await getRatings(this.stateManager)
        const offset: number = metadata?.offset ?? 0
        let results: MangaTile[] = []
        const searchType = query.title?.match(/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i) ? 'ids[]' : 'title'

        const url = new URLBuilder(this.MANGADEX_API)
            .addPathComponent('manga')
            .addQueryParameter(searchType, (query.title?.length ?? 0) > 0 ? encodeURIComponent(query.title!) : undefined)
            .addQueryParameter('limit', 100)
            .addQueryParameter('offset', offset)
            .addQueryParameter('contentRating', ratings)
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

        results = await parseMangaList(json.results, this, getSearchThumbnail)

        return createPagedResults({
            results,
            metadata: {offset: offset + 100}
        })
    }

    override async getHomePageSections(sectionCallback: (section: HomeSection) => void): Promise<void> {
        const ratings: string[] = await getRatings(this.stateManager)
        const languages: string[] = await getLanguages(this.stateManager)

        const promises: Promise<void>[] = []

        // On the homepage we only show sections enabled in source settings:
        // enabled_homepage_sections and recommended titles sections
        const enabled_homepage_sections = await getEnabledHomePageSections(this.stateManager)

        const sections = [
            {
                request: createRequestObject({
                    url: await this.getCustomListRequestURL('a153b4e6-1fcc-4f45-a990-f37f989c0d74', ratings),
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
                    url: new URLBuilder(this.MANGADEX_API)
                        .addPathComponent('manga')
                        .addQueryParameter('limit', 20)
                        .addQueryParameter('contentRating', ratings)
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
                    url: new URLBuilder(this.MANGADEX_API)
                        .addPathComponent('chapter')
                        .addQueryParameter('limit', 100)
                        .addQueryParameter('order', {'publishAt': 'desc'})
                        .addQueryParameter('translatedLanguage', languages)
                        .addQueryParameter('includes', ['manga'])
                        .buildUrl(),
                    method: 'GET',
                }),
                section: createHomeSection({
                    id: 'latest_updates',
                    title: 'Latest Updates',
                    view_more: true,
                }),
            },
        ]

        for (const section of sections) {
            // We only add the section if it is requested by the user in settings
            if (enabled_homepage_sections.includes(section.section.id)) {

                // Let the app load empty sections
                sectionCallback(section.section)

                // Get the section data
                promises.push(
                    this.requestManager.schedule(section.request, 1).then(async response => {
                        const json = (typeof response.data) === 'string' ? JSON.parse(response.data) : response.data

                        if(json.results === undefined) throw new Error(`Failed to parse json results for section ${section.section.title}`)

                        switch(section.section.id) {
                            case 'latest_updates':
                                const coversMapping = await this.getCoversMapping(json.results.map((x: any) => x.relationships.filter((x: any) => x.type == 'manga').map((x: any) => x.id)[0]), ratings)
                                section.section.items = await parseChapterList(json.results, coversMapping, this, getHomepageThumbnail, ratings)
                                break
                            default:
                                section.section.items = await parseMangaList(json.results, this, getHomepageThumbnail)
                        }
                        sectionCallback(section.section)
                    }),
                )
            }
        }

        // If the user want to see recommendations on the homepage, we process them
        if (getEnabledRecommendations(this.stateManager)) {
            const recommendedIds = await getRecommendedIds(this.stateManager)

            for (const recommendedId of recommendedIds) {
                // First we fetch similar titles
                const similarRequest = createRequestObject({
                    url: `${RECOMMENDATION_URL}/similar/${recommendedId}.json`,
                    method: 'GET',
                })
                promises.push(
                    this.requestManager.schedule(similarRequest, 1).then(async similarResponse => {

                        // We should only process if the response is valid
                        // We won't throw an error but silently pass as an error can occurre with 
                        // titles unsupported by SimilarManga (new titles for example)
                        if (similarResponse.status !== 200) {
                            console.log(`Could not fetch similar titles for id: ${recommendedId}, request failed with status ${similarResponse.status}`)
                        } else {
                            const similarJson = (typeof similarResponse.data) === 'string' ? JSON.parse(similarResponse.data) : similarResponse.data
                            
                            // We should only process if the result is valid
                            // We won't throw an error but silently pass as an error can occurre with 
                            // titles unsupported by SimilarManga (new titles for example)
                            if (similarJson.id === undefined) {
                                console.log('Could not fetch similar titles for id: ' + recommendedId + ', json is invalid')
                            } else {
                                // We know the title of the recommended manga, we can thus create the homepage section
                                const section = createHomeSection({
                                    id: recommendedId,
                                    // Can titles be html encoded?
                                    title: 'More like ' + this.decodeHTMLEntity(similarJson.title.en),
                                    view_more: false,
                                })
                                // Let the app load empty sections
                                sectionCallback(section)

                                // Generate the MangaTiles list, sorted by decreasing similarity
                                const results = []
                                
                                // We first add the title used for the recommendation
                                let image: string
                                if (similarJson.coverFileName === 'unknown') {
                                    image = 'https://mangadex.org/_nuxt/img/cover-placeholder.d12c3c5.jpg'
                                } else {
                                    image = `${COVER_BASE_URL}/${recommendedId}/${similarJson.coverFileName}${MDImageQuality.getEnding(await getMangaThumbnail(this.stateManager))}`
                                }
                                results.push(createMangaTile({
                                    id: recommendedId,
                                    title: createIconText({text: this.decodeHTMLEntity(similarJson.title.en)}),
                                    image
                                }))

                                // We then add similar titles, ordered by decreasing similarity
                                for (const manga of similarJson.matches) {
                                    // We should only add the title if its rating is enabled
                                    if (ratings.includes(manga.contentRating)) {
                                        // The similar api contains the coverFileName or 'unknown'
                                        let image: string
                                        if (manga.coverFileName === 'unknown') {
                                            image = 'https://mangadex.org/_nuxt/img/cover-placeholder.d12c3c5.jpg'
                                        } else {
                                            image = `${COVER_BASE_URL}/${manga.id}/${manga.coverFileName}${MDImageQuality.getEnding(await getMangaThumbnail(this.stateManager))}`
                                        }

                                        results.push(createMangaTile({
                                            id: manga.id,
                                            title: createIconText({text: this.decodeHTMLEntity(manga.title.en)}),
                                            subtitleText: createIconText({text: `Similarity ${manga.score.toFixed(2)}`}),
                                            image
                                        }))
                                    }
                                }

                                section.items = results
                                sectionCallback(section)
                            }
                        }
                    })
                )
            }
        }

        // Make sure the function completes
        await Promise.all(promises)
    }

    override async getViewMoreItems(homepageSectionId: string, metadata: requestMetadata): Promise<PagedResults> {
        const offset: number = metadata?.offset ?? 0
        const collectedIds: string[] = metadata?.collectedIds ?? []
        let results: MangaTile[] = []
        const ratings: string[] = await getRatings(this.stateManager)
        const languages: string[] = await getLanguages(this.stateManager)
        let url = ''

        switch(homepageSectionId) {
            case 'popular': {
                url = new URLBuilder(this.MANGADEX_API)
                    .addPathComponent('manga')
                    .addQueryParameter('limit', 100)
                    .addQueryParameter('offset', offset)
                    .addQueryParameter('contentRating', ratings)
                    .addQueryParameter('includes', ['cover_art'])
                    .buildUrl()
                break
            }
            case 'latest_updates': {
                url = new URLBuilder(this.MANGADEX_API)
                    .addPathComponent('chapter')
                    .addQueryParameter('limit', 100)
                    .addQueryParameter('offset', offset)
                    .addQueryParameter('order', {'publishAt': 'desc'})
                    .addQueryParameter('translatedLanguage', languages)
                    .addQueryParameter('includes', ['manga'])
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

        switch(homepageSectionId) {
            case 'latest_updates':
                const coversMapping = await this.getCoversMapping(json.results.map((x: any) => x.relationships.filter((x: any) => x.type == 'manga').map((x: any) => x.id)[0]), ratings)
                results = await parseChapterList(json.results, coversMapping, this, getHomepageThumbnail, ratings)
                break
            default:
                results = await parseMangaList(json.results, this, getHomepageThumbnail)
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
        const updatedManga: string[] = []
        const updatedAt = time.toISOString().split('.')[0] // They support a weirdly truncated version of an ISO timestamp
        const languages: string[] = await getLanguages(this.stateManager)

        while (loadNextPage) {
            const request = createRequestObject({
                url: new URLBuilder(this.MANGADEX_API)
                    .addPathComponent('chapter')
                    .addQueryParameter('limit', 100)
                    .addQueryParameter('offset', offset)
                    .addQueryParameter('publishAtSince', updatedAt)
                    .addQueryParameter('order', {'publishAt': 'desc'})
                    .addQueryParameter('translatedLanguage', languages)
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

            const mangaToUpdate: string[] = []
            for (const chapter of json.results) {
                const mangaId = chapter.relationships.filter((x: any)=> x.type == 'manga')[0]?.id

                if (ids.includes(mangaId) && !updatedManga.includes(mangaId)) {
                    mangaToUpdate.push(mangaId)
                    updatedManga.push(mangaId)
                }
            }

            offset = offset + 100
            if (json.total <= offset || offset >= 100 * maxRequests) {
                loadNextPage = false
            }
            if (mangaToUpdate.length > 0) {
                mangaUpdatesFoundCallback(createMangaUpdates({
                    ids: mangaToUpdate
                }))
            }
        }
        mangaUpdatesFoundCallback(createMangaUpdates({ids: []}))
    }

    decodeHTMLEntity(str: string): string {
        return entities.decodeHTML(str)
    }
}
