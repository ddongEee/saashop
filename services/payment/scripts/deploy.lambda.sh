#!/bin/sh

echo "========  deploy function: start  ========"
FUNCTION_NAME=$1
REGION=$2
cd ./src && zip -r lambda.zip .

echo "==== deploy function: publishing...  ====="
aws lambda update-function-code \
    --function-name ${FUNCTION_NAME} \
    --zip-file fileb://lambda.zip \
    --profile source --region ${REGION}

echo "========  deploy function: end  =========="

rm -rf ./lambda.zip