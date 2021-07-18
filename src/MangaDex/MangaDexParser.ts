/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { MangaTile} from 'paperback-extensions-common'
import { MDImageQuality } from './MangaDexHelper'

export const parseMangaList = async (object: any, source: any, thumbnailSelector: any): Promise<MangaTile[]> => {
    const results: MangaTile[] = []

    for (const manga of object) {
        const mangaId = manga.data.id
        const mangaDetails = manga.data.attributes
        const title = source.decodeHTMLEntity(Object.values(mangaDetails.title)[0] as string)
        const coverFileName = manga.relationships.filter((x: any) => x.type == 'cover_art').map((x: any) => x.attributes?.fileName)[0]
        const image = coverFileName ? `${source.COVER_BASE_URL}/${mangaId}/${coverFileName}${MDImageQuality.getEnding(await thumbnailSelector(source.stateManager))}` : 'https://mangadex.org/_nuxt/img/cover-placeholder.d12c3c5.jpg'

        results.push(createMangaTile({
            id: mangaId,
            title: createIconText({text: title}),
            image
        }))
    }
    
    return results
}

export const parseChapterList = async (chapterObject: any, coversMapping: {[id: string]: string}, source: any, thumbnailSelector: any, ratings: string[]): Promise<MangaTile[]> => {
    const results: MangaTile[] = []

    for (const chapter of chapterObject) {
        const mangaId = chapter.relationships.filter((x: any) => x.type == 'manga').map((x: any) => x.id)[0]
        const title = chapter.relationships.filter((x: any) => x.type == 'manga').map((x: any) => x.attributes.title.en)[0]
        const volume_num = chapter.data.attributes.volume
        const chapter_num = chapter.data.attributes.chapter
        const subtitle = `${volume_num ? `Vol. ${volume_num}` : ''} ${chapter_num ? `Ch. ${chapter_num}` : ''}`

        const coverFileName = coversMapping[mangaId]
        const image = coverFileName ? `${source.COVER_BASE_URL}/${mangaId}/${coverFileName}${MDImageQuality.getEnding(await thumbnailSelector(source.stateManager))}` : 'https://mangadex.org/_nuxt/img/cover-placeholder.d12c3c5.jpg'

        if (!mangaId || !title || !ratings.includes(chapter.relationships.filter((x: any) => x.type == 'manga').map((x: any) => x.attributes.contentRating)[0])) continue

        results.push(createMangaTile({
            id: mangaId,
            title: createIconText({text: title}),
            subtitleText: createIconText({text: subtitle}),
            image: image
        }))
    }
    
    return results
}