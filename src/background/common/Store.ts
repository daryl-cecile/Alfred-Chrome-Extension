import { AppVariables, Awaitable, Properties, UserPreferences, ValueOf } from "../../custom";
import { verifyTabRegister } from "./BackgroundHelpers";
import { cloneObj } from "../../Utils";

export const Store = {
    async userPreference<X extends keyof UserPreferences>(name:X, callback:(obj:UserPreferences[X])=>Awaitable<UserPreferences[X]|void>){
        return new Promise<void>(resolve => {
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
                    }, () => resolve());
                }
            });
        })
    },
    async readUserPreference<X extends keyof UserPreferences>(name:X){
        return new Promise<UserPreferences[X]>(resolve => {
            Store.userPreference(name, obj => {
                let clone = cloneObj(obj);
                // cloned to prevent updating actual object, in turn preventing a save
                resolve(clone);
            });
        });
    },
    async readAllUserPreferences(){
        return new Promise<UserPreferences>(resolve => {
            chrome.storage.sync.get(null, val => resolve(<UserPreferences>val));
        });
    },
    async setAllUserPreferences(newContent:UserPreferences, current?:UserPreferences){
        let old = current ?? await Store.readAllUserPreferences();
        return new Promise<void>(resolve => {
            chrome.storage.sync.set({
                ...old,
                ...newContent
            }, async ()=>{

                resolve();

                // trigger tab monitors reset in appVars
                await Store.AppVariable('status', status => {
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
    async AppVariable<X extends keyof AppVariables>(name:X, callback:(obj:AppVariables[X])=>Awaitable<AppVariables[X]|void>){
        return new Promise<void>(resolve => {
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
                    }, () => resolve());
                }
            });
        })
    },
    async readAppVariable<X extends keyof AppVariables>(name:X){
        return new Promise<AppVariables[X]>(resolve => {
            Store.AppVariable(name, obj => {
                let clone = cloneObj(obj);
                // cloned to prevent updating actual object, in turn preventing a save
                resolve(clone)
            })
        });
    },
    async readAllAppVariables(){
        return new Promise<AppVariables>(resolve => {
            chrome.storage.local.get(null, val => resolve(<AppVariables>val));
        });
    },
    async setAllAppVariables(newVars:AppVariables, current?:AppVariables){
        let old = current ?? await Store.readAllAppVariables();
        return new Promise<void>(resolve => {
            chrome.storage.local.set({
                ...old,
                ...newVars
            }, ()=> resolve());
        });
    },
    async resetAppVariables(){
        return new Promise<void>(resolve => {
            chrome.storage.local.clear(resolve);
        });
    }
};