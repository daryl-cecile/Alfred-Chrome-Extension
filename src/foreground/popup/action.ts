
/*  ----- UTILITIES ----- */
import { uiUpdateStatus, msToTime } from "../../Utils";
import { getAlfredStatus, setAlfredStatus, getTabCollectionInformation, setTabImmunity, getStore, getArchivedTabCollectionInformation, reviveTab } from "../helpers";

const pauseSvg = (
    `<svg aria-hidden="true" focusable="false" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
    <path 
        fill="currentColor" 
        d="M218 160h-20c-3.3 0-6 2.7-6 6v180c0 3.3 2.7 6 6 6h20c3.3 0 6-2.7 6-6V166c0-3.3-2.7-6-6-6zm96 0h-20c-3.3 0-6 2.7-6 6v180c0 3.3 2.7 6 6 6h20c3.3 0 6-2.7 6-6V166c0-3.3-2.7-6-6-6zM256 8C119 8 8 119 8 256s111 248 248 248 248-111 248-248S393 8 256 8zm0 464c-118.7 0-216-96.1-216-216 0-118.7 96.1-216 216-216 118.7 0 216 96.1 216 216 0 118.7-96.1 216-216 216z"
    ></path>
</svg>`
);

const playSvg = (
    `<svg aria-hidden="true" focusable="false" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
    <path d="M407.204 228.224L171.483 88.4127C152.331 77.0584 123 88.0767 123 116.16V395.716C123 420.91 150.255 436.094 171.483 423.463L407.204 283.719C428.232 271.29 428.299 240.653 407.204 228.224V228.224ZM396.356 265.243L160.635 404.987C153.537 409.086 144.429 404.181 144.429 395.716V116.16C144.429 105.209 155.412 103.798 160.568 106.888L396.289 246.7C403.32 250.865 403.32 261.078 396.356 265.243V265.243Z" fill="currentColor"/>
    <path d="M391.679 231.131L177.958 105.951C160.594 95.7849 134 105.65 134 130.794V381.094C134 403.652 158.711 417.247 177.958 405.938L391.679 280.818C410.743 269.69 410.804 242.259 391.679 231.131V231.131ZM381.843 264.276L168.122 389.396C161.686 393.065 153.429 388.674 153.429 381.094V130.794C153.429 120.989 163.387 119.726 168.062 122.493L381.782 247.673C388.157 251.403 388.157 260.546 381.843 264.276V264.276Z" fill="currentColor"/>
</svg>`
);

const launchSvg = (
    `<svg viewBox="0 0 512 512" aria-hidden="true" focusable="false" role="img" xmlns="http://www.w3.org/2000/svg">
    <rect width="512" height="512" fill="transparent"/>
    <path d="M422.75 256H408.25C406.327 256 404.483 256.764 403.123 258.123C401.764 259.483 401 261.327 401 263.25V444.5C401 448.346 399.472 452.034 396.753 454.753C394.034 457.472 390.346 459 386.5 459H67.5C63.6544 459 59.9662 457.472 57.247 454.753C54.5277 452.034 53 448.346 53 444.5V125.5C53 121.654 54.5277 117.966 57.247 115.247C59.9662 112.528 63.6544 111 67.5 111H248.75C250.673 111 252.517 110.236 253.877 108.877C255.236 107.517 256 105.673 256 103.75V89.25C256 87.3272 255.236 85.4831 253.877 84.1235C252.517 82.7638 250.673 82 248.75 82H67.5C55.9631 82 44.8987 86.583 36.7409 94.7409C28.583 102.899 24 113.963 24 125.5L24 444.5C24 456.037 28.583 467.101 36.7409 475.259C44.8987 483.417 55.9631 488 67.5 488H386.5C398.037 488 409.101 483.417 417.259 475.259C425.417 467.101 430 456.037 430 444.5V263.25C430 261.327 429.236 259.483 427.877 258.123C426.517 256.764 424.673 256 422.75 256V256ZM459 24H458.946L371.801 24.1541C346.018 24.1541 333.14 55.4559 351.338 73.6534L383.31 105.626L143.154 345.782C142.14 346.793 141.335 347.993 140.787 349.315C140.238 350.637 139.955 352.054 139.955 353.485C139.955 354.917 140.238 356.334 140.787 357.656C141.335 358.978 142.14 360.178 143.154 361.188L150.848 368.882C151.858 369.896 153.059 370.701 154.381 371.25C155.702 371.799 157.12 372.081 158.551 372.081C159.982 372.081 161.399 371.799 162.721 371.25C164.043 370.701 165.244 369.896 166.254 368.882L406.41 128.726L438.383 160.69C456.508 178.815 487.837 166.127 487.882 140.236L488 53.0453C488.006 49.2332 487.26 45.4573 485.806 41.9336C484.351 38.4099 482.216 35.2076 479.522 32.5099C476.829 29.8122 473.63 27.672 470.108 26.2118C466.587 24.7516 462.812 24 459 24V24ZM458.846 140.154L371.846 53.1541L459 53L458.846 140.154Z" fill="currentColor"/>
</svg>`
);

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

        el.innerHTML = `<span>00:00:00</span> <span>${tabTitle}${namedCount[tab.title] > 0 ? `[${namedCount[tab.title]}]` : ''}</span> <button data-immune='${tab.isImmune ? 'true' : 'false'}' title='${tab.isImmune ? 'Resume' : 'Pause Countdown'}'>${tab.isImmune ? playSvg : pauseSvg}</button>`;

        // update time remaining on each tab every second
        setInterval(async ()=>{
            let {isWatching} = await getAlfredStatus();
            let {ttl} = await getStore();
            if (!isWatching) return;
            let now = Date.now();
            let diff = tab.Deadline - now;
            let timeRemaining = diff > 0 ? msToTime(diff) : "00:00:00";
            el.querySelector("span:nth-of-type(1)").innerHTML = timeRemaining;
            if (diff < 0) {
                if (tab.isImmune) {
                    el.classList.add('inactive');
                    el.style.setProperty("--process-percent", "100%");
                    el.style.setProperty("--process-color", "gainsboro");
                }
                else {
                    el.classList.add('killed');
                    el.style.setProperty("--process-percent", "100%");
                    el.style.setProperty("--process-color", "transparent");
                    location.reload();
                }
            }
            else{
                let diffPercent = (diff / ttl.ms) * 100;
                let color = (()=>{
                    if ( diffPercent < 15) return 'rgb(218, 36, 81)';
                    if (diffPercent < 30) return 'orange';
                    return 'var(--main-color)';
                })();
                el.style.setProperty("--process-percent", diffPercent + "%");
                el.style.setProperty("--process-color", color);
            }
        }, 1000);

        
        // Allow user to prevent tab from being killed
        let btn = el.querySelector("button");
        
        btn.addEventListener("click", async ev => {
            let shouldMakeImmune = (btn.getAttribute('data-immune') === 'false');
            await setTabImmunity(shouldMakeImmune, tab.id);
            btn.innerHTML = shouldMakeImmune ? playSvg : pauseSvg;
            btn.setAttribute('data-immune', shouldMakeImmune ? 'true' : 'false');
            btn.setAttribute('title', shouldMakeImmune ? 'Resume' : 'Pause Countdown');
            document.location.reload();
        });

        tabColElement.appendChild(el);

    });

    let { archivedTabs } = await getArchivedTabCollectionInformation();

    if (archivedTabs.length > 0) tabColElement.appendChild(document.createElement('br'));

    archivedTabs.forEach(tab => {
        let el = document.createElement("div");
        el.classList.add("row");

        // make sure tab title isnt too long
        let tabTitle = tab.title.length > 50 ? tab.title.substring(0, 50) + '...' : tab.title;

        el.innerHTML = `<img src='${tab.favIconUrl}' alt=''/> <span>${tabTitle}</span> <button title='Revive'>${launchSvg}</button>`;

        // el.classList.add('inactive');
        el.style.setProperty("--process-percent", "0%");
        el.style.setProperty("--process-color", "transparent");

        // Allow user to prevent tab from being killed
        let btn = el.querySelector("button");
        
        btn.addEventListener("click", async ev => {
            await reviveTab(tab.id);
            location.reload();
        });

        tabColElement.appendChild(el);
    });

});