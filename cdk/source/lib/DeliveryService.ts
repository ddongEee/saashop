import { Repository } from 'aws-cdk-lib/aws-ecr';
import { DockerImageAsset } from 'aws-cdk-lib/aws-ecr-assets';
import { Cluster, Compatibility, FargateService, TaskDefinition } from 'aws-cdk-lib/aws-ecs';
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

    generateLogGroup(scope, id + 'DeliveryServiceLogGroup', 'ecs', logDestinationArn);

    const deliveryTaskDefinition = new TaskDefinition(scope, id + 'DeliveryTaskDefinition', {
      compatibility: Compatibility.FARGATE,
      taskRole: ecsTaskRole,
    });
    new FargateService(scope, id + 'DeliveryService', {
      taskDefinition: deliveryTaskDefinition,
      cluster: ecsCluster,
    });
  }
}
