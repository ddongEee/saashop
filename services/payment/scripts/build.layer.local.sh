#!/bin/sh

echo "========  build layer: start  ========"
REGION=$1
rm -rf ./layers/heimdall/nodejs
mkdir -p ./layers/nodejs/

zip -r node_modules.zip node_modules
mv node_modules.zip ./layers/nodejs/node_modules.zip

cd ./layers/nodejs/
unzip node_modules.zip
rm -rf node_modules.zip

cd ../
zip -r nodejs.zip ./nodejs

echo "==== build layer: publishing...  ====="
aws lambda publish-layer-version \
    --layer-name "ts-workshop-heimdall" \
    --zip-file  "fileb://nodejs.zip" \
    --profile source --region ${REGION}

echo "========  build layer: end  =========="

rm -rf nodejs.zip