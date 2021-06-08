
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


function uiUpdateStatus(isWatching){
    let statusElement = document.querySelector("#status-row");
    statusElement.classList[isWatching ? "add" : "remove"]('status_watching');
    statusElement.querySelector("span").innerHTML = `Status: ${isWatching ? "watching" : "paused"}`;
    statusElement.querySelector("button").innerHTML = isWatching ? 'Pause' : 'Resume';
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


document.addEventListener('DOMContentLoaded', async function () {

    let tabColElement = document.querySelector("#tabs");

    let {isWatching} = await getAlfredStatus();
    uiUpdateStatus(isWatching);

    document.querySelector("#status-row button").addEventListener("click", async ()=>{
        let {isWatching} = await getAlfredStatus();
        await setAlfredStatus(!isWatching);
        uiUpdateStatus(!isWatching);
    });

    let {tabs} = await getTabCollectionInformation();

    let namedCount = {};
       
    tabs.forEach(tab => {

        let el = document.createElement("div");
        el.classList.add("row");

        if (namedCount[tab.title] === undefined) namedCount[tab.title] = -1;
        namedCount[tab.title] += 1;

        let tabTitle = tab.title.length > 50 ? tab.title.substring(0, 50) + '...' : tab.title;

        el.innerHTML = `<span></span> <span>${tabTitle}[${namedCount[tab.title]}]</span> <button>Keep</button>`;

        setInterval(async ()=>{
            let {isWatching} = await getAlfredStatus();
            if (!isWatching) return;
            let now = Date.now();
            let diff = tab.Deadline - now;
            let timeRemaining = diff > 0 ? msToTime(diff) : "00:00:00";
            el.querySelector("span:nth-of-type(1)").innerHTML = timeRemaining;
            if (diff < 0) el.style.opacity = 0.5;
        }, 1000);

        tabColElement.appendChild(el);

    });

});