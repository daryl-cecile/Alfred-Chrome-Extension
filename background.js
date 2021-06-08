
// to manage user settings and app settings
const Store = {
    userPreference: async (name, callback) =>{
        return new Promise(resolve => {
            chrome.storage.sync.get([name], async result => {                
                let obj = result[name] ?? {};
                let objClone = JSON.stringify(obj);
    
                // do work
                let returnVal = await callback(obj);
                obj = returnVal ?? obj;
    
                // if changes save it back to sync storage
                if ( JSON.stringify(obj) !== objClone ){
                    chrome.storage.sync.set({
                        [name]: obj
                    }, resolve);
                }
            });
        })
    },
    readUserPreference: async (name) => {
        return new Promise(resolve => {
            Store.userPreference(name, obj => resolve(obj))
        });
    },
    readAllUserPreferences: async ()=>{
        return new Promise(resolve => {
            chrome.storage.sync.get(null, resolve);
        });
    },
    setAllUserPreferences: async (newContent)=>{
        let current = await Store.readAllUserPreferences();
        return new Promise(resolve => {
            chrome.storage.sync.set({
                ...current,
                ...newContent
            }, async ()=>{

                resolve();

                await Store.variable('status', status => {
                    chrome.alarms.clearAll();
                    status.tabMonitors = {};

                    chrome.alarms.create('alfred_poll', {
                        when: Date.now(),
                        periodInMinutes: (status.pollMs / 1000 / 60)
                    });
                });
            
                verifyTabRegister();

            });
        });
    },
    variable: async (name, callback) =>{
        return new Promise(resolve => {
            chrome.storage.local.get([name], async result => {                
                let obj = result[name] ?? {};
                let objClone = JSON.stringify(obj);
    
                // do work
                let returnVal = await callback(obj);
                obj = returnVal ?? obj;
    
                // if changes save it back to sync storage
                if ( JSON.stringify(obj) !== objClone ){
                    console.log('save', obj);
                    chrome.storage.local.set({
                        [name]: obj
                    }, resolve);
                }
            });
        })
    },
    readVariable: async (name) => {
        return new Promise(resolve => {
            Store.variable(name, obj => resolve(obj))
        });
    },
    resetVariables: async ()=>{
        return new Promise(resolve => {
            chrome.storage.local.clear(resolve);
        });
    }
};

/* ----- UTILITIES ----- */

function convertPatternToRegex(pattern){
    return new RegExp(pattern.split("").map(char => {
        if (char === ".") return "\\.";
        if (char === "/") return "\\/";
        if (char === "?") return "\\?";
        if (char === "*") return ".*";
        return char;
    }).join(""), "gm");
}

/* ----- END: UTILITIES ----- */


/* ----- HELPERS ----- */

function getEligibleTabs(){
    return new Promise(resolve => {
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

function setBadge(tabCount, isWatching, badgeVisible){
    let badgeText = '';
    if (tabCount > 0) badgeText = tabCount.toString();
    if (!isWatching) badgeText = ' ···';
    if (!badgeVisible) badgeText = '';

    chrome.action.setBadgeText({
        text: badgeText
    });
}

async function verifyTabRegister(){
    let tabs = await getEligibleTabs();
    let ttl = await Store.readUserPreference('ttl');
    let badge = await Store.readUserPreference('badge');
    let now = Date.now();

    Store.variable('status', status => {
        setBadge(tabs.length, status.isWatching, badge.visible);
        if (!status.isWatching) return status;

        tabs.forEach(tab => {
            if (status.tabMonitors[tab.id] === undefined){
                if (status.tabImmunity.indexOf(tab.id) > -1) {
                    status.tabMonitors[tab.id] = now;
                    return;
                }
                status.tabMonitors[tab.id] = now + ttl.ms;
                
                chrome.alarms.create(`alfred_${tab.id}`, {
                    when: now + ttl.ms
                });
            }
        });
    });
}

function removeTabMonitor(tabId){
    chrome.alarms.clear(`alfred_${tabId}`);

    Store.variable('status', status => {
        delete status.tabMonitors[tabId]
    });
}

async function setDefaults(){
    return await Promise.all([
        new Promise(resolve => {
            chrome.storage.local.get(null, properties => {
                chrome.storage.local.set({
                    status: {
                        isWatching: true,
                        pollMs: 1000 * 60 * 1,
                        ...properties.status,
                        tabMonitors: {},
                        tabImmunity: []
                    }
                }, ()=>resolve());
            });
        }),
        new Promise(resolve => {
            chrome.storage.sync.get(null, properties => {
                chrome.storage.sync.set({
                    badge:{
                        visible: true
                    },
                    ttl: {
                        ms: 1000 * 60 * 2, // 2hrs = 1000 * 60 * 60 * 2
                        ...properties.ttl
                    },
                    cleanupRules: {
                        ignorePatterns: [
                            "chrome://"
                        ],
                        ...properties.cleanupRules
                    }
                }, ()=>resolve());
            });
        })
    ]);
}

function startup(){
    chrome.alarms.clearAll();
    setDefaults().then(async ()=>{
        let status = await Store.readVariable('status');

        chrome.alarms.create('alfred_poll', {
            when: Date.now(),
            periodInMinutes: (status.pollMs / 1000 / 60)
        });
    
        verifyTabRegister();
    });
}

/* ----- END: HELPERS ----- */




chrome.runtime.onInstalled.addListener(() => {
    startup();
});

chrome.tabs.onRemoved.addListener((tabId) => {
    removeTabMonitor(tabId);
});

chrome.tabs.onActivated.addListener(activeInfo => {
    removeTabMonitor(activeInfo.tabId);
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
            Store.variable("status", status => {
                if (!status.isWatching) return status;
                let tabId = Number(alarmName);
                console.log('deleting', tabId);
                chrome.tabs.remove(tabId);
                removeTabMonitor(tabId);

                verifyTabRegister();
            })
        }
    }
});

chrome.runtime.onMessage.addListener((request,sender,sendResponse) => {
    switch (request.action){

        case "alfred:getTabCollectionInformation":{
            verifyTabRegister();
            getEligibleTabs().then(tabs => {
                let currentMS = Date.now();

                Store.variable("status", status => {
                    sendResponse({
                        tabs: tabs.map(tab => {
                            return {
                                ...tab,
                                TTL: status.tabMonitors[tab.id] - currentMS,
                                Deadline: status.tabMonitors[tab.id],
                                isImmune: status.tabImmunity.indexOf(tab.id) > -1
                            }
                        })
                    });
                });
            });
            break;
        }

        case "alfred:getAlfredStatus":{
            Store.variable("status", status => {
                sendResponse({isWatching: status.isWatching});
            });
            break;
        }

        case "alfred:setTabImmunity":{
            (async ()=>{
                await Store.variable("status", status => {
                    let isImmune = request.params[0];
                    let tabId = Number('' + request.params[1]);
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
            Store.variable("status", status => {
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