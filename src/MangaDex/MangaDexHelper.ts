export interface requestMetadata {
    offset?: number,
    collectedIds?: string[]
}

interface Language {
    name: string,
    MDCode: string,
    PBCode: string,
    default?: boolean
}

class MDLanguagesClass {
    Languages: Language[] = [
        {
            // Arabic
            name: 'اَلْعَرَبِيَّةُ',
            MDCode: 'ar',
            PBCode: 'sa'
        },
        {
            // Bulgarian
            name: 'български',
            MDCode: 'bg',
            PBCode: 'bg'
        },
        {
            // Bengali
            name: 'বাংলা',
            MDCode: 'bn',
            PBCode: 'bd'
        },
        {
            // Catalan
            name: 'Català',
            MDCode: 'ca',
            PBCode: 'es'
        },
        {
            // Czech
            name: 'Čeština',
            MDCode: 'cs',
            PBCode: 'cz'
        },
        {
            // Danish
            name: 'Dansk',
            MDCode: 'da',
            PBCode: 'dk'
        },
        {
            // German
            name: 'Deutsch',
            MDCode: 'de',
            PBCode: 'de'
        },
        {
            // English
            name: 'English',
            MDCode: 'en',
            PBCode: 'gb',
            default: true
        },
        {
            // Spanish
            name: 'Español',
            MDCode: 'es',
            PBCode: 'es'
        },
        {
            // Spanish (Latin American)
            name: 'Español (Latinoamérica)',
            MDCode: 'es-la',
            PBCode: 'es'
        },
        {
            // Farsi
            name: 'فارسی',
            MDCode: 'fa',
            PBCode: 'ir'
        },
        {
            // Finnish
            name: 'Suomi',
            MDCode: 'fi',
            PBCode: 'fi'
        },
        {
            // French
            name: 'Français',
            MDCode: 'fr',
            PBCode: 'fr'
        },
        {
            // Hebrew
            name: 'עִבְרִית',
            MDCode: 'he',
            PBCode: 'il'
        },
        {
            // Hindi
            name: 'हिन्दी',
            MDCode: 'hi',
            PBCode: 'in'
        },
        {
            // Hungarian
            name: 'Magyar',
            MDCode: 'hu',
            PBCode: 'hu'
        },
        {
            // Indonesian
            name: 'Indonesia',
            MDCode: 'id',
            PBCode: 'id'
        },
        {
            // Italian
            name: 'Italiano',
            MDCode: 'it',
            PBCode: 'it'
        },
        {
            // Japanese
            name: '日本語',
            MDCode: 'ja',
            PBCode: 'jp'
        },
        {
            // Korean
            name: '한국어',
            MDCode: 'ko',
            PBCode: 'kr'
        },
        {
            // Lithuanian
            name: 'Lietuvių',
            MDCode: 'lt',
            PBCode: 'lt'
        },
        {
            // Mongolian
            name: 'монгол',
            MDCode: 'mn',
            PBCode: 'mn'
        },
        {
            // Malay
            name: 'Melayu',
            MDCode: 'ms',
            PBCode: 'my'
        },
        {
            // Burmese
            name: 'မြန်မာဘာသာ',
            MDCode: 'my',
            PBCode: 'mm'
        },
        {
            // Dutch
            name: 'Nederlands',
            MDCode: 'nl',
            PBCode: 'nl'
        },
        {
            // Norwegian
            name: 'Norsk',
            MDCode: 'no',
            PBCode: 'no'
        },
        {
            // Polish
            name: 'Polski',
            MDCode: 'pl',
            PBCode: 'pl'
        },
        {
            // Portuguese
            name: 'Português',
            MDCode: 'pt',
            PBCode: 'pt'
        },
        {
            // Portuguese (Brazilian)
            name: 'Português (Brasil)',
            MDCode: 'pt-br',
            PBCode: 'pt'
        },
        {
            // Romanian
            name: 'Română',
            MDCode: 'ro',
            PBCode: 'ro'
        },
        {
            // Russian
            name: 'Pусский',
            MDCode: 'ru',
            PBCode: 'ru'
        },
        {
            // Serbian
            name: 'Cрпски',
            MDCode: 'sr',
            PBCode: 'rs'
        },
        {
            // Swedish
            name: 'Svenska',
            MDCode: 'sv',
            PBCode: 'se'
        },
        {
            // Thai
            name: 'ไทย',
            MDCode: 'th',
            PBCode: 'th'
        },
        {
            // Tagalog
            name: 'Filipino',
            MDCode: 'tl',
            PBCode: 'ph'
        },
        {
            // Turkish
            name: 'Türkçe',
            MDCode: 'tr',
            PBCode: 'tr'
        },
        {
            // Ukrainian
            name: 'Yкраї́нська',
            MDCode: 'uk',
            PBCode: 'ua'
        },
        {
            // Vietnamese
            name: 'Tiếng Việt',
            MDCode: 'vi',
            PBCode: 'vn'
        },
        {
            // Chinese (Simplified)
            name: '中文 (简化字)',
            MDCode: 'zh',
            PBCode: 'cn'
        },
        {
            // Chinese (Traditional)
            name: '中文 (繁體字)',
            MDCode: 'zh-hk',
            PBCode: 'hk'
        },
    ]

    constructor() {
        // Sorts the languages based on name
        this.Languages = this.Languages.sort((a, b) => a.name > b.name ? 1 : -1)
    }

    getMDCodeList(): string[] {
        return this.Languages.map(Language => Language.MDCode)
    }

    getName(MDCode: string): string {
        return this.Languages.filter(Language => Language.MDCode == MDCode)[0]?.name ?? 'Unknown'
    }

    getPBCode(MDCode: string): string {
        return this.Languages.filter(Language => Language.MDCode == MDCode)[0]?.PBCode ?? '_unknown'
    }

    getDefault(): string[] {
        return this.Languages.filter(Language => Language.default).map(Language => Language.MDCode)
    }
}

export const MDLanguages = new MDLanguagesClass

interface Demographic {
    name: string,
    enum: string,
    default?: true
}

class MDDemographicsClass {
    Demographics: Demographic[] = [
        {
            name: 'Unknown',
            enum: 'none',
            default: true
        },
        {
            name: 'Safe',
            enum: 'safe',
            default: true
        }
        ,
        {
            name: 'Suggestive',
            enum: 'suggestive',
            default: true
        },
        {
            name: 'Erotica',
            enum: 'erotica'
        },
        {
            name: 'Pornographic',
            enum: 'pornographic'
        }
    ]

    getEnumList(): string[] {
        return this.Demographics.map(Demographic => Demographic.enum)
    }

    getName(demographicEnum: string): string {
        return this.Demographics.filter(Demographic => Demographic.enum == demographicEnum)[0]?.name ?? 'Unknown Demographic'
    }

    getDefault(): string[] {
        return this.Demographics.filter(Demographic => Demographic.default).map(Demographic => Demographic.enum)
    }
}

export const MDDemographics = new MDDemographicsClass

export class URLBuilder {
    parameters: Record<string, any | any[]> = {}
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
        this.parameters[key] = value
        return this
    }

    buildUrl({addTrailingSlash, includeUndefinedParameters}: {addTrailingSlash: boolean, includeUndefinedParameters: boolean} = {addTrailingSlash: false, includeUndefinedParameters: false}): string {
        let finalUrl = this.baseUrl

        finalUrl += this.pathComponents.join('/')
        finalUrl += addTrailingSlash ? '/' : ''
        finalUrl += Object.values(this.parameters).length > 0 ? '?' : ''
        finalUrl += Object.entries(this.parameters).map(entry => {
            if (entry[1] == null && includeUndefinedParameters) { return undefined }

            if(Array.isArray(entry[1])){
                return entry[1].map(value => value || includeUndefinedParameters ? `${entry[0]}[]=${value}` : undefined)
                    .filter(x => x !== undefined)
                    .join('&')
            }

            return `${entry[0]}=${entry[1]}`
        }).filter(x => x !== undefined).join('&')

        return finalUrl
    }
}