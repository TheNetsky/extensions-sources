/* eslint-disable @typescript-eslint/no-explicit-any */
import {
    Button,
    NavigationButton,
    SourceStateManager,
} from 'paperback-extensions-common'
import {
    MDLanguages,
    MDDemographics,
    MDImageQuality
} from './MangaDexHelper'

export const getLanguages = async (stateManager: SourceStateManager): Promise<string[]> => {
    return (await stateManager.retrieve('languages') as string[]) ?? MDLanguages.getDefault()
}

export const getDemographics = async (stateManager: SourceStateManager): Promise<string[]> => {
    return (await stateManager.retrieve('demographics') as string[]) ?? MDDemographics.getDefault()
}

export const getDataSaver = async (stateManager: SourceStateManager): Promise<boolean> => {
    return (await stateManager.retrieve('data_saver') as boolean) ?? false
}

export const getSkipSameChapter = async (stateManager: SourceStateManager): Promise<boolean> => {
    return (await stateManager.retrieve('skip_same_chapter') as boolean) ?? false
}

export const contentSettings = (stateManager: SourceStateManager): NavigationButton => {
    return createNavigationButton({
        id: 'content_settings',
        value: '',
        label: 'Content Settings',
        form: createForm({
            onSubmit: (values: any) => {
                return Promise.all([
                    stateManager.store('languages', values.languages),
                    stateManager.store('demographics', values.demographics),
                    stateManager.store('data_saver', values.data_saver),
                    stateManager.store('skip_same_chapter', values.skip_same_chapter)
                ]).then()
            },
            validate: () => {
                return Promise.resolve(true)
            },
            sections: () => {
                return Promise.resolve([
                    createSection({
                        id: 'content',
                        footer: 'When enabled, same chapters from different scanlation group will not be shown.',
                        rows: () => {
                            return Promise.all([
                                getLanguages(stateManager),
                                getDemographics(stateManager),
                                getDataSaver(stateManager),
                                getSkipSameChapter(stateManager)
                            ]).then(async values => {
                                return [
                                    createSelect({
                                        id: 'languages',
                                        label: 'Languages',
                                        options: MDLanguages.getMDCodeList(),
                                        displayLabel: option => MDLanguages.getName(option),
                                        value: values[0],
                                        allowsMultiselect: true,
                                        minimumOptionCount: 1,
                                    }),
                                    createSelect({
                                        id: 'demographics',
                                        label: 'Publication Demographic',
                                        options: MDDemographics.getEnumList(),
                                        displayLabel: option => MDDemographics.getName(option),
                                        value: values[1],
                                        allowsMultiselect: true,
                                        minimumOptionCount: 1
                                    }),
                                    createSwitch({
                                        id: 'data_saver',
                                        label: 'Data Saver',
                                        value: values[2]
                                    }),
                                    createSwitch({
                                        id: 'skip_same_chapter',
                                        label: 'Skip Same Chapter',
                                        value: values[3]
                                    })
                                ]
                            })
                        }
                    })
                ])
            }
        })
    })
}

export const getHomepageThumbnail = async (stateManager: SourceStateManager): Promise<string> => {
    return (await stateManager.retrieve('homepage_thumbnail') as string) ?? MDImageQuality.getDefault('homepage')
}

export const getSearchThumbnail = async (stateManager: SourceStateManager): Promise<string> => {
    return (await stateManager.retrieve('search_thumbnail') as string) ?? MDImageQuality.getDefault('search')
}

export const getMangaThumbnail = async (stateManager: SourceStateManager): Promise<string> => {
    return (await stateManager.retrieve('manga_thumbnail') as string) ?? MDImageQuality.getDefault('manga')
}

export const thumbnailSettings = (stateManager: SourceStateManager): NavigationButton => {
    return createNavigationButton({
        id: 'thumbnail_settings',
        value: '',
        label: 'Thumbnail Quality',
        form: createForm({
            onSubmit: (values: any) => {
                return Promise.all([
                    stateManager.store('homepage_thumbnail', values.homepage_thumbnail[0]),
                    stateManager.store('search_thumbnail', values.search_thumbnail[0]),
                    stateManager.store('manga_thumbnail', values.manga_thumbnail[0]),
                ]).then()
            },
            validate: () => {
                return Promise.resolve(true)
            },
            sections: () => {
                return Promise.resolve([
                    createSection({
                        id: 'thumbnail',
                        rows: () => {
                            return Promise.all([
                                getHomepageThumbnail(stateManager),
                                getSearchThumbnail(stateManager),
                                getMangaThumbnail(stateManager)
                            ]).then(async values => {
                                return [
                                    createSelect({
                                        id: 'homepage_thumbnail',
                                        label: 'Homepage Thumbnail',
                                        options: MDImageQuality.getEnumList(),
                                        displayLabel: option => MDImageQuality.getName(option),
                                        value: [values[0]],
                                        allowsMultiselect: false,
                                        minimumOptionCount: 1
                                    }),
                                    createSelect({
                                        id: 'search_thumbnail',
                                        label: 'Search Thumbnail',
                                        options: MDImageQuality.getEnumList(),
                                        displayLabel: option => MDImageQuality.getName(option),
                                        value: [values[1]],
                                        allowsMultiselect: false,
                                        minimumOptionCount: 1
                                    }),
                                    createSelect({
                                        id: 'manga_thumbnail',
                                        label: 'Manga Thumbnail',
                                        options: MDImageQuality.getEnumList(),
                                        displayLabel: option => MDImageQuality.getName(option),
                                        value: [values[2]],
                                        allowsMultiselect: false,
                                        minimumOptionCount: 1
                                    })
                                ]
                            })
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
        onTap: () => {
            return Promise.all([
                stateManager.store('languages', null),
                stateManager.store('demographics', null),
                stateManager.store('data_saver', null),
                stateManager.store('skip_same_chapter', null),
                stateManager.store('homepage_thumbnail', null),
                stateManager.store('search_thumbnail', null),
                stateManager.store('manga_thumbnail', null)
            ]).then()
        }
    })
}