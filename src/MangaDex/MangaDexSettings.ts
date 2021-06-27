/* eslint-disable @typescript-eslint/no-explicit-any */
import {
    NavigationButton,
    SourceStateManager
} from 'paperback-extensions-common'
import {
    MDLanguages,
    MDDemographics
} from './MangaDexHelper'

export const getLanguages = async(stateManager: SourceStateManager): Promise<string[]> => {
    return (await stateManager.retrieve('languages') as string[]) ?? MDLanguages.getDefault()
}

export const getDemographics = async(stateManager: SourceStateManager): Promise<string[]> => {
    return (await stateManager.retrieve('demographics') as string[]) ?? MDDemographics.getDefault()
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
                    stateManager.store('demographics', values.demographics)
                ]).then()
            },
            validate: () => {
                return Promise.resolve(true)
            },
            sections: () => {
                return Promise.resolve([
                    createSection({
                        id: 'languages_section',
                        rows: () => {
                            return getLanguages(stateManager).then(async value => {
                                return [
                                    createSelect({
                                        id: 'languages',
                                        label: 'Languages',
                                        options: MDLanguages.getMDCodeList(),
                                        displayLabel: option => MDLanguages.getName(option),
                                        value: value,
                                        allowsMultiselect: true,
                                        minimumOptionCount: 1
                                    })
                                ]
                            })
                        }
                    }),
                    createSection({
                        id: 'demographics_section',
                        rows: () => {
                            return getDemographics(stateManager).then(async value => {
                                return [
                                    createSelect({
                                        id: 'demographics',
                                        label: 'Publication Demographic',
                                        options: MDDemographics.getEnumList(),
                                        displayLabel: option => MDDemographics.getName(option),
                                        value: value,
                                        allowsMultiselect: true,
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