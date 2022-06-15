import {
    SourceStateManager,
    NavigationButton
} from 'paperback-extensions-common'

interface Language {
    name: string,
    WTCode: string,
    PBCode: string,
    default?: boolean
}

class WTLanguagesClass {
    Languages: Language[] = [
        {
            // German
            name: 'Deutsch',
            WTCode: 'de',
            PBCode: 'de'
        },
        {
            // English
            name: 'English',
            WTCode: 'en',
            PBCode: 'gb',
            default: true
        },
        {
            // Spanish
            name: 'Español',
            WTCode: 'es',
            PBCode: 'es'
        },
        {
            // French
            name: 'Français',
            WTCode: 'fr',
            PBCode: 'fr'
        },
        {
            // Indonesian
            name: 'Indonesia',
            WTCode: 'id',
            PBCode: 'id'
        },
        {
            // Thai
            name: 'ไทย',
            WTCode: 'th',
            PBCode: 'th'
        },
        {
            // Chinese (Traditional)
            name: '中文 (繁體字)',
            WTCode: 'zh-hant',
            PBCode: 'hk'
        },
    ]

    constructor() {
        // Sorts the languages based on name
        this.Languages = this.Languages.sort((a, b) => a.name > b.name ? 1 : -1)
    }

    getWTCodeList(): string[] {
        return this.Languages.map(Language => Language.WTCode)
    }

    getName(WTCode: string): string {
        return this.Languages.filter(Language => Language.WTCode == WTCode)[0]?.name ?? 'Unknown'
    }

    getPBCode(WTCode: string): string {
        return this.Languages.filter(Language => Language.WTCode == WTCode)[0]?.PBCode ?? '_unknown'
    }

    getDefault(): string[] {
        return this.Languages.filter(Language => Language.default).map(Language => Language.WTCode)
    }
}

export const WTLanguages = new WTLanguagesClass()

export const getLanguages = async (stateManager: SourceStateManager): Promise<string[]> => {
    return (await stateManager.retrieve('language') as string[]) ?? WTLanguages.getDefault()
}

export const contentSettings = (stateManager: SourceStateManager): NavigationButton => {
    return createNavigationButton({
        id: 'content_settings',
        value: '',
        label: 'Content Settings',
        form: createForm({
            onSubmit: async (values: any) => {
                return Promise.all([
                    stateManager.store('language', values.language),
                ]).then()
            },
            validate: () => {
                return Promise.resolve(true)
            },
            sections: () => {
                return Promise.resolve([
                    createSection({
                        id: 'content',
                        footer: 'Please choose the language that you would like to view Webtoons in.',
                        rows: () => {
                            return Promise.all([
                                getLanguages(stateManager),
                            ]).then(async values => {
                                return [
                                    createSelect({
                                        id: 'language',
                                        label: 'Language',
                                        options: WTLanguages.getWTCodeList(),
                                        displayLabel: option => WTLanguages.getName(option),
                                        value: values[0],
                                        allowsMultiselect: false,
                                        minimumOptionCount: 1,
                                    }),
                                ]
                            })
                        }
                    })
                ])
            }
        })
    })
}