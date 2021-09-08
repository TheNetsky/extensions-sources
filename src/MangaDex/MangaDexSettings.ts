/* eslint-disable @typescript-eslint/no-explicit-any */
import {
    Button,
    NavigationButton,
    SourceStateManager,
} from 'paperback-extensions-common'
import {
    MDLanguages,
    MDRatings,
    MDImageQuality,
    MDHomepageSections
} from './MangaDexHelper'
import {
    sliceRecommendedIds,
    //getRecommendedIds
} from './MangaDexSimilarManga'

export const getLanguages = async (stateManager: SourceStateManager): Promise<string[]> => {
    return (await stateManager.retrieve('languages') as string[]) ?? MDLanguages.getDefault()
}

export const getRatings = async (stateManager: SourceStateManager): Promise<string[]> => {
    return (await stateManager.retrieve('ratings') as string[]) ?? MDRatings.getDefault()
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
                    stateManager.store('ratings', values.ratings),
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
                                getRatings(stateManager),
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
                                        id: 'ratings',
                                        label: 'Content Rating',
                                        options: MDRatings.getEnumList(),
                                        displayLabel: option => MDRatings.getName(option),
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
                stateManager.store('ratings', null),
                stateManager.store('data_saver', null),
                stateManager.store('skip_same_chapter', null),
                stateManager.store('homepage_thumbnail', null),
                stateManager.store('search_thumbnail', null),
                stateManager.store('manga_thumbnail', null),
                stateManager.store('recommendedIds', null),
                stateManager.store('enabled_homepage_sections', null),
                stateManager.store('enabled_recommendations', null),
                stateManager.store('amount_of_recommendations', null)
            ]).then()
        }
    })
}

export const getEnabledHomePageSections = async (stateManager: SourceStateManager): Promise<string[]> => {
    return (await stateManager.retrieve('enabled_homepage_sections') as string[]) ?? MDHomepageSections.getDefault()
}

export const getEnabledRecommendations = async (stateManager: SourceStateManager): Promise<boolean> => {
    return (await stateManager.retrieve('enabled_recommendations') as boolean) ?? false
}

export const getAmountRecommendations = async (stateManager: SourceStateManager): Promise<number> => {
    return (await stateManager.retrieve('amount_of_recommendations') as number) ?? 5
}

export const homepageSettings = (stateManager: SourceStateManager): NavigationButton => {
    return createNavigationButton({
        id: 'homepage_settings',
        value: '',
        label: 'Homepage Settings',
        form: createForm({
            onSubmit: (values: any) => {
                return Promise.all([
                    stateManager.store('enabled_homepage_sections', values.enabled_homepage_sections),
                    // The `as boolean` seems required to prevent Paperback from throwing 
                    // `Invalid type for key value; expected `Bool` got `Optional<JSValue>``
                    stateManager.store('enabled_recommendations', values.enabled_recommendations as boolean),
                    stateManager.store('amount_of_recommendations', values.amount_of_recommendations),
                    sliceRecommendedIds(stateManager, values.amount_of_recommendations),
                ]).then()
            },
            validate: () => {
                return Promise.resolve(true)
            },
            sections: () => {
                return Promise.resolve([
                    createSection({
                        id: 'homepage_sections_section',
                        //footer: 'Which sections should be shown on the homepage',
                        rows: () => {
                            return Promise.all([
                                getEnabledHomePageSections(stateManager),
                            ]).then(async values => {
                                return [
                                    createSelect({
                                        id: 'enabled_homepage_sections',
                                        label: 'Homepage sections',
                                        options: MDHomepageSections.getEnumList(),
                                        displayLabel: option => MDHomepageSections.getName(option),
                                        value: values[0] ?? [],
                                        allowsMultiselect: true,
                                        minimumOptionCount: 0
                                    }),
                                ]
                            })
                        }
                    }),
                    createSection({
                        id: 'recommendations_settings_section',
                        header: 'Titles recommendations',
                        footer: 'Recommendation are based on recently read chapters and shown on the homepage',
                        rows: () => {
                            return Promise.all([
                                getEnabledRecommendations(stateManager),
                                getAmountRecommendations(stateManager),
                                // Can be used to debug recommended ids
                                //getRecommendedIds(stateManager)
                            ]).then(async values => {
                                return [
                                    createSwitch({
                                        id: 'enabled_recommendations',
                                        label: 'Enable recommendations',
                                        value: values[0] ?? false
                                    }),   
                                    createStepper({
                                        id: 'amount_of_recommendations',
                                        label: 'Amount of recommendation',
                                        value: values[1] ?? 5,
                                        min: 1,
                                        max: 15,
                                        step: 1
                                    }),
                                    createButton({
                                        id: 'reset_recommended_ids',
                                        label: 'Reset recommended titles',
                                        value: '',
                                        onTap: () => {
                                            return Promise.all([
                                                stateManager.store('recommendedIds', null),
                                            ]).then()
                                        }
                                    })
                                    // Can be used to debug recommended ids
                                    //createMultilineLabel({
                                    //    id: 'recommendation_ids_list',
                                    //    value: '',
                                    //    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                                    //    label: values[2]!.toString(),
                                    //}),   
                                ]
                            })
                        }
                    }),
                ])
            }
        })
    })
}