import { AppVariables, ArchivedTab, UserPreferences } from "../../custom";
import { Store } from "./Store";
import { cloneObj, convertPatternToRegex } from "../../Utils";

export function getEligibleTabs(){
    return new Promise<chrome.tabs.Tab[]>(resolve => {
        Store.userPreference('cleanupRules', cleanupRules => {
            chrome.tabs.query({active:false, pinned: false},function(tabs){
                resolve(
                    tabs.filter(tab => {
                        return cleanupRules.ignorePatterns.find(p => convertPatternToRegex(p).test(tab.url)) === undefined
                    })
                )
            });
        });
    });
}

export function getArchivedTabs(){
    return new Promise<ArchivedTab[]>(resolve => {
        Store.AppVariable("status", status => {
            resolve(status.closedTabs);
        });
    });
}

export async function restoreArchivedTab(tabId:number):Promise<{newTab:chrome.tabs.Tab}>{
    let status = await Store.readAppVariable("status");
    let tabIndex = status.closedTabs.findIndex(t => t.id === tabId);
    if (tabIndex === -1) return;
    let tab = status.closedTabs[tabIndex];

    let newTab = await chrome.tabs.create({
        active: false,
        windowId: tab.windowId,
        url: tab.url,
        openerTabId: tab.openerTabId,
        index: tab.index,
        pinned: tab.pinned ?? false
    });

    status.closedTabs.splice(tabIndex, 1);
    await Store.setAllAppVariables({status});

    return {newTab};
}

export function setBadge(tabCount:number, isWatching:boolean, badgeVisible:boolean){
    let badgeText = '';
    if (tabCount > 0) badgeText = tabCount.toString();
    if (!isWatching) badgeText = ' ยทยทยท';
    if (!badgeVisible) badgeText = '';

    chrome.action.setBadgeText({
        text: badgeText
    });
}

export async function archiveTab(tabId:number) {
    let status = await Store.readAppVariable("status");

    if (!status.isWatching) return;

    console.log('deleting', tabId);
    
    let tab = await chrome.tabs.get(tabId);

    status.closedTabs.push({
        ...cloneObj(tab),
        closeTimestamp: Date.now()
    });

    await Store.setAllAppVariables({ status });

    console.log('archived', status.closedTabs);

    chrome.tabs.remove(tabId);
    removeTabMonitor(tabId.toString());

    verifyTabRegister();
}

export async function verifyTabRegister(){
    let tabs = await getEligibleTabs();
    let { ttl, badge } = await Store.readAllUserPreferences();
    let now = Date.now();

    Store.AppVariable('status', status => {
        setBadge(tabs.length, status.isWatching, badge.visible);
        if (!status.isWatching) return status;

        tabs.forEach(tab => {
            let tabId = tab.id?.toString();
            if (status.tabMonitors[tabId] === undefined){
                if (status.tabImmunity.indexOf(tabId) > -1) {
                    status.tabMonitors[tabId] = now;
                    return;
                }
                status.tabMonitors[tabId] = now + ttl.ms;
                
                chrome.alarms.create(`alfred_${tabId}`, {
                    when: now + ttl.ms
                });
            }
        });
    });
}


export function removeTabMonitor(tabId:string){
    chrome.alarms.clear(`alfred_${tabId}`);

    Store.AppVariable('status', status => {
        delete status.tabMonitors[tabId]
    });
}

export async function setup(){
    let appVars = await Store.readAllAppVariables();
    let updatedAppVars:AppVariables = {
        status: {
            isWatching: true,
            pollMs: 1000 * 60 * 1,
            ...appVars.status,
            tabMonitors: {},
            tabImmunity: [],
            closedTabs: []
        }
    };

    let userPrefs = await Store.readAllUserPreferences();
    let updatedUserPrefs:UserPreferences = {
        badge:{
            visible: true
        },
        ttl: {
            ms: 1000 * 60 * 2, // 2hrs = 1000 * 60 * 60 * 2
            ...userPrefs.ttl
        },
        cleanupRules: {
            ignorePatterns: [
                "chrome://"
            ],
            ...userPrefs.cleanupRules
        }
    };

    await Promise.all([
        Store.setAllUserPreferences(updatedUserPrefs),
        Store.setAllAppVariables(updatedAppVars)
    ]);
}

export function startup(){
    chrome.alarms.clearAll();
    setup().then(async ()=>{
        let status = await Store.readAppVariable('status');

        chrome.alarms.create('alfred_poll', {
            when: Date.now(),
            periodInMinutes: (status.pollMs / 1000 / 60)
        });
    
        verifyTabRegister();
    });
}