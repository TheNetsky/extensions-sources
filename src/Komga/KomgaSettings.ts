import {
    NavigationButton,
    SourceStateManager,
    RequestManager
} from 'paperback-extensions-common'

/* Helper functions */

export const createAuthorizationString = (username: String, password: String): string => {
  return "Basic " + Buffer.from(username + ":" + password, 'binary').toString('base64')
}
export const createKomgaAPI = (serverAddress: String): string => {
  return serverAddress + (serverAddress.slice(-1) === "/" ? "api/v1" : "/api/v1")
}

export const retrieveStateData = async(stateManager: SourceStateManager) => {
  // Return serverURL, serverUsername and serverPassword saved in the source.
  // Used to show already saved data in settings

  const serverURL = (await stateManager.retrieve('serverAddress') as string) ?? ""
  const serverUsername = (await stateManager.retrieve('serverUsername') as string) ?? ""
  const serverPassword = (await stateManager.retrieve('serverPassword') as string) ?? ""
  return {
    serverURL: serverURL,
    serverUsername: serverUsername,
    serverPassword: serverPassword
  }
}

export const testServerSettings = async(stateManager: SourceStateManager, requestManager: RequestManager): Promise<string> => {
  // Try to establish a connection with the server. Return an human readable string containing the test result

  const komgaAPI = (await stateManager.retrieve('komgaAPI') as string) ?? "default"
  const authorization = (await stateManager.retrieve('authorization') as string) ?? "default"

  // We check credentials are set in server settings
  if (komgaAPI === null || authorization === null) {
    return "Impossible: Unset credentials in server settings"
  }

  // To test these information, we try to make a connection to the server
  // We could use a better endpoint to test the connection
  let request = createRequestObject({
    url: `${komgaAPI}/libraries/`,
    method: "GET",
    incognito: true, // We don't want the authorization to be cached
    headers: {authorization: authorization}
  })

  var responseStatus = undefined

  try {
    const response = await requestManager.schedule(request, 1)
    responseStatus = response.status
  } catch (error) {
    // If the server is unavailable error.message will be 'AsyncOperationTimedOutError'
    return `Failed: Could not connect to server - ${error.message}`
  }
    
  switch(responseStatus) { 
    case 200: {
      // Successful connection
      return "Successful connection!"
    }
    case 401: {
      return "Error 401 Unauthorized: Invalid credentials"
    }
    default: {
      return `Error ${responseStatus}`
    }
  }
}

/* UI definition */

// NOTE: Submitted data won't be tested
export const serverSettingsMenu = (stateManager: SourceStateManager): NavigationButton => {
  return createNavigationButton({
    id: 'server_settings',
    value: '',
    label: 'Server Settings',
    form: createForm({
      onSubmit: (values: any) => {
        return Promise.all([
          stateManager.store('serverAddress', values.serverAddress),
          stateManager.store('serverUsername', values.serverUsername),
          stateManager.store('serverPassword', values.serverPassword),
          stateManager.store('komgaAPI', createKomgaAPI(values.serverAddress)),
          stateManager.store('authorization', createAuthorizationString(values.serverUsername, values.serverPassword)),
        ]).then()
      },
      validate: () => {
        return Promise.resolve(true)
      },
      sections: () => {
        return Promise.resolve([
          createSection({
            id: "information",
            header: "Komga",
            rows: () => {
              return Promise.resolve([
                createMultilineLabel({
                  label: "Enter your Komga server credentials\n\nA demonstration server is available on:\nhttps://komga.org/guides/#demo\n\nMinimal Komga version: x.x.x",
                  value: "",
                  id: "description"
                })
              ])
            }
          }),
          createSection({
            id: "serverSettings",
            header: "Server Settings",
            rows: () => {
              return retrieveStateData(stateManager).then(async values => {
                return [
                  createInputField({
                    id: 'serverAddress',
                    label: 'Server URL',
                    placeholder: 'http://127.0.0.1:8080',
                    value: values.serverURL,
                    maskInput: false,
                  }),
                  createInputField({
                    id: 'serverUsername',
                    label: 'Username',
                    placeholder: 'AnimeLover420',
                    value: values.serverUsername,
                    maskInput: false,
                  }),
                  createInputField({
                    id: 'serverPassword',
                    label: 'Password',
                    placeholder: 'Some Super Secret Password',
                    value: values.serverPassword,
                    maskInput: true,
                  }),
                ]
              })
            }
          }),
        ])
      }
    })
  })
}

export const testServerSettingsMenu = (stateManager: SourceStateManager, requestManager: RequestManager): NavigationButton => {
  return createNavigationButton({
    id: 'test_settings',
    value: '',
    label: 'Try settings',
    form: createForm({
      onSubmit: (values: any) => {
        return Promise.resolve()
      },
      validate: () => {
        return Promise.resolve(true)
      },
      sections: () => {
        return Promise.resolve([
          createSection({
            id: "information",
            header: "Connection to Komga server:",
            rows: () => {
              return testServerSettings(stateManager, requestManager).then(async value => {
                return [
                  createLabel({
                    label: value,
                    value: "",
                    id: "description"
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