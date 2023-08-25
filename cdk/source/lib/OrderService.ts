import { Repository } from 'aws-cdk-lib/aws-ecr';
import { DockerImageAsset } from 'aws-cdk-lib/aws-ecr-assets';
import { Construct } from 'constructs';
import * as ecrdeploy from 'cdk-ecr-deployment';
import path = require('path');
import { Queue } from 'aws-cdk-lib/aws-sqs';
import { RemovalPolicy } from 'aws-cdk-lib';
import { generateLogGroup, setParameterStore } from './common/utils';
import { ApplicationLoadBalancedFargateService } from 'aws-cdk-lib/aws-ecs-patterns';
import { Cluster, ContainerImage, LogDriver } from 'aws-cdk-lib/aws-ecs';
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

    new ApplicationLoadBalancedFargateService(scope, id + 'OrderService', {
      cluster: ecsCluster,
      memoryLimitMiB: 1024,
      desiredCount: 1,
      cpu: 512,
      taskImageOptions: {
        image: ContainerImage.fromEcrRepository(orderImageEcr),
        logDriver: LogDriver.awsLogs({
          logGroup: orderServiceLogGroup,
          streamPrefix: 'orderService',
        }),
        taskRole: ecsTaskRole,
      },
      taskSubnets: {
        subnets: vpc.privateSubnets,
      },
      loadBalancerName: id + 'alb',
    });
  }
}
