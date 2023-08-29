import { Repository } from 'aws-cdk-lib/aws-ecr';
import { DockerImageAsset } from 'aws-cdk-lib/aws-ecr-assets';
import { Construct } from 'constructs';
import * as ecrdeploy from 'cdk-ecr-deployment';
import path = require('path');
import { Queue } from 'aws-cdk-lib/aws-sqs';
import { RemovalPolicy, Stack } from 'aws-cdk-lib';
import { generateLogGroup, setParameterStore } from './common/utils';
import { ApplicationLoadBalancedFargateService } from 'aws-cdk-lib/aws-ecs-patterns';
import {
  Cluster,
  ContainerDefinition,
  ContainerImage,
  FargateTaskDefinition,
  LogDriver,
  Protocol,
} from 'aws-cdk-lib/aws-ecs';
import { Role } from 'aws-cdk-lib/aws-iam';
import { Vpc } from 'aws-cdk-lib/aws-ec2';

export class OrderService {
  public readonly orderedQueue;
  constructor(
    scope: Construct,
    id: string,
    vpc: Vpc,
    ecsCluster: Cluster,
    ecsTaskRole: Role,
    logDestinationArn: string
  ) {
    const stackRegion = Stack.of(scope).region;
    const orderImage = new DockerImageAsset(scope, id + 'OrderImage', {
      directory: path.join(__dirname, '../../../services/order/'),
    });

    const orderImageEcr = new Repository(scope, id + 'OrderImageEcr');

    new ecrdeploy.ECRDeployment(scope, id + 'DeployOrderDockerImage', {
      src: new ecrdeploy.DockerImageName(orderImage.imageUri),
      dest: new ecrdeploy.DockerImageName(orderImageEcr.repositoryUri),
    });

    this.orderedQueue = new Queue(scope, id + 'OrderedQueue', {
      queueName: 'techsummit-ordered-queue',
      removalPolicy: RemovalPolicy.DESTROY,
    });

    setParameterStore(
      scope,
      id + 'OrderSqsParameterStore',
      '/summit/app/cloud.aws.queue.ordered-name',
      'techsummit-ordered-queue'
    );
    const orderServiceLogGroup = generateLogGroup(scope, id + 'OrderServiceLogGroup', 'ecs', logDestinationArn);

    const orderTaskDefinition = new FargateTaskDefinition(scope, id + 'OrderTaskDefinition', {
      taskRole: ecsTaskRole,
    });

    const appContainer = new ContainerDefinition(scope, id + 'OrderAppContainer', {
      image: ContainerImage.fromEcrRepository(orderImageEcr),
      taskDefinition: orderTaskDefinition,
      logging: LogDriver.awsLogs({
        logGroup: orderServiceLogGroup,
        streamPrefix: 'orderService',
      }),
      environment: { SOURCE_REGION: stackRegion },
    });

    appContainer.addPortMappings({
      hostPort: 8080,
      containerPort: 8080,
    });

    const xrayContainer = new ContainerDefinition(scope, id + 'XrayContainer', {
      image: ContainerImage.fromRegistry('amazon/aws-xray-daemon'),
      taskDefinition: orderTaskDefinition,
      logging: LogDriver.awsLogs({
        logGroup: orderServiceLogGroup,
        streamPrefix: 'xray',
      }),
    });
    xrayContainer.addPortMappings({
      protocol: Protocol.UDP,
      hostPort: 2000,
      containerPort: 2000,
    });

    const orderService = new ApplicationLoadBalancedFargateService(scope, id + 'OrderService', {
      cluster: ecsCluster,
      memoryLimitMiB: 1024,
      desiredCount: 1,
      cpu: 512,
      taskDefinition: orderTaskDefinition,
      taskSubnets: {
        subnets: vpc.privateSubnets,
      },
      loadBalancerName: id + 'alb',
      listenerPort: 80,
    });

    orderService.targetGroup.configureHealthCheck({ path: '/actuator/health' });
  }
}
