
import { logger, ContextAwareSqsConsumer, ContextAwareSqsProducer } from '@hdall/express';
import { getComsumingSqsUrl, getNextSqsUrl } from './src/configuration/director.js';

const fromSqsUrl = getComsumingSqsUrl();
const nextSqsUrl = getNextSqsUrl();
const producer = new ContextAwareSqsProducer();
const customHandleMessage = async (m) => {
  try {
    console.log(`\n=========== ${fromSqsUrl} CONSUMER customHandleMessage =====================>`)
    logger.info('Hello from jihyeRay1 listener > ', m);
    const data = {
      key1: 'jihyeRay1',
    };

    const params = {
      MessageBody: JSON.stringify(data),
      QueueUrl: nextSqsUrl,
    };

    const response = await producer.tenantAwareSendMessage(params);
    console.info(`================== SEND COMPLETED message to ${nextSqsUrl}>>>`, response)

  } catch (e) {
    logger.error(e, e.stack);
  }
}

const sqsConsumer = ContextAwareSqsConsumer.create({
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