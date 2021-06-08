
/*  ----- COMMUNICATION ----- */ 

async function sendRequest(actionName, ...params){
    return new Promise(resolve => {
        chrome.runtime.sendMessage({action: `alfred:${actionName}`, params}, resolve);
    });
}

async function getTabCollectionInformation(){
    return sendRequest("getTabCollectionInformation");
}

async function getAlfredStatus(){
    return sendRequest("getAlfredStatus");
}

async function setAlfredStatus(isWaiting){
    return sendRequest("setAlfredStatus", isWaiting);
}

async function setTabImmunity(isImmune, tabId){
    return sendRequest("setTabImmunity", isImmune, tabId);
}

/*  ----- END: COMMUNICATION ----- */ 


/*  ----- UTILITIES ----- */ 

function uiUpdateStatus(isWatching){
    let statusElement = document.querySelector("#status-row");
    statusElement.classList[isWatching ? "add" : "remove"]('status_watching');
    statusElement.querySelector("span").innerHTML = `Status: ${isWatching ? "Counting down" : "stopped"}`;
    statusElement.querySelector("button").innerHTML = isWatching ? 'Stop' : 'Start';
}

function msToTime(s) {
    function pad(n) {
      return ('00' + n).slice(-2);
    }
  
    var ms = s % 1000;
    s = (s - ms) / 1000;
    var secs = s % 60;
    s = (s - secs) / 60;
    var mins = s % 60;
    var hrs = (s - mins) / 60;
  
    return pad(hrs) + ':' + pad(mins) + ':' + pad(secs);
  }

/*  ----- END: UTILITIES ----- */ 


document.addEventListener('DOMContentLoaded', async function () {

    let tabColElement = document.querySelector("#tabs");

    let {isWatching} = await getAlfredStatus();
    uiUpdateStatus(isWatching);

    document.querySelector("#status-row button").addEventListener("click", async ()=>{
        // update watch status
        let {isWatching} = await getAlfredStatus();
        await setAlfredStatus(!isWatching);
        uiUpdateStatus(!isWatching);
    });

    let {tabs} = await getTabCollectionInformation();

    let namedCount = {}; // count of tabs with similar names
       
    // add a row for each tab
    tabs.forEach(tab => {

        let el = document.createElement("div");
        el.classList.add("row");

        if (namedCount[tab.title] === undefined) namedCount[tab.title] = -1;
        namedCount[tab.title] += 1;

        // make sure tab title isnt too long
        let tabTitle = tab.title.length > 50 ? tab.title.substring(0, 50) + '...' : tab.title;

        el.innerHTML = `<span></span> <span>${tabTitle}${namedCount[tab.title] > 0 ? `[${namedCount[tab.title]}]` : ''}</span> <button>${tab.isImmune ? 'Include' : 'Ignore'}</button>`;

        // update time remaining on each tab every second
        setInterval(async ()=>{
            let {isWatching} = await getAlfredStatus();
            if (!isWatching) return;
            let now = Date.now();
            let diff = tab.Deadline - now;
            let timeRemaining = diff > 0 ? msToTime(diff) : "00:00:00";
            el.querySelector("span:nth-of-type(1)").innerHTML = timeRemaining;
            if (diff < 0) {
                if (tab.isImmune) el.classList.add('inactive');
                else el.classList.add('killed');
            }
        }, 1000);

        
        // Allow user to prevent tab from being killed
        let btn = el.querySelector("button");
        
        btn.addEventListener("click", async ev => {
            let shouldMakeImmune = (btn.innerText === 'Ignore');
            await setTabImmunity(shouldMakeImmune, tab.id);
            btn.innerText = shouldMakeImmune ? 'Include' : 'Ignore';
            document.location.reload();
        });

        tabColElement.appendChild(el);

    });

});