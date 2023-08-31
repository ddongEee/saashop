#!/bin/sh

# For local test
echo "======== build layer: [Heimdall] start ========"
# NODE_VERSION=node18
# export AWS_PROFILE=<your-aws-profile>
# AWS_REGION=<your-aws-region>

rm -rf ./layers/heimdall/nodejs
mkdir -p ./layers/nodejs/

zip -r node_modules.zip node_modules
mv node_modules.zip ./layers/nodejs/node_modules.zip

cd ./layers/nodejs/
unzip node_modules.zip
rm -rf node_modules.zip

cd ../
zip -r nodejs.zip ./nodejs

echo "==== build layer: [Heimdall] publishing...  ====="
aws lambda publish-layer-version \
    --region ${AWS_REGION} \
    --layer-name "Heimdall" \
    --zip-file  "fileb://nodejs.zip"

echo "========  build layer: [Heimdall] end  ========"

rm -rf nodejs.zip