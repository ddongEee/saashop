#!/bin/sh

echo "========  deploy function: start  ========"
REGION=$1
FUNCTION_NAME=$(aws lambda list-functions \
    --query "Functions[?starts_with(FunctionName, 'SourceStack-SourceStackPaymentService')].FunctionName" \
    --output text \
    --profile source --region $REGION)
echo 'LambdaFunctionName is '$FUNCTION_NAME

cd ./src && zip -r lambda.zip .

echo "==== deploy function: publishing...  ====="
aws lambda update-function-code \
    --function-name ${FUNCTION_NAME} \
    --zip-file fileb://lambda.zip \
    --profile source --region ${REGION}

echo "========  deploy function: end  =========="

rm -rf ./lambda.zip