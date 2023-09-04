#!/bin/sh

echo "========  deploy function: start  ========"
FUNCTION_NAME=$1
echo hi ${FUNCTION_NAME}
# zip -r lambda.zip ./src/**
cd ./src && zip -r lambda.zip .

echo "==== deploy function: publishing...  ====="
aws lambda update-function-code --function-name ${FUNCTION_NAME} --zip-file fileb://lambda.zip

echo "========  deploy function: end  =========="

rm -rf ./lambda.zip