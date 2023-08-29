import { getResourceParameters, updateOrderStatus, sendMessage } from './service/service.mjs';
import { Logger, middlewares, interceptor } from '@hdall/lambda';
import LOG_CONFIG from './config/config.mjs';

const logger = new Logger(LOG_CONFIG, { logLevel: 'INFO' });
let DDB_TABLE_NAME, QUEUE_URL;

const lambdaHandler = async (event, context) => {
  if (!DDB_TABLE_NAME || !QUEUE_URL) {
    const params = await getResourceParameters();
    DDB_TABLE_NAME = params.DDB_TABLE_NAME;
    QUEUE_URL = `${params.QUEUE_URI}/${params.PAID_QUEUE_NAME}`;
  }

  try {
    logger.info('Event from OrderService is', JSON.parse(event.Records[0].body));
    logger.debug('Hello from Lambda');
    logger.error('Hello from Lambda');
    logger.warn('Hello from Lambda');

    // Update DDB
    const orderId = JSON.parse(event.Records[0].body).orderId;
    const currentDate = new Date().toISOString();
    const ddbParams = {
      TableName: DDB_TABLE_NAME,
      Key: {
        orderId,
      },
      UpdateExpression: 'SET event = list_append(event, :paidEvent), lastUpdatedAt = :currentTime',
      // ExpressionAttributeNames: {
      //    '#event': 'event',
      //    '#lastUpdatedAt': 'lastUpdatedAt'
      // },
      ExpressionAttributeValues: {
        ':paidEvent': [{ PAID: currentDate }],
        ':currentTime': currentDate,
      },
      ReturnValues: 'ALL_NEW',
    };
    const ddbResult = await updateOrderStatus(ddbParams);
    console.log('ddb result: ', ddbResult);

    // Send Message
    const messageBody = { orderId };
    const sqsParams = {
      QueueUrl: QUEUE_URL,
      MessageBody: JSON.stringify(messageBody),
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
      message: 'sucess',
    }),
  };
};

export const handler = middlewares(lambdaHandler).use(interceptor(logger));
