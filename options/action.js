async function sendRequest(actionName, ...params){
    return new Promise(resolve => {
        chrome.runtime.sendMessage({action: `alfred:${actionName}`, params}, resolve);
    });
}

async function getStore(){
    return sendRequest("getStore");
}

async function setStore(content){
    return sendRequest("replaceStoreContent", content);
}

document.addEventListener('DOMContentLoaded', async function () {

    let storage = await getStore();

    const badgeVisibilityEl = document.querySelector("#badge_visibility");
    const ttlEl = document.querySelector("#ttl");
    const ignorePatternEl = document.querySelector("#ignore_patterns");

    badgeVisibilityEl.value = storage.badge.visible ? '1' : '0';
    ttlEl.value = (storage.ttl.ms ?? 120_000) / 1000 / 60;
    ignorePatternEl.value = storage.cleanupRules.ignorePatterns.join("\n");

    let btn = document.querySelector("#save_btn");
    
    btn.addEventListener("click", async ev => {
        btn.style.opacity = "0.2";
        btn.style.pointerEvents = "none";

        await setStore({
            ...storage,
            badge:{
                visible: badgeVisibilityEl.value === '1'
            },
            ttl:{
                ms: Number(ttlEl.value ?? 60) * 1000 * 60
            },
            cleanupRules: {
                ignorePatterns: ignorePatternEl.value.split("\n")
            }
        });

        location.reload();
    });

});