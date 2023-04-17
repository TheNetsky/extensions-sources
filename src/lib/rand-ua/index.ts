import {
    JSONfrequencyNormalize,
    JSONIsFrequency,
    JSONinterval,
    randomElement,
} from './helpers'
  
import * as getUserAgents from 'rand-user-agent/data/user-agents.json'

let content = JSON.parse(JSON.stringify(getUserAgents))
content = JSONfrequencyNormalize(content)
  
if (JSONIsFrequency(content)) {
    content = JSONinterval(content)
}
  
export default function (
    device: string,
    browser: string | null = null,
    os: string | null = null
): string {
    const options: string[] = []
    const keys = Object.keys(content)
    for (const index in keys) {
        let filter = true
        if (keys[index].indexOf(device) === -1) {
            filter = false
        }
        if (browser && keys[index].indexOf(browser) === -1) {
            filter = false
        }
        if (os && keys[index].indexOf(os) === -1) {
            filter = false
        }
        if (filter) {
            options.push(keys[index])
        }
    }
    if (options.length === 0) {
        return randomElement(content)
    }
    return randomElement(
        content[options[Math.floor(Math.random() * options.length)]]
    )
}