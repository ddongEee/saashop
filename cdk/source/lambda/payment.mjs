import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
const sqsClient = new SQSClient({ region: 'ap-southeast-1' });

export const handler = async (event, context) => {
  event.Records.forEach((record) => {
    console.log('Record: %j', record);
  });

  let response;

  const params = {
    DelaySeconds: 10,
    MessageAttributes: {
      Author: {
        DataType: 'String',
        StringValue: 'Haemi',
      },
    },
    MessageBody: 'Payment completed',
    QueueUrl: process.env.queueUrl,
  };

  try {
    const data = await sqsClient.send(new SendMessageCommand(params));
    if (data) {
      console.log('Success, message sent. MessageID:', data.MessageId);
      const bodyMessage = 'Message Send to SQS- Here is MessageId: ' + data.MessageId;
      response = {
        statusCode: 200,
        body: JSON.stringify(bodyMessage),
      };
    } else {
      response = {
        statusCode: 500,
        body: JSON.stringify('Some error occured !!'),
      };
    }
    return response;
  } catch (err) {
    console.log('Error', err);
  }
};
