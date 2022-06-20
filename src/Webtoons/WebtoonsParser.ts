import {
    Chapter,
    LanguageCode,
    ChapterDetails,
    HomeSection,
    Manga,
    MangaStatus,
    MangaTile,
    HomeSectionType,
    TagSection,
    Tag,
} from 'paperback-extensions-common'

import entities = require('entities')

export class Parser {

    parseMangaDetails($: CheerioStatic, mangaId: string): Manga {
        const title = $('.subj').text().split('\n')[0]?.trim() ?? ''
        const desc = $('p.summary').text().trim() ?? ''
        const image = $('.background_pic').find('img').attr('src') ?? $('.detail_chal_pic').find('img').attr('src') 
        const rating = Number($('em.grade_num').text().replace(',', '.').trim()) ?? 0
        const status = MangaStatus.ONGOING
        const author = $('.author').text().trim().split(/\r?\n/)[0]?.trim()

        // The site only provides one primary tag for each series
        const label = $('.genre').text().replace(/ /g, '-').toLowerCase().trim()
        const genreId = $('.genre').text().trim()
        const genres = [(createTag({ label: label, id: genreId }))]
        const tags: TagSection[] = [createTagSection({ id: '0', label: 'genres', tags: genres })]

        return createManga({
            id: mangaId,
            titles: [this.decodeHTMLEntity(title)],
            image: image ?? '',
            author,
            rating,
            status,
            desc: this.decodeHTMLEntity(desc),
            tags
        })
    }


    parseChapters($: CheerioStatic, mangaId: string, languageCode: string): Chapter[] {
        const chapters: Chapter[] = []
        const langCode = this.parseLanguageCode(languageCode)

        for (const chapter of $('#_episodeList').find('li').toArray()) {
            const id = $(chapter).attr('data-episode-no')
            const chapNum = Number(id)
            const name = $(chapter).find('.sub_title').find('span').first().text().trim()
            const time = new Date($(chapter).find('.date').text().trim())

            if (!id) continue

            chapters.push(createChapter({
                id,
                mangaId,
                chapNum: isNaN(chapNum) ? 0 : chapNum,
                langCode,
                name,
                time
            }))
        }
        return chapters
    }

    parseLanguageCode(languageCode: string): LanguageCode {
        switch (languageCode) {
            case 'en':
                return LanguageCode.ENGLISH
            case 'fr':
                return LanguageCode.FRENCH
            case 'de':
                return LanguageCode.GERMAN
            case 'es':
                return LanguageCode.SPANISH
            case 'th':
                return LanguageCode.THAI
            case 'id':
                return LanguageCode.INDONESIAN
            case 'zh-hant':
                return LanguageCode.CHINEESE
            default:
                return LanguageCode.UNKNOWN
        }
    }

    parseChapterDetails($: CheerioStatic, mangaId: string, id: string): ChapterDetails {
        const pages: string[] = []

        for (const img of $('.viewer_lst').find('img').toArray()) {
            const imgUrl = $(img).attr('data-url')?.trim() ?? $(img).attr('src')?.trim()

            if (!imgUrl) continue
            pages.push(imgUrl)
        }

        return createChapterDetails({
            id,
            mangaId,
            pages,
            longStrip: true,
        })
    }

    parseSearchResults($: CheerioStatic, langString: any, type: string, tagSearch: string): MangaTile[] {
        const results: MangaTile[] = []

        if (type == 'title') {
            const resultUl = tagSearch == 'CHALLENGE' ? '.challenge_lst.search' : '.card_lst'
            for (const result of $(resultUl).find('li').toArray()) {
                const genre = $(result).find('span').text().toLowerCase().replace('like', '').trim()
                const title = $(result).find('.subj').text().trim()
                const urlTitle = title.replace(/-|'/g, '').replace(/ /g, '-').toLowerCase()
                const idNumber = $(result).find('a').attr('href')?.split('titleNo=')[1]
                const id = `${tagSearch == 'CHALLENGE' ? 'challenge' : genre}/${urlTitle}/list?title_no=${idNumber}`
                const subtitle = $(result).find('.author').text().trim() ?? ''

                if (!id || !title) continue
                const image = $(result).find('img').attr('src') ?? ''
                results.push(createMangaTile({
                    id: id,
                    image: image ?? 'https://i.imgur.com/GYUxEX8.png',
                    title: createIconText({ text: this.decodeHTMLEntity(title) }),
                    subtitleText: createIconText({ text: this.decodeHTMLEntity(subtitle) })
                }))
            }
        }

        if (type == 'tag') {
            /* 
                The layout on the genre page is 'h2' > 'ul' for each genre, 
                so there will be an array of h2s and an array of uls
            */
            const tagTitlesArray: string[] = []
            const tagComicsArray: CheerioElement[][] = []
            let index = 0

            // Find all genre titles on page
            for (const title of $('.card_wrap.genre').find('h2').toArray()) {
                const tagTitle = $(title).attr('data-genre-seo')?.trim()
                if (!tagTitle) continue
                tagTitlesArray.push(tagTitle)
            }

            // Find corresponding list of webtoons
            for (const tagComic of $('.card_wrap.genre').find('ul.card_lst').toArray()) {
                const comicList = $(tagComic).find('li').toArray()
                tagComicsArray.push(comicList)
            }

            /* 
                If the tag that is searched matches any of the tags in the titles array, set that to
               the index. For example, if the tag 'drama' is tagTitlesArray[1], then the drama webtoons
               list will be tagComicsArray[1]
            */
            for (let i = 0; i < tagComicsArray.length; i++) {
                if (tagTitlesArray[i] == tagSearch) index = i
            }

            // Use the index to add the correct webtoons to the results
            for (const comicTile of tagComicsArray[index] ?? []) {
                const id = $(comicTile).find('a').attr('href')?.split(`${langString}/`)[1] ?? ''
                const title = $(comicTile).find('.subj').text().trim()
                const image = $(comicTile).find('img').attr('src') ?? ''
                const subtitle = $(comicTile).find('.author').text().trim() ?? ''

                if (!id || !title) continue
                results.push(createMangaTile({
                    id: id,
                    image: image ?? 'https://i.imgur.com/GYUxEX8.png',
                    title: createIconText({ text: this.decodeHTMLEntity(title) }),
                    subtitleText: createIconText({ text: this.decodeHTMLEntity(subtitle) })
                }))
            }
        }
        return results
    }

    parseHomeSections($: CheerioStatic, sectionCallback: (section: HomeSection) => void, langString: any): void {
        let popularTitle, newTrendTitle, canvasTitle
        switch (langString) {
            case 'fr':
                popularTitle = 'Nouvelle Tendance'
                newTrendTitle = 'Le Plus Populaire'
                canvasTitle = 'Canvas Le Plus Populaire'
                break
            case 'de':
                popularTitle = 'Neu und Beliebt'
                newTrendTitle = 'Beliebte'
                canvasTitle = 'Top Canvas'
                break
            case 'es':
                popularTitle = 'Más Popular'
                newTrendTitle = 'Nuevas Tendencias'
                canvasTitle = 'Más Popular En Canvas'
                break
            case 'th':
                popularTitle = 'อันดับตามประเภท'
                newTrendTitle = 'เรื่องใหม่มาแรง'
                canvasTitle = 'อันดับตามประเภท'
                break
            case 'id':
                popularTitle = 'TERPOPULER BERDASARKAN GENRE'
                newTrendTitle = 'BARU & TRENDING'
                canvasTitle = 'KANVAS TERPOPULER BERDASARKAN GENRE'
                break
            case 'zh-hant':
                popularTitle = '分類排行榜'
                newTrendTitle = '熱門新作排行榜'
                canvasTitle = '投稿新星作品分類排行榜'
                break
            default:
                popularTitle = 'Top Originals'
                newTrendTitle = 'New and Trending'
                canvasTitle = 'Top Canvas'
        }

        const popularSection = createHomeSection({
            id: '0',
            title: popularTitle,
            type: HomeSectionType.singleRowNormal,
            view_more: false
        })

        const newTrendSection = createHomeSection({
            id: '1',
            title: newTrendTitle,
            type: HomeSectionType.singleRowNormal,
            view_more: false
        })

        const canvasSection = createHomeSection({
            id: '2', title: canvasTitle,
            type: HomeSectionType.singleRowNormal,
            view_more: false
        })

        const popularArray = []
        for (const popularComic of $('.ranking_lst.popular').next().find('ul > li').toArray()) {
            if (popularArray.length >= 10) break
            const id = $('a', popularComic).attr('href')?.split(`${langString}/`)[1] ?? ''
            const image = $(popularComic).find('img').attr('src') ?? ''
            const title = $(popularComic).find('.subj').text().trim() ?? ''
            const subtitle = $(popularComic).find('.author').text().trim() ?? ''

            if (!id || !title || id.startsWith('challenge') || id.startsWith('top?rankingGenre')) continue

            popularArray.push(createMangaTile({
                id: id,
                image: image ?? 'https://i.imgur.com/GYUxEX8.png',
                title: createIconText({ text: this.decodeHTMLEntity(title) }),
                subtitleText: createIconText({ text: this.decodeHTMLEntity(subtitle) })
            }))
        }

        popularSection.items = popularArray
        sectionCallback(popularSection)

        const newTrendArray = []
        for (const newTrendComic of $('ul.lst_type1').find('li').toArray()) {
            if (newTrendArray.length >= 10) break
            const id = $('a', newTrendComic).attr('href')?.split(`${langString}/`)[1] ?? ''
            const image = $(newTrendComic).find('img').attr('src') ?? ''
            const title = $(newTrendComic).find('.subj').text().trim() ?? ''
            const subtitle = $(newTrendComic).find('.author').text().trim() ?? ''

            if (!id || !title || id.startsWith('challenge')) continue

            newTrendArray.push(createMangaTile({
                id: id,
                image: image ?? 'https://i.imgur.com/GYUxEX8.png',
                title: createIconText({ text: this.decodeHTMLEntity(title) }),
                subtitleText: createIconText({ text: this.decodeHTMLEntity(subtitle) })
            }))
        }

        newTrendSection.items = newTrendArray
        sectionCallback(newTrendSection)

        const canvasArray = []
        for (const canvasComic of $('.ranking_lst.popular').next().next().find('ul > li').toArray()) {
            if (canvasArray.length >= 10) break
            const id = $('a', canvasComic).attr('href')?.split(`${langString}/`)[1] ?? ''
            const image = $(canvasComic).find('img').attr('src') ?? ''
            const title = $(canvasComic).find('.subj').text().trim() ?? ''
            const subtitle = $(canvasComic).find('.author').text().trim() ?? ''

            if (!id || !title || id.startsWith('top?rankingGenre')) continue

            canvasArray.push(createMangaTile({
                id: id,
                image: image ?? 'https://i.imgur.com/GYUxEX8.png',
                title: createIconText({ text: this.decodeHTMLEntity(title) }),
                subtitleText: createIconText({ text: this.decodeHTMLEntity(subtitle) })
            }))
        }

        canvasSection.items = canvasArray
        sectionCallback(canvasSection)
    }

    parseTags($: CheerioStatic): TagSection[] {
        const genres: Tag[] = []
        for (const tagHeader of $('div.card_wrap.genre').find('h2').toArray()) {
            const id = $(tagHeader).attr('data-genre-seo')?.trim() ?? ''
            const label = $(tagHeader).text().trim()
            if (!id || !label) continue

            genres.push(createTag({ label: label, id: id }))
        }
        // Allows for users to search for Original or Canvas comics. Cannot search for both.
        const searchType: Tag[] = [
            createTag({label: 'Canvas', id:'CHALLENGE'}),
            createTag({label: 'Original',id:'WEBTOON'})
        ]
        const genresSection = createTagSection({ id: '0', label: 'genres', tags: genres })
        const searchTypeSection = createTagSection({ id: '1', label: 'search-type', tags: searchType})
        return [genresSection, searchTypeSection]
    }

    protected decodeHTMLEntity(str: string): string {
        return entities.decodeHTML(str)
    }
}