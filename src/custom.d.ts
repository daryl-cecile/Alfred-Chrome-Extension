
export type Properties = {
    [propertyName:string]: any
}

export type ValueOf<T> = T[keyof T];

export type Awaitable<V> = V|Promise<V>

export type AppVariables = {
    status: {
        isWatching: boolean,
        pollMs: number,
        tabMonitors: {
            [tabId:string]: number
        },
        tabImmunity: Array<string>
    }
}

export type UserPreferences = {
    badge:{
        visible: boolean
    },
    ttl: {
        ms: number
    },
    cleanupRules: {
        ignorePatterns: Array<string>
    }
}

export type TabInfo = chrome.tabs.Tab & {
    TTL: number,
    Deadline: number,
    isImmune: boolean
}