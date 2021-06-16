
import { TabInfo } from "../custom";
import { cloneObj } from "../Utils";
import { archiveTab, getArchivedTabs, getEligibleTabs, removeTabMonitor, restoreArchivedTab, startup, verifyTabRegister } from "./common/BackgroundHelpers";
import { Store } from "./common/Store";

chrome.runtime.onInstalled.addListener(() => {
    startup();
});

chrome.tabs.onRemoved.addListener((tabId) => {
    removeTabMonitor(tabId.toString());
});

chrome.tabs.onActivated.addListener(activeInfo => {
    removeTabMonitor(activeInfo.tabId.toString());
});

chrome.alarms.onAlarm.addListener(alarmInfo => {
    let alarmName = alarmInfo.name.split("alfred_")[1];
    console.log('[alarm]', alarmInfo);

    switch (alarmName){
        case "poll":{
            verifyTabRegister();
            break;
        }
        default: {
            let tabId = Number(alarmName);
            archiveTab(tabId);
        }
    }
});

chrome.runtime.onMessage.addListener((request, _, sendResponse) => {
    switch (request.action){

        case "alfred:getTabCollectionInformation":{
            verifyTabRegister();
            getEligibleTabs().then(tabs => {
                let currentMS = Date.now();

                Store.AppVariable("status", status => {
                    sendResponse({
                        tabs: tabs.map<TabInfo>(tab => {
                            let tabId = tab.id?.toString();
                            return {
                                ...tab,
                                TTL: status.tabMonitors[tabId] - currentMS,
                                Deadline: status.tabMonitors[tabId],
                                isImmune: status.tabImmunity.indexOf(tabId) > -1
                            }
                        })
                    });
                });
            });
            break;
        }

        case "alfred:getArchivedTabCollectionInformation":{
            verifyTabRegister();
            getArchivedTabs().then(tabs => {
                sendResponse({
                    archivedTabs: tabs.sort((a,b)=> a.closeTimestamp - b.closeTimestamp)
                });
            });
            break;
        }

        case "alfred:reviveTab":{
            let tabId = Number("" + request.params[0]);
            restoreArchivedTab(tabId).then(()=>{
                verifyTabRegister();
                sendResponse({});
            });
            break;
        }

        case "alfred:getAlfredStatus":{
            Store.AppVariable("status", status => {
                sendResponse({isWatching: status.isWatching});
            });
            break;
        }

        case "alfred:setTabImmunity":{
            (async ()=>{
                await Store.AppVariable("status", status => {
                    let isImmune = request.params[0];
                    let tabId:string = request.params[1].toString();
                    if (isImmune){
                        if (status.tabImmunity.indexOf(tabId) === -1){
                            status.tabImmunity.push(tabId);
                        }
                        chrome.alarms.clear(`alfred_${tabId}`);
                    }
                    else{
                        let ind = status.tabImmunity.indexOf(tabId);
                        if (ind > -1) status.tabImmunity.splice(ind, 1);
                    }
                    delete status.tabMonitors[tabId];
                });
                sendResponse({});
                verifyTabRegister();
            })();
            break;
        }

        case "alfred:setAlfredStatus":{
            Store.AppVariable("status", status => {
                status.isWatching = request.params[0];
                if (!status.isWatching){
                    chrome.alarms.clearAll();
                    status.tabMonitors = {};
                }else{
                    chrome.alarms.clearAll();
                    chrome.alarms.create('alfred_poll', {
                        when: Date.now(),
                        periodInMinutes: (status.pollMs / 1000 / 60)
                    });
                
                    verifyTabRegister();
                }
                sendResponse({})
            });
            break;
        }

        case "alfred:getStore":{
           Store.readAllUserPreferences().then(obj => sendResponse(obj));
           break;
        }

        case "alfred:replaceStoreContent":{
            let newContent = request.params[0];
            Store.setAllUserPreferences(newContent).then(() => sendResponse({}));
            break;
        }

    }

    return true;
});

chrome.runtime.onStartup.addListener(() => {
    startup();
});