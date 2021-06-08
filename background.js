
const ignoreRules = {
    patterns: [
        "https://*.figma.com/*"
    ]
}

let status = {
    isWatching: true,
    ttlMs: 1000 * 60 * 2, // 2hrs = 1000 * 60 * 60 * 2
    pollMs: 1000 * 60 * 1 // 2min = 1000 * 60 * 2
}

let tabMonitors = undefined;

function convertPatternToRegex(pattern){
    return new RegExp(pattern.split("").map(char => {
        if (char === ".") return "\\.";
        if (char === "/") return "\\/";
        if (char === "?") return "\\?";
        if (char === "*") return ".*";
        return char;
    }).join(""), "gm");
}

async function saveTabMonitors(){
    if (tabMonitors !== undefined) chrome.storage.local.set({tabMonitors, isWatching: status.isWatching});
}

function getEligibleTabs(){
    return new Promise(resolve => {
        chrome.storage.local.get(['tabMonitors','isWatching'], result => {
            tabMonitors = result.tabMonitors ?? {};
            status.isWatching = result.isWatching ?? true;
            chrome.tabs.query({active:false, pinned: false},function(tabs){
                resolve(
                    tabs.filter(tab => {
                        return ignoreRules.patterns.find(p => convertPatternToRegex(p).test(tab.url)) === undefined
                    })
                )
            });
        });

    });
}

function verifyTabRegister(){
    getEligibleTabs().then(tabs => {
        tabs.forEach(tab => {
            if (tabMonitors[tab.id] === undefined){
                let now = Date.now();
                tabMonitors[tab.id] = now + status.ttlMs;
                saveTabMonitors();
                chrome.alarms.create(`alfred_${tab.id}`, {
                    when: now + status.ttlMs
                });
            }
        });
    });
}

chrome.runtime.onInstalled.addListener(() => {

    chrome.storage.local.clear();
    chrome.alarms.clearAll();
    console.log('instlled');
    chrome.alarms.create('alfred_poll', {
        when: Date.now(),
        periodInMinutes: (status.pollMs / 1000 / 60)
    });
    verifyTabRegister();

});

chrome.runtime.onSuspend.addListener(function() {
    saveTabMonitors();
});

chrome.tabs.onRemoved.addListener((tabId) => {
    try{
        chrome.alarms.clear(`alfred_${tabId}`);
        delete tabMonitors[tabId];
        saveTabMonitors();
    }
    catch(ex){}
});

chrome.tabs.onActivated.addListener(activeInfo => {
    try{
        chrome.alarms.clear(`alfred_${activeInfo.tabId}`);
        delete tabMonitors[activeInfo.tabId];
        saveTabMonitors();
    }
    catch(ex){}
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
            console.log('deleting', tabId);
            chrome.tabs.remove(tabId);
            
            try{
                chrome.alarms.clear(`alfred_${tabId}`);
                delete tabMonitors[tabId];
                saveTabMonitors();
            }catch(ex){
                console.log(ex);
            }
        }
    }
});

chrome.runtime.onMessage.addListener((request,sender,sendResponse) => {
    switch (request.action){

        case "alfred:getTabCollectionInformation":{
            verifyTabRegister();
            getEligibleTabs().then(tabs => {
                let currentMS = Date.now();

                sendResponse({
                    tabs: tabs.map(tab => {
                        return {
                            ...tab,
                            TTL: tabMonitors[tab.id] - currentMS,
                            Deadline: tabMonitors[tab.id]
                        }
                    })
                });
            });
            break;
        }

        case "alfred:getAlfredStatus":{
            sendResponse({isWatching: status.isWatching});
            break;
        }

        case "alfred:setAlfredStatus":{
            status.isWatching = request.params[0];
            sendResponse({})
        }

    }

    return true;
});

chrome.runtime.onStartup.addListener(function() {
    chrome.storage.local.clear()
})