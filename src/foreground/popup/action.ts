
/*  ----- UTILITIES ----- */
import { uiUpdateStatus, msToTime } from "../../Utils";
import { getAlfredStatus, setAlfredStatus, getTabCollectionInformation, setTabImmunity } from "../helpers";


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

    let { tabs } = await getTabCollectionInformation();

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