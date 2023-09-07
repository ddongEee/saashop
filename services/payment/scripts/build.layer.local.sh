#!/bin/sh

echo "========  deploy layer: start  ========"
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

echo "==== deploy layer: publishing...  ====="
output=$(aws lambda publish-layer-version \
    --layer-name "ts-workshop-heimdall" \
    --zip-file  "fileb://nodejs.zip" \
    --profile source --region ${REGION})

echo "====== deploy layer: adding... ======="
export LambdaFunctionName=$(aws lambda list-functions --query "Functions[?starts_with(FunctionName, 'SourceStack-SourceStackPaymentService')].FunctionName" --output text --profile source --region $SRC_REGION)

LayerVersionArn=$(echo "$output" | grep -oP 'LayerVersionArn:\s+\K[^\n]+')
export LayerVersionArn
echo 'LambdaLayerVersionArn is '$LayerVersionArn
aws lambda update-function-configuration \
    --function-name $LambdaFunctionName \
    --layers $LayerVersionArn \
    --profile source --region ${REGION}

echo "========  deploy layer: end  =========="
rm -rf nodejs.zip