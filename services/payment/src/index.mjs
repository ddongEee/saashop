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
    logger.info('[PaymentService] Message from OrderService:', JSON.parse(event.Records[0].body));
    logger.debug('[PaymentService] Hello from Lambda');
    logger.error('[PaymentService] Hello from Lambda');
    logger.warn('[PaymentService] Hello from Lambda');

    // Update DDB
    const orderId = JSON.parse(event.Records[0].body).orderId;
    const currentDate = new Date().toISOString();
    const ddbParams = {
      TableName: DDB_TABLE_NAME,
      Key: {
        orderId,
      },
      UpdateExpression: 'SET event = list_append(event, :paidEvent), lastUpdatedAt = :currentTime',
      ExpressionAttributeValues: {
        ':paidEvent': [{ PAID: currentDate }],
        ':currentTime': currentDate,
      },
      ReturnValues: 'ALL_NEW',
    };
    const ddbResult = await updateOrderStatus(ddbParams);
    logger.info('[PaymentService] Successfully update order status.');

    // Send Message
    const messageBody = { orderId };
    const sqsParams = {
      QueueUrl: QUEUE_URL,
      MessageBody: JSON.stringify(messageBody),
    };
    const sqsResult = await sendMessage(sqsParams, logger.getLogContext() ?? undefined);
    logger.info('[PaymentService] Successfully send message to delivery service.');
  } catch (e) {
    const error = new Error(e);
    error.code = 500;
    throw error;
  }

  logger.info('[PaymentService] Payment completed successfully.');

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'sucess',
    }),
  };
};

export const handler = middlewares(lambdaHandler).use(interceptor(logger));
