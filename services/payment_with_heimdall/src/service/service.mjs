import AWSXRay from 'aws-xray-sdk';
import { SSMClient, GetParametersCommand } from '@aws-sdk/client-ssm';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { SendMessageCommand, SQSClient } from '@aws-sdk/client-sqs';

const region = process.env.AWS_REGION;
const ssmClient = AWSXRay.captureAWSv3Client(new SSMClient({ region: region }));
const sqsClient = AWSXRay.captureAWSv3Client(new SQSClient({ region: region }));
const ddbClient = AWSXRay.captureAWSv3Client(new DynamoDBClient({ region: region }));
const docClient = DynamoDBDocumentClient.from(ddbClient);

const SET_SQS_MSG_ATTRIBUTES_KEY = 'logAttributes';
const SSM_PARAMS_KEY = {
  DDB_TABLE_NAME: '/summit/app/cloud.aws.ddb.table-name',
  QUEUE_URI: '/summit/app/cloud.aws.queue.uri',
  PAID_QUEUE_NAME: '/summit/app/cloud.aws.queue.paid-name',
  REGION: '/summit/app/cloud.aws.region.static',
};
let RESOURCE_PARAMS = {};

const getResourceParameters = async () => {
  const input = {
    // GetParametersRequest
    Names: Object.values(SSM_PARAMS_KEY), // ParameterNameList
    WithDecryption: false,
  };
  try {
    const command = new GetParametersCommand(input);
    const parameters = (await ssmClient.send(command)).Parameters;

    const parameterMappings = {
      [SSM_PARAMS_KEY.DDB_TABLE_NAME]: 'DDB_TABLE_NAME',
      [SSM_PARAMS_KEY.QUEUE_URI]: 'QUEUE_URI',
      [SSM_PARAMS_KEY.PAID_QUEUE_NAME]: 'PAID_QUEUE_NAME',
      [SSM_PARAMS_KEY.REGION]: 'REGION',
    };

    for (const parameter of parameters) {
      const paramName = parameterMappings[parameter.Name];
      if (paramName) {
        RESOURCE_PARAMS[paramName] = parameter.Value;
      }
    }
    return RESOURCE_PARAMS;
  } catch (e) {
    throw e;
  }
};

const appendMessageAttributes = (originParam, key, value) => {
  const newParams = {
    ...originParam,
    MessageAttributes: {
      [key]: {
        DataType: 'String',
        StringValue: JSON.stringify(value),
      },
    },
    ...originParam.MessageAttributes,
  };
  return newParams ?? undefined;
};

const sendMessage = async (params, context = undefined) => {
  try {
    if (context?.logContext) {
      // Append log context into message attributes of SQS message
      const logContext = context?.logContext;
      try {
        const paramsWithLogContext = appendMessageAttributes(params, SET_SQS_MSG_ATTRIBUTES_KEY, logContext);
        const command = new SendMessageCommand(paramsWithLogContext);
        return await sqsClient.send(command);
      } catch (e) {
        console.warn(e);
      }
    } else {
      // Send message without log context
      const command = new SendMessageCommand(params);
      return await sqsClient.send(command);
    }
    return;
  } catch (e) {
    throw e;
  }
};

const updateOrderStatus = async (params) => {
  try {
    const command = new UpdateCommand(params);

    const response = await docClient.send(command);
    return response;
  } catch (e) {
    throw e;
  }
};

export { getResourceParameters, updateOrderStatus, sendMessage };
