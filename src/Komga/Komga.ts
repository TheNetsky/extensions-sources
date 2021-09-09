import {
    Chapter,
    ChapterDetails,
    ContentRating,
    HomeSection,
    Manga,
    MangaStatus,
    MangaTile,
    MangaUpdates,
    PagedResults,
    Request,
    RequestInterceptor,
    Response,
    SearchRequest,
    Section,
    Source,
    SourceInfo,
    SourceStateManager,
    TagSection,
    TagType
} from 'paperback-extensions-common'

import { parseLangCode } from './Languages'

import {
    serverSettingsMenu,
    testServerSettingsMenu,
    resetSettingsButton
} from './KomgaSettings'

import { KomgaCommon } from './KomgaCommon'

// This source use Komga REST API
// https://komga.org/guides/rest.html

// Manga are represented by `series`
// Chapters are represented by `books`

// The Basic Authentication is handled by the interceptor

// Code and method used by both the source and the tracker are defined in the duplicated `KomgaCommon.ts` file

// Due to the self hosted nature of Komga, this source requires the user to enter its server credentials in the source settings menu
// Some methods are known to throw errors without specific actions from the user. They try to prevent this behavior when server settings are not set.
// This include:
//  - homepage sections
//  - getTags() which is called on the homepage
//  - search method which is called even if the user search in an other source

export const KomgaInfo: SourceInfo = {
    version: '1.2.2',
    name: 'Komga',
    icon: 'icon.png',
    author: 'Lemon',
    authorWebsite: 'https://github.com/FramboisePi',
    description: 'Extension that pulls manga from a Komga server',
    contentRating: ContentRating.EVERYONE,
    websiteBaseURL: 'https://komga.org',
    sourceTags: [
        {
            text: 'Self hosted',
            type: TagType.RED
        }
    ]
}

const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']

// Number of items requested for paged requests
const PAGE_SIZE = 40

export const parseMangaStatus = (komgaStatus: string) => {
    switch (komgaStatus) {
        case 'ENDED':
            return MangaStatus.COMPLETED
        case 'ONGOING':
            return MangaStatus.ONGOING
        case 'ABANDONED':
            return MangaStatus.ONGOING
        case 'HIATUS':
            return MangaStatus.ONGOING
    } 
    return MangaStatus.ONGOING
}

export const capitalize = (tag: string) => {
    return tag.replace(/^\w/, (c) => c.toUpperCase())
}

export class KomgaRequestInterceptor implements RequestInterceptor {
    /*
    Requests made to Komga must use a Basic Authentication. 
    This interceptor adds an authorization header to the requests.

    NOTE: The authorization header can be overridden by the request 
    */

    stateManager: SourceStateManager
    constructor(stateManager: SourceStateManager) {
        this.stateManager = stateManager
    }

    async getAuthorizationString(): Promise<string> {
        const authorizationString = await this.stateManager.retrieve('authorization') as string

        if (authorizationString === null) {
            throw new Error('Unset credentials in source settings')
        }
        return authorizationString
    }


    async interceptResponse(response: Response): Promise<Response> {
        return response
    }

    async interceptRequest(request: Request): Promise<Request> {

        if (request.headers === undefined) {
            request.headers = {}
        }

        // We mustn't call this.getAuthorizationString() for the stateful submission request.
        // This procedure indeed catchs the request used to check user credentials
        // which can happen before an authorizationString is saved,
        // raising an error in getAuthorizationString when we check for its existence
        // Thus we only inject an authorizationString if none are defined in the request
        if (request.headers.authorization === undefined) {
            request.headers.authorization = await this.getAuthorizationString()
        }

        return request
    }
}


export class Komga extends Source {

    async getAuthorizationString(): Promise<string> {
        const authorizationString = await this.stateManager.retrieve('authorization') as string

        if (authorizationString === null) {
            throw new Error('Unset credentials in source settings')
        }
        return authorizationString
    }

    async getKomgaAPI(): Promise<string> {
        const komgaAPI = await this.stateManager.retrieve('komgaAPI') as string

        if (komgaAPI === null) {
            throw new Error('Unset server URL in source settings')
        }
        return komgaAPI
    }

    stateManager = createSourceStateManager({})

    requestManager = createRequestManager({
        requestsPerSecond: 4,
        requestTimeout: 20000,
        interceptor: new KomgaRequestInterceptor(this.stateManager)
    })

    override async getSourceMenu(): Promise<Section> {
        return Promise.resolve(createSection({
            id: 'main',
            header: 'Source Settings',
            rows: () => Promise.resolve([
                serverSettingsMenu(this.stateManager),
                testServerSettingsMenu(this.stateManager, this.requestManager),
                resetSettingsButton(this.stateManager)
            ])
        }))
    }

    override async getTags(): Promise<TagSection[]> {
        // This function is called on the homepage and should not throw if the server is unavailable

        // We define two types of tags: 
        // - `genre` 
        // - `tag`
        // To be able to make the difference between theses types, we append `genre-` or `tag-` at the beginning of the tag id

        // TODO: we could add: collections

        let genresResponse: Response
        let tagsResponse: Response

        // We try to make the requests. If this fail, we return a placeholder tags list to inform the user and prevent the function from throwing an error
        try {
            const komgaAPI = await this.getKomgaAPI()

            const genresRequest = createRequestObject({
                url: `${komgaAPI}/genres/`,
                method: 'GET',
            })
            genresResponse = await this.requestManager.schedule(genresRequest, 1)

            const tagsRequest = createRequestObject({
                url: `${komgaAPI}/tags/series/`,
                method: 'GET',
            })
            tagsResponse = await this.requestManager.schedule(tagsRequest, 1)

        } catch (error) {
            console.log(`getTags failed with error: ${error}`)
            return [createTagSection({ id: '-1', label: 'Server unavailable', tags: [] })]
        }

        // The following part of the function should throw if there is an error and thus is not in the try/catch block

        const genresResult = (typeof genresResponse.data) === 'string' ? JSON.parse(genresResponse.data) : genresResponse.data
        const tagsResult = (typeof tagsResponse.data) === 'string' ? JSON.parse(tagsResponse.data) : tagsResponse.data

        const tagSections: TagSection[] = [
            createTagSection({ id: '0', label: 'genres', tags: [] }),
            createTagSection({ id: '1', label: 'tags', tags: [] })
        ]

        // For each tag, we append a type identifier to its id and capitalize its label
        tagSections[0]!.tags = genresResult.map((elem: string) => createTag({ id: 'genre-' + elem, label: capitalize(elem) }))
        tagSections[1]!.tags = tagsResult.map((elem: string) => createTag({ id: 'tag-' + elem, label: capitalize(elem) }))

        return tagSections
    }

    async getMangaDetails(mangaId: string): Promise<Manga> {
        /*
        In Komga a manga is represented by a `serie`
        */
        const komgaAPI = await this.getKomgaAPI()

        const request = createRequestObject({
            url: `${komgaAPI}/series/${mangaId}/`,
            method: 'GET',
        })

        const response = await this.requestManager.schedule(request, 1)
        const result = (typeof response.data) === 'string' ? JSON.parse(response.data) : response.data

        const metadata = result.metadata
        const booksMetadata = result.booksMetadata

        const tagSections: TagSection[] = [
            createTagSection({ id: '0', label: 'genres', tags: [] }),
            createTagSection({ id: '1', label: 'tags', tags: [] })
        ]
        // For each tag, we append a type identifier to its id and capitalize its label
        tagSections[0]!.tags = metadata.genres.map((elem: string) => createTag({ id: 'genre-' + elem, label: capitalize(elem) }))
        tagSections[1]!.tags = metadata.tags.map((elem: string) => createTag({ id: 'tag-' + elem, label: capitalize(elem) }))

        const authors: string[] = []
        const artists: string[] = []

        // Additional roles: colorist, inker, letterer, cover, editor
        for (const entry of booksMetadata.authors) {
            if (entry.role === 'writer') {
                authors.push(entry.name)
            }
            if (entry.role === 'penciller') {
                artists.push(entry.name)
            }
        }

        return createManga({
            id: mangaId,
            titles: [metadata.title],
            image: `${komgaAPI}/series/${mangaId}/thumbnail`,
            status: parseMangaStatus(metadata.status),
            langFlag: metadata.language,
            // Unused: langName

            artist: artists.join(', '),
            author: authors.join(', '),

            desc: (metadata.summary ? metadata.summary : booksMetadata.summary),
            tags: tagSections,
            lastUpdate: metadata.lastModified
        })
    }


    async getChapters(mangaId: string): Promise<Chapter[]> {
        /*
        In Komga a chapter is a `book`
        */

        const komgaAPI = await this.getKomgaAPI()

        const booksRequest = createRequestObject({
            url: `${komgaAPI}/series/${mangaId}/books`,
            param: '?unpaged=true&media_status=READY&deleted=false',
            method: 'GET',
        })

        const booksResponse = await this.requestManager.schedule(booksRequest, 1)
        const booksResult = (typeof booksResponse.data) === 'string' ? JSON.parse(booksResponse.data) : booksResponse.data

        const chapters: Chapter[] = []

        // Chapters language is only available on the serie page
        const serieRequest = createRequestObject({
            url: `${komgaAPI}/series/${mangaId}/`,
            method: 'GET',
        })
        const serieResponse = await this.requestManager.schedule(serieRequest, 1)
        const serieResult = (typeof serieResponse.data) === 'string' ? JSON.parse(serieResponse.data) : serieResponse.data
        const languageCode = parseLangCode(serieResult.metadata.language)

        for (const book of booksResult.content) {
            chapters.push(
                createChapter({
                    id: book.id,
                    mangaId: mangaId,
                    chapNum: book.metadata.numberSort,
                    langCode: languageCode,
                    name: `${book.metadata.number} - ${book.metadata.title} (${book.size})`,
                    time: new Date(book.fileLastModified),
                })
            )
        }

        return chapters
    }

    async getChapterDetails(mangaId: string, chapterId: string): Promise<ChapterDetails> {

        const komgaAPI = await this.getKomgaAPI()

        const request = createRequestObject({
            url: `${komgaAPI}/books/${chapterId}/pages`,
            method: 'GET',
        })

        const data = await this.requestManager.schedule(request, 1)
        const result = (typeof data.data === 'string') ? JSON.parse(data.data) : data.data

        const pages: string[] = []
        for (const page of result) {
            if (SUPPORTED_IMAGE_TYPES.includes(page.mediaType)) {
                pages.push(`${komgaAPI}/books/${chapterId}/pages/${page.number}`)
            } else {
                pages.push(`${komgaAPI}/books/${chapterId}/pages/${page.number}?convert=png`)
            }
        }

        // Determine the preferred reading direction which is only available in the serie metadata
        const serieRequest = createRequestObject({
            url: `${komgaAPI}/series/${mangaId}/`,
            method: 'GET',
        })

        const serieResponse = await this.requestManager.schedule(serieRequest, 1)
        const serieResult = typeof serieResponse.data === 'string' ? JSON.parse(serieResponse.data) : serieResponse.data

        let longStrip = false
        if (['VERTICAL', 'WEBTOON'].includes(serieResult.metadata.readingDirection)) {
            longStrip = true
        }

        return createChapterDetails({
            id: chapterId,
            longStrip: longStrip,
            mangaId: mangaId,
            pages: pages,
        })
    }


    override async getSearchResults(searchQuery: SearchRequest, metadata: any): Promise<PagedResults> {
        // This function is also called when the user search in an other source. It should not throw if the server is unavailable.
        
        return KomgaCommon.searchRequest(searchQuery, metadata, this.requestManager, this.stateManager, PAGE_SIZE)
    }

    override async getHomePageSections(sectionCallback: (section: HomeSection) => void): Promise<void> {
        // This function is called on the homepage and should not throw if the server is unavailable

        // We won't use `await this.getKomgaAPI()` as we do not want to throw an error on
        // the homepage when server settings are not set
        const komgaAPI = await this.stateManager.retrieve('komgaAPI')

        if (komgaAPI === null) {
            console.log('searchRequest failed because server settings are unset')
            const section = createHomeSection({
                id: 'unset',
                title: 'Go to source settings to set your Komga server credentials.',
                view_more: false,
                items: KomgaCommon.getServerUnavailableMangaTiles()
            })
            sectionCallback(section)
            return
        }

        // The source define two homepage sections: new and latest
        const sections = [
            createHomeSection({
                id: 'new',
                title: 'Recently added series',
                view_more: true,
            }),
            createHomeSection({
                id: 'updated',
                title: 'Recently updated series',
                view_more: true,
            }),
        ]

        const promises: Promise<void>[] = []

        for (const section of sections) {
            // Let the app load empty tagSections
            sectionCallback(section)

            const request = createRequestObject({
                url: `${komgaAPI}/series/${section.id}`,
                param: '?page=0&size=20&deleted=false',
                method: 'GET',
            })

            // Get the section data
            promises.push(
                this.requestManager.schedule(request, 1).then(data => {
                    const result = typeof data.data === 'string' ? JSON.parse(data.data) : data.data

                    const tiles = []
                    for (const serie of result.content) {
                        tiles.push(createMangaTile({
                            id: serie.id,
                            title: createIconText({ text: serie.metadata.title }),
                            image: `${komgaAPI}/series/${serie.id}/thumbnail`,
                        }))
                    }
                    section.items = tiles
                    sectionCallback(section)
                })
            )
        }

        // Make sure the function completes
        await Promise.all(promises)
    }

    override async getViewMoreItems(homepageSectionId: string, metadata: any): Promise<PagedResults> {

        const komgaAPI = await this.getKomgaAPI()
        const page: number = metadata?.page ?? 0

        const request = createRequestObject({
            url: `${komgaAPI}/series/${homepageSectionId}`,
            param: `?page=${page}&size=${PAGE_SIZE}&deleted=false`,
            method: 'GET',
        })

        const data = await this.requestManager.schedule(request, 1)
        const result = typeof data.data === 'string' ? JSON.parse(data.data) : data.data

        const tiles: MangaTile[] = []
        for (const serie of result.content) {
            tiles.push(createMangaTile({
                id: serie.id,
                title: createIconText({ text: serie.metadata.title }),
                image: `${komgaAPI}/series/${serie.id}/thumbnail`,
            }))
        }

        // If no series were returned we are on the last page
        metadata = tiles.length === 0 ? undefined : { page: page + 1 }

        return createPagedResults({
            results: tiles,
            metadata: metadata
        })
    }

    override async filterUpdatedManga(mangaUpdatesFoundCallback: (updates: MangaUpdates) => void, time: Date, ids: string[]): Promise<void> {

        const komgaAPI = await this.getKomgaAPI()

        // We make requests of PAGE_SIZE titles to `series/updated/` until we got every titles 
        // or we got a title which `lastModified` metadata is older than `time`
        let page = 0
        const foundIds: string[] = []
        let loadMore = true

        while (loadMore) {

            const request = createRequestObject({
                url: `${komgaAPI}/series/updated/`,
                param: `?page=${page}&size=${PAGE_SIZE}&deleted=false`,
                method: 'GET',
            })

            const data = await this.requestManager.schedule(request, 1)
            const result = typeof data.data === 'string' ? JSON.parse(data.data) : data.data

            for (const serie of result.content) {
                const serieUpdated = new Date(serie.metadata.lastModified)

                if (serieUpdated >= time) {
                    if (ids.includes(serie)) {
                        foundIds.push(serie)
                    }
                }
                else {
                    loadMore = false
                    break
                }
            }

            // If no series were returned we are on the last page
            if (result.content.length === 0) {
                loadMore = false
            }

            page = page + 1

            if (foundIds.length > 0) {
                mangaUpdatesFoundCallback(createMangaUpdates({
                    ids: foundIds
                }))
            }
        }
    }
}
