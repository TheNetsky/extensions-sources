import cheerio from 'cheerio'
import { NHentai } from '../NHentai/NHentai'
import { APIWrapper,
    Source } from 'paperback-extensions-common'

describe('nHentai Tests', () => {

    const wrapper: APIWrapper = new APIWrapper()
    const source: Source = new NHentai(cheerio)
    const chai = require('chai'), expect = chai.expect, should = chai.should()
    const chaiAsPromised = require('chai-as-promised')
    chai.use(chaiAsPromised)

    /**
     * The Manga ID which this unit test uses to base it's details off of.
     * Try to choose a manga which is updated frequently, so that the historical checking test can 
     * return proper results, as it is limited to searching 30 days back due to extremely long processing times otherwise.
     */
    const hentaiId = '286444'

    it('Retrieve Manga Details', async () => {
        const details = await wrapper.getMangaDetails(source, hentaiId)

        const data = details
        expect(data.id, 'Missing ID').to.be.not.empty
        expect(data.image, 'Missing Image').to.be.not.empty
        expect(data.artist, 'Missing Artist').to.be.not.empty
        expect(data.hentai, 'Missing Hentai').to.exist
    })

    it('Get Chapters', async () => {
        const data = await wrapper.getChapters(source, hentaiId)
        expect(data, 'No chapters present for: [' + hentaiId + ']').to.not.be.empty
    })

    it('Get Chapter Details', async () => {

        const chapters = await wrapper.getChapters(source, hentaiId)
        const data = await wrapper.getChapterDetails(source, hentaiId, chapters[0].id)

        expect(data, 'No server response').to.exist
        expect(data, 'Empty server response').to.not.be.empty

        expect(data.id, 'Missing ID').to.be.not.empty
        expect(data.mangaId, 'Missing hentaiId').to.be.not.empty
        expect(data.pages, 'No pages present').to.be.not.empty
    })


    it('Searching for Manga With Multiple Keywords', async () => {
        const testSearch = createSearchRequest({
            title: 'sole female bikini -rape',
        })

        const search = await wrapper.searchRequest(source, testSearch)
        const result = search.results[0]

        expect(result, 'No response from server').to.exist

        expect(result.id, 'No ID found for search query').to.be.not.empty
        expect(result.image, 'No image found for search').to.be.not.empty
        expect(result.title, 'No title').to.be.not.null
        expect(result.subtitleText, 'No subtitle text').to.be.not.null
        expect(result.primaryText, 'No primary text').to.be.not.null
        expect(result.secondaryText, 'No secondary text').to.be.not.null

    })

    it('Searching for Manga With A Valid six-digit query', async () => {
        const testSearch = createSearchRequest({
            title: '312483',
        })

        const search = await wrapper.searchRequest(source, testSearch)
        const result = search.results[0]
        expect(result).to.exist

        expect(result.id).to.exist
        expect(result.image).to.exist
        expect(result.title).to.exist
    })

    it('Searching for Manga With A Valid five-digit query', async () => {
        const testSearch = createSearchRequest({
            title: '98125',
        })

        const search = await wrapper.searchRequest(source, testSearch)
        const result = search.results[0]
        expect(result).to.exist

        expect(result.id).to.exist
        expect(result.image).to.exist
        expect(result.title).to.exist
    })

    it('Searching for Manga With an invalid six-digit query', async () => {
        const testSearch = createSearchRequest({
            title: '999999',
        })

        try {
            const search = await wrapper.searchRequest(source, testSearch)
            expect(false)
        }
        catch {
            expect(true)
        }
    })

    it('Searching with Hentai settings disabled', async () => {
        const testSearch = createSearchRequest({
            title: 'Women',
            hStatus: false
        })

        const search = await wrapper.searchRequest(source, testSearch)
        expect(search.results).to.be.empty
    })


    it('Retrieve Home Page Sections', async () => {

        const data = await wrapper.getHomePageSections(source)
        expect(data, 'No response from server').to.exist
        expect(data, 'No response from server').to.be.not.empty

        const newHentai = data[0]
        expect(newHentai.id, 'Popular Titles ID does not exist').to.not.be.empty
        expect(newHentai.title, 'Popular manga section does not exist').to.not.be.empty
        expect(newHentai.items, 'No items available for popular titles').to.not.be.empty
    })

    it('Show More Homepage data', async () => {
        const data = await wrapper.getViewMoreItems(source, 'none', {})
        expect(data, 'No response from server').to.exist
        expect(data, 'No response from server').to.be.not.empty
    })

})
