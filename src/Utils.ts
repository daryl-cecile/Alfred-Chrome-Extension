
export function cloneObj<T>(object:T):T{
    return JSON.parse(JSON.stringify(object));
}

export function convertPatternToRegex(pattern:string){
    return new RegExp(pattern.split("").map(char => {
        if (char === ".") return "\\.";
        if (char === "/") return "\\/";
        if (char === "?") return "\\?";
        if (char === "*") return ".*";
        return char;
    }).join(""), "gm");
}

export function uiUpdateStatus(isWatching:boolean){
    let statusElement = document.querySelector("#status-row");
    statusElement.classList[isWatching ? "add" : "remove"]('status_watching');
    statusElement.querySelector("span").innerHTML = `Status: ${isWatching ? "Counting down" : "stopped"}`;
    statusElement.querySelector("button").innerHTML = isWatching ? 'Stop' : 'Start';
}

export function msToTime(s:number) {
    const pad = (n:number) => {
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