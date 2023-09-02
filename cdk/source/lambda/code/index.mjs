import { getResourceParameters, updateOrderStatus, sendMessage } from './service/service.mjs';

// TODO: import heimdall sdk and log config

// TODO: create logger

let DDB_TABLE_NAME, QUEUE_URL;

export const handler = async (event, context) => {
  if (!DDB_TABLE_NAME || !QUEUE_URL) {
    const params = await getResourceParameters();
    DDB_TABLE_NAME = params.DDB_TABLE_NAME;
    QUEUE_URL = `${params.QUEUE_URI}/${params.PAID_QUEUE_NAME}`;
  }

  try {
    // TODO: Replace all existing console.log() statements in the Lambda function to appropriate log levels like logger.info(), logger.error(), etc.
    console.log('[PaymentService] Message from OrderService:', JSON.parse(event.Records[0].body));
    console.debug('[PaymentService] Hello from Lambda');
    console.error('[PaymentService] Hello from Lambda');
    console.warn('[PaymentService] Hello from Lambda');

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
    console.log('[PaymentService] Successfully update order status.');

    // Send Message
    const messageBody = { orderId };
    const sqsParams = {
      QueueUrl: QUEUE_URL,
      MessageBody: JSON.stringify(messageBody),
    };
    const sqsResult = await sendMessage(sqsParams);
    console.log('[PaymentService] Successfully send message to delivery service.');
  } catch (e) {
    const error = new Error(e);
    error.code = 500;
    throw error;
  }

  console.log('[PaymentService] Payment completed successfully.');

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'sucess',
    }),
  };
};
