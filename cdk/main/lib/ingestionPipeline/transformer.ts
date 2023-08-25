import { Construct } from 'constructs';
import { Effect, ManagedPolicy, PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { Code, Runtime, Function } from 'aws-cdk-lib/aws-lambda';
import { Duration } from 'aws-cdk-lib';

export class Transformer {
  public transformerLambda: Function;
  constructor(scope: Construct, id: string) {
    /**
     * Create firehose transformer lambda
     */

    const transformerLambdaRole = new Role(scope, id + '-transformer-lambda-role', {
      assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        new ManagedPolicy(scope, 'policy_' + 'transformer-lambda-role', {
          statements: [
            new PolicyStatement({
              effect: Effect.ALLOW,
              actions: ['firehose:*', 'logs:*', 'ec2:*'],
              resources: ['*'],
            }),
          ],
        }),
      ],
    });

    this.transformerLambda = new Function(scope, id + '-firehose-transformer', {
      runtime: Runtime.NODEJS_18_X,
      handler: 'firehoseTransformer.handler',
      code: Code.fromAsset('lambda'),
      role: transformerLambdaRole,
      timeout: Duration.minutes(10),
    });
  }
}
