import { logger, ContextAwareSqsConsumer, tracer, ContextAwareSqsProducer, contextMiddleware, openSegment, closeSegment } from '@hdall/express';
import { v4 as uuidv4 } from 'uuid';
import { DynamoDBClient, UpdateItemCommand, GetItemCommand, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';
import { consts } from './src/const/consts.js';
import { Consumer } from 'sqs-consumer';


const ssmClient = new SSMClient();
tracer.captureAWSv3Client(ssmClient);
const ddbClient = new DynamoDBClient();
tracer.captureAWSv3Client(ddbClient);
// const producer = new ContextAwareSqsProducer();

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
    // console.log(`\n=========== ${fromSqsUrl} CONSUMER customHandleMessage =====================>`);
    logger.info(`\n=========== ${fromSqsUrl} CONSUMER customHandleMessage =====================>`);
    // console.log('MESSAGE > ', m);
    logger.info('MESSAGE > ', m);

    const attributes = m.Attributes;
    const orderId = 'a50a1a1d-e1b2-4b12-8223-68357703cee4'; //attributes.orderId ?? uuidv4();
    // const orderId = attributes.orderId ?? uuidv4();
    logger.info('orderId > ', orderId);

    // const ddbGetInput = {
    //   TableName: ddbTableName,
    //   Key: {
    //     orderId: {
    //       S: orderId,
    //     },
    //   },
    // };

    const existedOrder = await ddbClient.send(new GetItemCommand(ddbGetInput));
    // logger.info('@ existedOrder > ', existedOrder.Item);

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
        // AttributeUpdates: {
        //   event: {
        //     Value: [{"DELIVERED" : current}],
        //     Action: "PUT"
        //   },
        // },
        ReturnValues: 'ALL_NEW',
      };

      const response4 = await ddbClient.send(new UpdateItemCommand(ddbInput));
      logger.info('@ UpdateItemCommand result >> ', response4);
    } else {
      logger.info('@ NO ORDER ID >> ', m);
    }
  } catch (e) {
    // logger.error(e, e.stack);
    logger.error(e, e.stack);
  }
};

const sqsConsumer = /*Consumer*/ContextAwareSqsConsumer.create({
  messageAttributeNames: ['All'],
  queueUrl: fromSqsUrl,
  batchSize: 10,
  waitTimeSeconds: 20,
  handleMessage: customHandleMessage,
});

sqsConsumer.on('error', (err) => {
  logger.error(`error`, err);
});

logger.info(`[init][SQS] polling with ${fromSqsUrl}`);
sqsConsumer.start();
