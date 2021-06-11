mkdir -p ./extension/
mkdir -p ./extension/ui/
mkdir -p ./extension/images/
./node_modules/.bin/esbuild ./src/background/background.ts --bundle --minify --platform=browser --outfile=./extension/background.js
./node_modules/.bin/esbuild ./src/foreground/popup/action.ts --bundle --minify --platform=browser --outfile=./extension/ui/popup/action.js
./node_modules/.bin/esbuild ./src/foreground/options/action.ts --bundle --minify --platform=browser --outfile=./extension/ui/options/action.js

#find "$(cd ./src/foreground; pwd)" -type f -not -name "*.ts" -exec cp {} extension/ui/{} \;

find src/foreground/popup -type f -not -name "*.ts" -exec cp {} extension/ui/popup/ \;
find src/foreground/options -type f -not -name "*.ts" -exec cp {} extension/ui/options/ \;

cp src/manifest.json extension/
cp images/albert_icon.png extension/images/