import { Construct } from 'constructs';
import { Code, Function, Runtime, Tracing } from 'aws-cdk-lib/aws-lambda';
import { RemovalPolicy } from 'aws-cdk-lib';
import { Queue } from 'aws-cdk-lib/aws-sqs';
import { generateLogGroup, setParameterStore } from './common/utils';
import { Table } from 'aws-cdk-lib/aws-dynamodb';
import { SqsEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';

export class PaymentService {
  public readonly paymentQueue;

  constructor(scope: Construct, id: string, orderedQueue: Queue, ddbTable: Table, logDestinationArn: string) {
    const paymentQueueName = 'techsummit-paid-queue';

    this.paymentQueue = new Queue(scope, id + 'PaymentQueue', {
      queueName: paymentQueueName,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    setParameterStore(scope, id + 'PaidSqsParameterStore', '/summit/app/cloud.aws.queue.paid-name', paymentQueueName);

    const paymentLambda = new Function(scope, id + 'PaymentService', {
      runtime: Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: Code.fromAsset('lambda'),
      tracing: Tracing.ACTIVE,
    });

    generateLogGroup(scope, id, 'lambda', logDestinationArn, paymentLambda.functionName);

    this.paymentQueue.grantSendMessages(paymentLambda);
    orderedQueue.grantConsumeMessages(paymentLambda);
    ddbTable.grantReadWriteData(paymentLambda);

    paymentLambda.addEventSource(new SqsEventSource(orderedQueue));
  }
}
