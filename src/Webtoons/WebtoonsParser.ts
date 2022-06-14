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

export class Parser {
    parseMangaDetails($:CheerioStatic, mangaId: string): Manga {
        const titles = [$('.subj').text().split('\n')[0]?.trim() ?? '']
        const desc = $('p.summary').text().trim() ?? ''
        const image = $('.background_pic').find('img').attr('src') ?? ''
        const rating = Number($('em.grade_num').text().replace(',','.').trim()) ?? 0
        const status = MangaStatus.ONGOING
        const author = $('.author').text().trim().split(/\r?\n/)[0]?.trim()

        // The site only provides one primary tag for each series
        const label = $('.genre').text().replace(/ /g, '-').toLowerCase().trim()
        const genreId = $('.genre').text().trim()
        const genres = [(createTag({ label: label, id: genreId }))]
        const tags: TagSection[] = [createTagSection({ id: '0', label: 'genres', tags: genres })]

        return createManga({
            id: mangaId,
            titles,
            image,
            author,
            status,
            rating,
            desc,
            tags
        })
    }

    
    parseChapters($:CheerioStatic, mangaId:string, languageCode: string): Chapter[] {
        const chapters: Chapter[] = []
        const langCode = this.parseLanguageCode(languageCode)
        for (const chapter of $('#_episodeList').find('li').toArray()){
            const id = $(chapter).attr('data-episode-no')
            const chapNum = Number(id)
            const name = $(chapter).find('.sub_title').find('span').first().text().trim()
            const time = new Date($(chapter).find('.date').text().trim())
            if (!id) continue
            chapters.push(
                createChapter({
                    id,
                    mangaId,
                    chapNum,
                    langCode,
                    name,
                    time
                })
            )
        }
        return chapters
    }
    parseLanguageCode(languageCode: string): LanguageCode {
        if(languageCode == 'en') return LanguageCode.ENGLISH
        if(languageCode == 'fr') return LanguageCode.FRENCH
        if(languageCode == 'de') return LanguageCode.GERMAN
        if(languageCode == 'es') return LanguageCode.SPANISH
        if(languageCode == 'th') return LanguageCode.THAI
        if(languageCode == 'id') return LanguageCode.INDONESIAN
        if(languageCode == 'zh-hant') return LanguageCode.CHINEESE
        return LanguageCode.UNKNOWN
    }

    parseChapterDetails($:CheerioStatic, mangaId:string, id: string): ChapterDetails{
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

    parseSearchResults($:CheerioStatic, langString: any, type: string, tagSearch:string): MangaTile[]{
        const results: MangaTile[] = []
        if (type == 'title') {
            for(const result of $('.card_lst').find('li').toArray()){
                const genre = $(result).find('span').text().toLowerCase().replace('like', '').trim()
                const title = $(result).find('.subj').text().trim()
                const urlTitle = title.replace(/-|'/g, '').replace(/ /g, '-').toLowerCase()
                const idNumber = $(result).find('a').attr('href')?.split('titleNo=')[1]
                const id = `${genre}/${urlTitle}/list?title_no=${idNumber}`
                if (!id) continue
                const image = $(result).find('img').attr('src') ?? ''
                results.push(createMangaTile({
                    id,
                    image,
                    title: createIconText({ text: title})
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
            for (const title of $('.card_wrap.genre').find('h2').toArray()){
                const tagTitle = $(title).attr('data-genre-seo')?.trim()
                if(!tagTitle) continue
                tagTitlesArray.push(tagTitle)
            }

            // Find corresponding list of webtoons
            for (const tagComic of $('.card_wrap.genre').find('ul.card_lst').toArray()){
                const comicList = $(tagComic).find('li').toArray()
                tagComicsArray.push(comicList)
            }

            /* 
                If the tag that is searched matches any of the tags in the titles array, set that to
               the index. For example, if the tag 'drama' is tagTitlesArray[1], then the drama webtoons
               list will be tagComicsArray[1]
            */
            for (let i = 0; i < tagComicsArray.length; i++){
                if(tagTitlesArray[i] == tagSearch) index = i
            }

            // Use the index to add the correct webtoons to the results
            for (const comicTile of tagComicsArray[index] ?? []) {
                const title = $(comicTile).find('.subj').text().trim()
                const image = $(comicTile).find('img').attr('src') ?? ''
                const id = $(comicTile).find('a').attr('href')?.split(`${langString}/`)[1] ?? ''
                if(!id) continue
                results.push(createMangaTile({
                    id,
                    image,
                    title: createIconText({ text: title})
                }))
            }
        }
        return results
    }
    parseHomeSectionTitles(languageCode: string) {
        let popularTitle: string, newTrendTitle: string, canvasTitle: string
        if(languageCode == 'fr') return [popularTitle = 'Nouvelle Tendance', newTrendTitle = 'Le Plus Populaire', canvasTitle = 'Canvas Le Plus Populaire']
        if(languageCode == 'de') return [popularTitle = 'Neu und Beliebt', newTrendTitle = 'Beliebte', canvasTitle = 'Top Canvas']
        if(languageCode == 'es') return [popularTitle = 'Más Popular', newTrendTitle = 'Nuevas Tendencias', canvasTitle = 'Más Popular En Canvas']
        if(languageCode == 'th') return [popularTitle = 'อันดับตามประเภท', newTrendTitle = 'เรื่องใหม่มาแรง', canvasTitle = 'อันดับตามประเภท']
        if(languageCode == 'id') return [popularTitle = 'TERPOPULER BERDASARKAN GENRE', newTrendTitle = 'BARU & TRENDING', canvasTitle = 'KANVAS TERPOPULER BERDASARKAN GENRE']
        if(languageCode == 'zh-hant') return [popularTitle = '分類排行榜', newTrendTitle = '熱門新作排行榜', canvasTitle = '投稿新星作品分類排行榜']
        return [popularTitle = 'Top Originals', newTrendTitle = 'New and Trending', canvasTitle = 'Top Canvas']    
    }
    parseHomeSections ($: CheerioStatic, sectionCallback: (section: HomeSection) => void, langString: any): void {
        const [popularTitle, newTrendTitle, canvasTitle] = this.parseHomeSectionTitles(langString)
        const popularSection = createHomeSection({id: '0',title: popularTitle!, type: HomeSectionType.singleRowNormal,view_more: false,})
        const newTrendSection = createHomeSection({id: '1',title: newTrendTitle!, type: HomeSectionType.singleRowNormal,view_more: false,})
        const canvasSection = createHomeSection({id: '2',title: canvasTitle!, type: HomeSectionType.singleRowNormal,view_more: false,})
        const popular = []
        const newTrend = []
        const canvas = []
      
        for (const popularComic of $('.ranking_lst.popular').next().find('ul > li').toArray()) {
            if (popular.length >= 10) break
            const mangaId = $('a', popularComic).attr('href')?.split(`${langString}/`)[1] ?? ''
            if (mangaId.startsWith('top?rankingGenre')) continue
            if (mangaId.startsWith('challenge')) continue
            if (!mangaId) continue
            const image = $(popularComic).find('img').attr('src') ?? ''
            const title = $(popularComic).find('.subj').text().trim() ?? ''
            popular.push(
                createMangaTile({
                    id: mangaId,
                    image: image ?? 'https://i.imgur.com/GYUxEX8.png',
                    title: createIconText({
                        text: title,
                    }),
                })
            )
        }
        
        popularSection.items = popular
        sectionCallback(popularSection)
      

        for (const newTrendComic of $('ul.lst_type1').find('li').toArray()) {
            if (newTrend.length >= 10) break
            const mangaId = $('a',newTrendComic).attr('href')?.split(`${langString}/`)[1] ?? ''
            const image = $(newTrendComic).find('img').attr('src') ?? ''
            const title = $(newTrendComic).find('.subj').text().trim() ?? ''
            if (mangaId.startsWith('challenge')) continue
            if(!mangaId) continue
      
            newTrend.push(
                createMangaTile({
                    id: mangaId,
                    image: image ?? 'https://i.imgur.com/GYUxEX8.png',
                    title: createIconText({
                        text: title,
                    }),
                })
            )
        }
        
        newTrendSection.items = newTrend
        sectionCallback(newTrendSection)

        for (const canvasComic of $('.ranking_lst.popular').next().next().find('ul > li').toArray()) {
            if (canvas.length >= 10) break
            const mangaId = $('a',canvasComic).attr('href')?.split(`${langString}/`)[1] ?? ''
            const image = $(canvasComic).find('img').attr('src') ?? ''
            const title = $(canvasComic).find('.subj').text().trim() ?? ''
            if (mangaId.startsWith('top?rankingGenre')) continue
            if(!mangaId)continue
      
            canvas.push(
                createMangaTile({
                    id: mangaId,
                    image: image ?? 'https://i.imgur.com/GYUxEX8.png',
                    title: createIconText({
                        text: title,
                    }),
                })
            )
        }
        
        canvasSection.items = canvas
        sectionCallback(canvasSection)
    }
    parseTags($: CheerioStatic):TagSection[]{
        const genres: Tag[] = []
        for (const tagHeader of $('div.card_wrap.genre').find('h2').toArray()){
            const id = $(tagHeader).attr('data-genre-seo')?.trim() ?? ''
            if(!id) continue
            const label = $(tagHeader).text().trim()
            genres.push(createTag({ label: label, id: id }))
        }
        return [createTagSection({ id: '0', label: 'genres', tags: genres })]
    }
}