#!/bin/sh

# For local test
echo "======== build layer: [Heimdall] start ========"
NODE_VERSION=node18
# export AWS_PROFILE=<aws_profile>

pwd
rm -rf ./layers/heimdall/nodejs
mkdir -p ./layers/heimdall/nodejs/${NODE_VERSION}

zip -r node_modules.zip node_modules
mv node_modules.zip ./layers/heimdall/nodejs/${NODE_VERSION}/node_modules.zip
pwd

cd ./layers/heimdall/nodejs/${NODE_VERSION}/
unzip node_modules.zip
rm -rf node_modules.zip

cd ../../
pwd
# sdk/logging/lambda/layers/heimdall
zip -r nodejs.zip ./nodejs

echo "==== build layer: [Heimdall] publishing...  ====="
aws lambda publish-layer-version \
    --layer-name "Heimdall" \
    --zip-file  "fileb://nodejs.zip"

echo "========  build layer: [Heimdall] end  ========"

rm -rf nodejs.zip