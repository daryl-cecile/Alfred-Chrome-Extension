import { getStore, setStore } from "../helpers";


document.addEventListener('DOMContentLoaded', async function () {

    let storage = await getStore();

    const badgeVisibilityEl = document.querySelector<HTMLInputElement>("#badge_visibility");
    const ttlEl = document.querySelector<HTMLInputElement>("#ttl");
    const ignorePatternEl = document.querySelector<HTMLTextAreaElement>("#ignore_patterns");

    badgeVisibilityEl.value = storage.badge.visible ? '1' : '0';
    ttlEl.value = ((storage.ttl.ms ?? 120_000) / 1000 / 60).toString();
    ignorePatternEl.value = storage.cleanupRules.ignorePatterns.join("\n");

    let btn = document.querySelector<HTMLButtonElement>("#save_btn");
    
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