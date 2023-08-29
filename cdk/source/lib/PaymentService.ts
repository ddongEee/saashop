import { Construct } from 'constructs';
import { Code, Function, Runtime, Tracing } from 'aws-cdk-lib/aws-lambda';
import { RemovalPolicy } from 'aws-cdk-lib';
import { Queue } from 'aws-cdk-lib/aws-sqs';
import { generateLogGroup, setParameterStore } from './common/utils';
import { Table } from 'aws-cdk-lib/aws-dynamodb';
import { SqsEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';

interface ssmList {
  region: StringParameter;
  sqsUrl: StringParameter;
  ddbTable: StringParameter;
}

export class PaymentService {
  public readonly paymentQueue;
  public readonly paiedSqsSsm;

  constructor(
    scope: Construct,
    id: string,
    orderedQueue: Queue,
    ddbTable: Table,
    ssmList: ssmList,
    logDestinationArn: string
  ) {
    const paymentQueueName = 'techsummit-paid-queue';

    this.paymentQueue = new Queue(scope, id + 'PaymentQueue', {
      queueName: paymentQueueName,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    this.paiedSqsSsm = setParameterStore(
      scope,
      id + 'PaidSqsParameterStore',
      '/summit/app/cloud.aws.queue.paid-name',
      paymentQueueName
    );

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
    ssmList.region.grantRead(paymentLambda);
    ssmList.sqsUrl.grantRead(paymentLambda);
    ssmList.ddbTable.grantRead(paymentLambda);
    this.paiedSqsSsm.grantRead(paymentLambda);

    paymentLambda.addEventSource(new SqsEventSource(orderedQueue));
  }
}
