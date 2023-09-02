import { Construct } from 'constructs';
import { Code, Function, LayerVersion, Runtime, Tracing } from 'aws-cdk-lib/aws-lambda';
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

    // const layer = new LayerVersion(scope, id + 'LambdaLayer', {
    //   compatibleRuntimes: [Runtime.NODEJS_18_X, Runtime.NODEJS_16_X, Runtime.NODEJS_14_X],
    //   code: Code.fromAsset('lambda/layer/nodejs.zip'),
    //   layerVersionName: 'ts-workshop-heimdall',
    // });

    const paymentLambda = new Function(scope, id + 'PaymentService', {
      runtime: Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: Code.fromAsset('lambda/code/'),
      tracing: Tracing.ACTIVE,
      // layers: [layer],
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
