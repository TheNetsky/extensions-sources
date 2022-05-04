import { LanguageCode } from 'paperback-extensions-common'

interface Language {
    name: string,
    NHCode: string,
    PBCode: LanguageCode,
    default?: boolean
}

class NHLanguagesClass {
    Languages: Language[] = [
        // Include all langauages
        {
            name: 'Include All',
            NHCode: '',
            PBCode: LanguageCode.UNKNOWN,
            default: true
        },
        {
            // English
            name: 'English',
            NHCode: 'english',
            PBCode: LanguageCode.ENGLISH
        },
        {
            // Japanese
            name: '日本語',
            NHCode: 'japanese',
            PBCode: LanguageCode.JAPANESE
        },
        {
            // Chinese (Simplified)
            name: '中文 (简化字)',
            NHCode: 'chinese',
            PBCode: LanguageCode.CHINEESE
        },


    ]

    constructor() {
        // Sorts the languages based on name
        this.Languages = this.Languages.sort((a, b) => a.name > b.name ? 1 : -1)
    }

    getNHCodeList(): string[] {
        return this.Languages.map(Language => Language.NHCode)
    }

    getName(NHCode: string): string {
        return this.Languages.filter(Language => Language.NHCode == NHCode)[0]?.name ?? 'Unknown'
    }

    getPBCode(NHCode: string): LanguageCode {
        return this.Languages.filter(Language => Language.NHCode == NHCode)[0]?.PBCode ?? LanguageCode.UNKNOWN
    }

    getDefault(): string[] {
        return this.Languages.filter(Language => Language.default).map(Language => Language.NHCode)
    }
}

export const NHLanguages = new NHLanguagesClass()

interface SortOrder {
    name: string,
    NHCode: string,
    shortcuts: string[],
    default?: boolean
}

class NHSortOrderClass {
    SortOrders: SortOrder[] = [
        {
            // Sort by popular
            name: 'Popular all-time',
            NHCode: 'popular',
            shortcuts: ['s:p', 's:popular', 'sort:p', 'sort:popular'],
            default: true
        },
        {
            // Sort by popular this week
            name: 'Popular this week',
            NHCode: 'popular-week',
            shortcuts: ['s:pw', 's:w', 's:popular-week', 'sort:pw', 'sort:w', 'sort:popular-week'],
        },
        {
            // Sort by popular today
            name: 'Popular today',
            NHCode: 'popular-today',
            shortcuts: ['s:pt', 's:t', 's:popular-today', 'sort:pt', 'sort:t', 'sort:popular-today'],
        },
        {
            // Sort by recent
            name: 'Recent',
            NHCode: 'date',
            shortcuts: ['s:r', 's:recent', 'sort:r', 'sort:recent'],
        },


    ]

    constructor() {
        // Sorts the sort orders based on name
        this.SortOrders = this.SortOrders.sort((a, b) => a.name > b.name ? 1 : -1)
    }

    containsShortcut(query: string): string[] {
        for (const SortOrder of this.SortOrders) {
            for (const shortcut of SortOrder.shortcuts) {
                if (query.includes(shortcut)) {
                    return [SortOrder.NHCode, shortcut]
                }
            }
        }
        return ['', '']
    }

    getNHCodeList(): string[] {
        return this.SortOrders.map(SortOrder => SortOrder.NHCode)
    }

    getName(NHCode: string): string {
        return this.SortOrders.filter(SortOrder => SortOrder.NHCode == NHCode)[0]?.name ?? 'Unknown'
    }

    getDefault(): string[] {
        return this.SortOrders.filter(SortOrder => SortOrder.default).map(SortOrder => SortOrder.NHCode)
    }
}

export const NHSortOrders = new NHSortOrderClass()
