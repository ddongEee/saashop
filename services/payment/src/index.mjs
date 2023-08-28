import { getResourceParameters, updateOrderStatus, sendMessage } from './service/service.mjs'
import { Logger, middlewares, interceptor } from "@hdall/lambda";
import LOG_CONFIG from "./config/config.mjs";

const logger = new Logger(LOG_CONFIG, {logLevel: 'INFO'});
let DDB_TABLE_NAME, QUEUE_URL;

const lambdaHandler = async (event, context) => {
  if (!DDB_TABLE_NAME || !QUEUE_URL) {
    const params = await getResourceParameters();
    DDB_TABLE_NAME = params.DDB_TABLE_NAME;
    QUEUE_URL = `${params.QUEUE_URI}/${params.PAID_QUEUE_NAME}`;
  }
  
  try {
    logger.info('Hello from Lambda');
    logger.debug('Hello from Lambda');
    logger.error('Hello from Lambda');
    logger.warn('Hello from Lambda');
    
    // Update DDB
    const currentDate = (new Date()).toISOString();
    const ddbParams = {
      TableName: DDB_TABLE_NAME,
      Key: {
        orderId: event.orderId
      },
      UpdateExpression: "SET event = list_append(event, :paidEvent), lastUpdatedAt = :currentTime",
      // ExpressionAttributeNames: {
      //    '#event': 'event',
      //    '#lastUpdatedAt': 'lastUpdatedAt'
      // },
      ExpressionAttributeValues: {
        ":paidEvent": [{ "PAID": currentDate }],
        ":currentTime": currentDate
      },
      ReturnValues: "ALL_NEW",
    };
    const ddbResult = await updateOrderStatus(ddbParams);
    console.log('ddb result: ', ddbResult);
    
    // Send Message
    const sqsParams = {
      QueueUrl: QUEUE_URL,
      // DelaySeconds: 10,
      MessageAttributes: {
        key: 'value'
      },
      MessageBody:
        "hello",
    };
    const sqsResult = await sendMessage(sqsParams, logger.getLogContext() ?? undefined);
    console.log('sqs result: ', sqsResult);
    
  } catch (e) {
    const error = new Error(e);
    error.code = 500;
    throw error;
  } 
    
    
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "sucess",
      logContext: logger.getLogContext()?.logContext ?? undefined
    })
  }
}

export const handler = middlewares(lambdaHandler).use(interceptor(logger));