/* eslint-disable @typescript-eslint/no-explicit-any */
import {
    Button,
    NavigationButton,
    RequestManager,
    SourceStateManager,
} from 'paperback-extensions-common'

import {
    NHLanguages,
    NHSortOrders,
} from './NHentaiHelper'

import rUserAgent from '../lib/rand-ua/index'

export const getLanguages = async (stateManager: SourceStateManager): Promise<string[]> => {
    return (await stateManager.retrieve('languages') as string[]) ?? NHLanguages.getDefault()
}

export const getExtraArgs = async (stateManager: SourceStateManager): Promise<string> => {
    return (await stateManager.retrieve('extra_args') as string) ?? ''
}

export const getSortOrders = async (stateManager: SourceStateManager): Promise<string[]> => {
    return (await stateManager.retrieve('sort_order') as string[]) ?? NHSortOrders.getDefault()
}

export const settings = (stateManager: SourceStateManager, requestManager: RequestManager, source: any): NavigationButton => {
    return createNavigationButton({
        id: 'settings',
        value: '',
        label: 'Content Settings',
        form: createForm({
            onSubmit: async (values: any) => {
                await Promise.all([
                    stateManager.store('languages', values.languages),
                    stateManager.store('sort_order', values.sort_order),
                    stateManager.store('extra_args', values.extra_args),
                ])
            },
            validate: async () => true,
            sections: () => {
                return Promise.resolve([
                    createSection({
                        id: 'ua_section',
                        footer: 'If you\'re experiencing issues with CloudFlare, try randomizing your User Agent.\nPlease restart your app after doing so.\nNOTE! You might need to try this a couple of times for it to work!',
                        rows: async () => [
                            createLabel({
                                id: 'current_ua',
                                value: !source.userAgent ? 'Not allowed to change' :
                                    (typeof source.userAgent == 'string') ? source.userAgent :
                                        await stateManager.retrieve('userAgent') as string ?? 'Default',
                                label: 'Current User Agent: '
                            }),
                            createButton({
                                id: 'randomise_ua',
                                label: 'Randomise UserAgent & Clear Cookies',
                                value: undefined,
                                onTap: async () => {
                                    try {
                                        // Clear Cookies
                                        // @ts-ignore
                                        requestManager.cookieStore.getAllCookies().forEach(x => { requestManager.cookieStore.removeCookie(x) })

                                        // Use set UserAgent unless one is manually set in the source
                                        if (typeof source.userAgent !== 'string') {
                                            stateManager.store('userAgent', rUserAgent('desktop'))
                                        }

                                    } catch (error) {
                                        console.log(error)
                                    }
                                }
                            })
                        ]
                    }),
                    
                    createSection({
                        id: 'content',
                        footer: 'Modify the nhentai experience to your liking.',
                        rows: () => {
                            return Promise.all([
                                getLanguages(stateManager),
                                getSortOrders(stateManager),
                                getExtraArgs(stateManager),
                            ]).then(async values => [
                                createSelect({
                                    id: 'languages',
                                    label: 'Languages',
                                    options: NHLanguages.getNHCodeList(),
                                    displayLabel: option => NHLanguages.getName(option),
                                    value: values[0],
                                    allowsMultiselect: false,
                                    minimumOptionCount: 1,
                                }),
                                createSelect({
                                    id: 'sort_order',
                                    label: 'Default search sort',
                                    options: NHSortOrders.getNHCodeList(),
                                    displayLabel: option => NHSortOrders.getName(option),
                                    value: values[1],
                                    allowsMultiselect: false,
                                    minimumOptionCount: 1,
                                }),
                                createInputField({
                                    id: 'extra_args',
                                    label: 'Additional arguments',
                                    placeholder: 'woman -lolicon -shotacon -yaoi',
                                    maskInput: false,
                                    value: values[2],
                                })
                            ])
                        }
                    })
                ])
            }
        })
    })
}

export const resetSettings = (stateManager: SourceStateManager): Button => {
    return createButton({
        id: 'reset',
        label: 'Reset to Default',
        value: '',
        onTap: async () => {
            await Promise.all([
                stateManager.store('languages', null),
                stateManager.store('sort_order', null),
                stateManager.store('extra_args', null),
            ])
        }
    })
}