// import { logger, ContextAwareSqsConsumer, tracer, ContextAwareSqsProducer, contextMiddleware, openSegment, closeSegment } from '@hdall/express';
import { DynamoDBClient, UpdateItemCommand, GetItemCommand, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';
import { consts } from './src/const/consts.js';
import { Consumer } from 'sqs-consumer';


const ssmClient = new SSMClient();
// tracer.captureAWSv3Client(ssmClient);
const ddbClient = new DynamoDBClient();
// tracer.captureAWSv3Client(ddbClient);

const getConsumeSqsUriInput = {
  Name: consts.CONSUME_TARGET_SQS_URI,
};

const getConsumeSqsNameInput = {
  Name: consts.CONSUME_TARGET_SQS_NAME,
};
const sqsUriRes = await ssmClient.send(new GetParameterCommand(getConsumeSqsUriInput));
const sqsNameRes = await ssmClient.send(new GetParameterCommand(getConsumeSqsNameInput));
const sqsUri = sqsUriRes.Parameter.Value;
const sqsName = sqsNameRes.Parameter.Value;
const fromSqsUrl = sqsUri + '/' + sqsName;

const getDdbTableInput = {
  Name: consts.TARGET_DDB_TABLE,
};
const response2 = await ssmClient.send(new GetParameterCommand(getDdbTableInput));
const ddbTableName = response2.Parameter.Value;

const getCurrentFormattedDate = () => {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const milliseconds = String(now.getMilliseconds()).padStart(3, '0');

  const formattedDate = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${milliseconds}`;

  return formattedDate;
};

const customHandleMessage = async (m) => {
  try {
    console.info(`\n=========== ${fromSqsUrl} CONSUMER customHandleMessage =====================>`);
    console.info('MESSAGE > ', m);

    const body = JSON.parse(m.Body);
    const orderId = body.orderId;

    const ddbGetInput = {
      TableName: ddbTableName,
      Key: {
        orderId: {
          S: orderId,
        },
      },
    };

    const existedOrder = await ddbClient.send(new GetItemCommand(ddbGetInput));

    let ddbInput;
    const current = getCurrentFormattedDate();
    if (existedOrder.Item) {
      ddbInput = {
        TableName: ddbTableName,
        Key: {
          orderId: {
            S: orderId,
          },
        },
        UpdateExpression: 'SET event = list_append(event, :deliveredEvent), lastUpdatedAt = :currentTime',
        ExpressionAttributeValues: {
          ':deliveredEvent': {
            L: [{ M: { DELIVERED: { S: current } } }],
          },
          ':currentTime': {
            S: current,
          },
        },
        ReturnValues: 'ALL_NEW',
      };

      const response4 = await ddbClient.send(new UpdateItemCommand(ddbInput));
      console.info('@ UpdateItemCommand result >> ', response4.Attributes.orderId);
    } else {
      console.info('@ NO ORDER ID >> ', m);
    }
  } catch (e) {
    // console.error(e, e.stack);
    console.error(e, e.stack);
  }
};

const sqsConsumer = /*ContextAwareSqsConsumer*/Consumer.create({
  messageAttributeNames: ['All'],
  queueUrl: fromSqsUrl,
  batchSize: 10,
  waitTimeSeconds: 20,
  handleMessage: customHandleMessage,
});

sqsConsumer.on('error', (err) => {
  console.error(`error`, err);
});

console.info(`[init][SQS] polling with ${fromSqsUrl}`);
sqsConsumer.start();
