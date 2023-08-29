import { RemovalPolicy, Stack } from 'aws-cdk-lib';
import { AttributeType, Table } from 'aws-cdk-lib/aws-dynamodb';
import { Vpc } from 'aws-cdk-lib/aws-ec2';
import { Cluster } from 'aws-cdk-lib/aws-ecs';
import { Effect, PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import { setParameterStore } from './common/utils';

export class CommonInfra {
  public readonly ecsCluster;
  public readonly vpc;
  public readonly ecsTaskRole;
  public readonly ddbTable;
  public readonly ddbSsm;
  public readonly regionSsm;
  public readonly sqsUrlSsm;

  constructor(scope: Construct, id: string) {
    const region = Stack.of(scope).region;
    const accountId = Stack.of(scope).account;
    this.vpc = new Vpc(scope, id + 'Vpc');
    this.ecsCluster = new Cluster(scope, id + 'Cluster', { vpc: this.vpc });

    this.ecsTaskRole = new Role(scope, id + 'taskRole', {
      assumedBy: new ServicePrincipal('ecs-tasks.amazonaws.com'),
    });

    this.ecsTaskRole.addToPolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ['ssm:*', 'dynamodb:*', 'sqs:*', 'xray:*'],
        resources: ['*'],
      })
    );

    this.ddbTable = new Table(scope, id + 'DdbTable', {
      tableName: 'techsummit-shop-ddb',
      partitionKey: { name: 'orderId', type: AttributeType.STRING },
      removalPolicy: RemovalPolicy.DESTROY,
    });

    this.ddbSsm = setParameterStore(
      scope,
      id + 'DdbParameterStore',
      '/summit/app/cloud.aws.ddb.table-name',
      'techsummit-shop-ddb'
    );
    setParameterStore(scope, id + 'SqsParameterStore', '/summit/app/cloud.aws.queue.name', 'techsummit-test-queue');

    this.sqsUrlSsm = setParameterStore(
      scope,
      id + 'SqsUrls',
      '/summit/app/cloud.aws.queue.uri',
      `https://sqs.${region}.amazonaws.com/${accountId}`
    );
    this.regionSsm = setParameterStore(
      scope,
      id + 'RegionParameterStore',
      '/summit/app/cloud.aws.region.static',
      region
    );
  }
}
