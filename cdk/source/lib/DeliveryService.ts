import { Repository } from 'aws-cdk-lib/aws-ecr';
import { DockerImageAsset } from 'aws-cdk-lib/aws-ecr-assets';
import {
  Cluster,
  Compatibility,
  ContainerDefinition,
  ContainerImage,
  FargateService,
  FargateTaskDefinition,
  LogDriver,
  Protocol,
  TaskDefinition,
} from 'aws-cdk-lib/aws-ecs';
import { Role } from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import * as ecrdeploy from 'cdk-ecr-deployment';
import path = require('path');
import { generateLogGroup } from './common/utils';

export class DeliveryService {
  constructor(scope: Construct, id: string, ecsCluster: Cluster, ecsTaskRole: Role, logDestinationArn: string) {
    const deliveryImage = new DockerImageAsset(scope, id + 'DeliveryImage', {
      directory: path.join(__dirname, '../../../services/delivery/'),
    });

    const deliveryImageEcr = new Repository(scope, id + 'DeliveryImageEcr');

    new ecrdeploy.ECRDeployment(scope, id + 'DeployDeliveryDockerImage', {
      src: new ecrdeploy.DockerImageName(deliveryImage.imageUri),
      dest: new ecrdeploy.DockerImageName(deliveryImageEcr.repositoryUri),
    });

    const deliveryLogGroup = generateLogGroup(scope, id + 'DeliveryServiceLogGroup', 'ecs', logDestinationArn);

    const deliveryTaskDefinition = new FargateTaskDefinition(scope, id + 'DeliveryTaskDefinition', {
      taskRole: ecsTaskRole,
      cpu: 4096,
      memoryLimitMiB: 8192,
    });

    const appContainer = new ContainerDefinition(scope, id + 'DeliveryAppContainer', {
      image: ContainerImage.fromEcrRepository(deliveryImageEcr),
      taskDefinition: deliveryTaskDefinition,
      logging: LogDriver.awsLogs({
        logGroup: deliveryLogGroup,
        streamPrefix: 'deliveryService',
      }),
    });

    appContainer.addPortMappings({
      hostPort: 80,
      containerPort: 80,
    });

    const xrayContainer = new ContainerDefinition(scope, id + 'XrayContainer2', {
      containerName: 'xray-daemon',
      image: ContainerImage.fromRegistry('amazon/aws-xray-daemon'),
      taskDefinition: deliveryTaskDefinition,
      logging: LogDriver.awsLogs({
        logGroup: deliveryLogGroup,
        streamPrefix: 'xray',
      }),
      cpu: 31,
      memoryLimitMiB: 256,
    });

    xrayContainer.addPortMappings({
      protocol: Protocol.UDP,
      hostPort: 2000,
      containerPort: 2000,
    });

    new FargateService(scope, id + 'DeliveryService', {
      taskDefinition: deliveryTaskDefinition,
      cluster: ecsCluster,
    });
  }
}
