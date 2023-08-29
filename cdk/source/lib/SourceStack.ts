import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { getConfig } from './common/utils';
import { CommonInfra } from './CommonInfra';
import { OrderService } from './OrderService';
import { PaymentService } from './PaymentService';
import { DeliveryService } from './DeliveryService';

export class SourceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: cdk.StackProps, profile: string) {
    super(scope, id, props);

    const mainLogDestinationArn = getConfig(profile).get('common.mainLogDestination.arn');

    const commonInfra = new CommonInfra(this, id);
    const orderService = new OrderService(
      this,
      id,
      commonInfra.vpc,
      commonInfra.ecsCluster,
      commonInfra.ecsTaskRole,
      mainLogDestinationArn
    );
    const paymentService = new PaymentService(
      this,
      id,
      orderService.orderedQueue,
      commonInfra.ddbTable,
      mainLogDestinationArn
    );

    const deliveryService = new DeliveryService(
      this,
      id,
      commonInfra.ecsCluster,
      commonInfra.ecsTaskRole,
      mainLogDestinationArn
    );
  }
}
