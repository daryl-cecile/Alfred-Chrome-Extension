import { ArchivedTab, TabInfo, UserPreferences } from "../custom";

export async function sendRequest<T = any>(actionName:string, ...params:Array<any>){
    return new Promise<T>(resolve => {
        chrome.runtime.sendMessage({action: `alfred:${actionName}`, params}, resolve);
    });
}

export async function getStore(){
    return sendRequest<UserPreferences>("getStore");
}

export async function setStore(content:UserPreferences){
    return sendRequest("replaceStoreContent", content);
}

export async function getTabCollectionInformation(){
    return sendRequest<{tabs: TabInfo[]}>("getTabCollectionInformation");
}

export async function getArchivedTabCollectionInformation(){
    return sendRequest<{archivedTabs: ArchivedTab[]}>("getArchivedTabCollectionInformation");
}

export async function getAlfredStatus(){
    return sendRequest<{isWatching: boolean}>("getAlfredStatus");
}

export async function setAlfredStatus(isWaiting:boolean){
    return sendRequest("setAlfredStatus", isWaiting);
}

export async function setTabImmunity(isImmune:boolean, tabId:string|number){
    return sendRequest("setTabImmunity", isImmune, tabId);
}

export async function reviveTab(tabId:string|number){
    return sendRequest<{newTab:chrome.tabs.Tab}>("reviveTab", tabId);
}