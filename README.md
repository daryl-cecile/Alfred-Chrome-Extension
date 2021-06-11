# Alfred Chrome Extension (PoC)

Speed-coded chrome extension that automatically "cleans up" (closes) old tabs that havent been used for a while. 
This extension gives you the ability to set up ignore rules for urls, and allows you to set a TTL for the tabs.

Due to time constraints and nature (PoC) of this project, the code in this repo has not been tested extensively - **use at your own risks**. PRs accepted.


## Build and Test locally

Running `npm install` and then `npm run build` will build the files and copy all required files into the `./extension/` folder. You can then load this extension in your browser after switching on 'Developer mode' on the extensions page.


## Notes:

|              | Notes                                                                                              |
| -----------: | :------------------------------------------------------------------------------------------------- |
| 08 June 2021 | Completed speed-code after 7hrs                                                                    |
| 09 June 2021 | User tested in Chrome and Brave browsers                                                           |
| 11 June 2021 | I've gone through the code to convert it to typescript to make maintenance and future work easier. |
| 11 June 2021 | Removed unused permission |
