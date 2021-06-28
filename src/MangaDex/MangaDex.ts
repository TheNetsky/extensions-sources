/* eslint-disable @typescript-eslint/no-explicit-any */
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
    SearchOperator,
    HomeSectionType
} from 'paperback-extensions-common'

import entities = require('entities')
import {
    contentSettings,
    getLanguages,
    getDemographics
} from './MangaDexSettings'
import {
    requestMetadata,
    MDLanguages
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
    version: '2.0.1',
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
                createButton({
                    id: 'clear',
                    label: 'Clear States',
                    value: '',
                    onTap: () => {
                        this.stateManager.store('languages', null),
                        this.stateManager.store('demographics', null)
                    }
                })
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

    async getMangaUUIDs(numericIds: string[]): Promise<{[id: string]: string}> {
        const length = numericIds.length
        let offset = 0
        const UUIDsDict:{[id: string]: string} = {}

        while (offset < length) {
            const request = createRequestObject({
                url: `${MANGADEX_API}/legacy/mapping`,
                method: 'POST',
                headers: {'content-type': 'application/json'},
                data: {
                    'type': 'manga',
                    'ids': numericIds.slice(offset, offset + 500).map(x => Number(x))
                }
            })
            offset += 500
    
            const response = await this.requestManager.schedule(request, 1)
            const json = (typeof response.data) === 'string' ? JSON.parse(response.data) : response.data

            for (const mapping of json) {
                UUIDsDict[mapping.data.attributes.legacyId] = mapping.data.attributes.newId
            }
        }

        return UUIDsDict
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

    async getCustomListRequestURL(listId: string): Promise<string> {
        const request = createRequestObject({
            url: `${MANGADEX_API}/list/${listId}`,
            method: 'GET',
        })
    
        const response = await this.requestManager.schedule(request, 1)
        const json = (typeof response.data) === 'string' ? JSON.parse(response.data) : response.data

        return `${MANGADEX_API}/manga?limit=100&contentRating[]=none&contentRating[]=safe&contentRating[]=suggestive&contentRating[]=erotica&contentRating[]=pornographic&includes[]=cover_art&ids[]=${json.relationships.filter((x: any) => x.type == 'manga').map((x: any) => x.id).join('&ids[]=')}`
    }

    async getMangaDetails(mangaId: string): Promise<Manga> {
        if (!mangaId.includes('-')) {
            // Legacy Id
            throw new Error('OLD ID: PLEASE MIGRATE')
        }

        const request = createRequestObject({
            url: `${MANGADEX_API}/manga/${mangaId}?includes[]=author&includes[]=artist&includes[]=cover_art`,
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
            image = `${COVER_BASE_URL}/${mangaId}/${coverFileName}`
        } else {
            image = 'https://i.imgur.com/6TrIues.jpg'
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

        const chapters: Chapter[] = []
        let offset = 0

        let hasResults = true
        while (hasResults) {
            const request = createRequestObject({
                url: `${MANGADEX_API}/manga/${mangaId}/feed?limit=500&offset=${offset}&includes[]=scanlation_group&translatedLanguage[]=${languages.join('&translatedLanguage[]=')}`,
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

                chapters.push(createChapter({
                    id: chapterId,
                    mangaId: mangaId,
                    name,
                    chapNum,
                    volume,
                    langCode,
                    group,
                    time
                }))
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

        const request = createRequestObject({
            url: `${MANGADEX_API}/chapter/${chapterId}`,
            method: 'GET',
        })

        const response = await this.requestManager.schedule(request, 1)
        const json = (typeof response.data) === 'string' ? JSON.parse(response.data) : response.data

        const chapterDetails = json.data.attributes
        const pages = chapterDetails.data.map(
            (x: string) => `${serverUrl}/data/${chapterDetails.hash}/${x}`
        )

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

        const url = new URLBuilder(MANGADEX_API)
            .addPathComponent('manga')
            .addQueryParameter('title', (query.title?.length ?? 0) > 0 ? encodeURIComponent(query.title!) : undefined)
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
                image = `${COVER_BASE_URL}/${mangaId}/${coverFileName}.256.jpg`
            } else {
                image = 'https://i.imgur.com/6TrIues.jpg'
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
                    url: await this.getCustomListRequestURL('8018a70b-1492-4f91-a584-7451d7787f7a'),
                    method: 'GET',
                }),
                section: createHomeSection({
                    id: 'featured',
                    title: 'Seasonal',
                    type: HomeSectionType.featured
                }),
            },
            {
                request: createRequestObject({
                    url: `${MANGADEX_API}/manga?limit=20&contentRating[]=${demographics.join('&contentRating[]=')}&includes[]=cover_art`,
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
                    url: `${MANGADEX_API}/manga?limit=20&contentRating[]=${demographics.join('&contentRating[]=')}&includes[]=cover_art&order[updatedAt]=desc`,
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
                            image = `${COVER_BASE_URL}/${mangaId}/${coverFileName}.256.jpg`
                        } else {
                            image = 'https://i.imgur.com/6TrIues.jpg'
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
            case 'featured': {
                url = await this.getCustomListRequestURL('8018a70b-1492-4f91-a584-7451d7787f7a')
                break
            }
            case 'popular': {
                url = `${MANGADEX_API}/manga?limit=100&offset=${offset}&contentRating[]=${demographics.join('&contentRating[]=')}&includes[]=cover_art`
                break
            }
            case 'recently_updated': {
                url = `${MANGADEX_API}/manga?limit=100&offset=${offset}&contentRating[]=${demographics.join('&contentRating[]=')}&includes[]=cover_art&order[updatedAt]=desc`
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
                image = `${COVER_BASE_URL}/${mangaId}/${coverFileName}.256.jpg`
            } else {
                image = 'https://i.imgur.com/6TrIues.jpg'
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

    // async filterUpdatedManga(mangaUpdatesFoundCallback: (updates: MangaUpdates) => void, time: Date, ids: string[]): Promise<void> {
    //   let legacyIds: string[] = ids.filter(x => !x.includes('-'))
    //   let conversionDict: {[id: string]: string} = {}
    //   if (legacyIds.length != 0 ) {
    //     conversionDict = await this.getMangaUUIDs(legacyIds)
    //     for (const key of Object.keys(conversionDict)) {
    //       conversionDict[conversionDict[key]] = key
    //     }
    //   }

    //   let offset = 0
    //   let loadNextPage = true
    //   let updatedManga: string[] = []
    //   while (loadNextPage) {

    //     const updatedAt = time.toISOString().substr(0, time.toISOString().length - 5) // They support a weirdly truncated version of an ISO timestamp. A magic number of '5' seems to be always valid

    //     const request = createRequestObject({
    //       url: `${MANGADEX_API}/manga?limit=100&offset=${offset}&updatedAtSince=${updatedAt}`,
    //       method: 'GET',
    //     })

    //     const response = await this.requestManager.schedule(request, 1)

    //     // If we have no content, there are no updates available
    //     if(response.status == 204) {
    //       return
    //     }

    //     const json = typeof response.data === "string" ? JSON.parse(response.data) : response.data

    //     if(json.results === undefined) {
    //       // Log this, no need to throw.
    //       console.log(`Failed to parse JSON results for filterUpdatedManga using the date ${updatedAt} and the offset ${offset}`)
    //       return
    //     }

    //     for (const manga of json.results) {
    //       const mangaId = manga.data.id
    //       const mangaTime = new Date(manga.data.attributes.updatedAt)

    //       if (mangaTime <= time) {
    //         loadNextPage = false
    //       } else if (ids.includes(mangaId)) {
    //         updatedManga.push(mangaId)
    //       } else if (ids.includes(conversionDict[mangaId])) {
    //         updatedManga.push(conversionDict[mangaId])
    //       }
    //     }
    //     if (loadNextPage) {
    //       offset = offset + 100
    //     }
    //   }
    //   if (updatedManga.length > 0) {
    //     mangaUpdatesFoundCallback(createMangaUpdates({
    //         ids: updatedManga
    //     }))
    //   }
    // }

    decodeHTMLEntity(str: string): string {
        return entities.decodeHTML(str)
    }
}

class URLBuilder {
    parameters: Record<string, any> = {}
    pathComponents: string[] = []
    baseUrl: string
    constructor(baseUrl: string) {
        this.baseUrl = baseUrl.replace(/(^\/)?(?=.*)(\/$)?/gim, '')
    }

    addPathComponent(component: string): URLBuilder {
        this.pathComponents.push(component.replace(/(^\/)?(?=.*)(\/$)?/gim, ''))
        return this
    }

    addQueryParameter(key: string, value: any | any[]): URLBuilder {
        if(Array.isArray(value)) {
            for(const x of value) {
                this.parameters[key + '[]'] = x
            }
        } else {
            this.parameters[key] = value
        }
        return this
    }

    buildUrl({addTrailingSlash, includeUndefinedParameters}: {addTrailingSlash: boolean, includeUndefinedParameters: boolean} = {addTrailingSlash: false, includeUndefinedParameters: false}): string {
        return this.baseUrl + '/'
         + this.pathComponents.join('/')
          + (addTrailingSlash ? '/' : '')
           + (Object.values(this.parameters).length > 0 ? '?' : '')
            + Object.entries(this.parameters).map(x => x[1] != null || includeUndefinedParameters ? `${x[0]}=${x[1]}` : undefined).filter(x => x !== undefined).join('&')
    }
}