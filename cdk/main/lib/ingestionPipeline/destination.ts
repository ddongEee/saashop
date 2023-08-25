import { Construct } from 'constructs';
import { aws_iam as iam, CfnOutput } from 'aws-cdk-lib';
import { aws_logs as logs } from 'aws-cdk-lib';
import accessPolicyJson from './AccessPolicy.json';
export class Destination {
  constructor(
    scope: Construct,
    id: string,
    targetProfile: string,
    mainAccount: string,
    targetAccount: string,
    region: string,
    targetArn: string
  ) {
    const role = new iam.Role(scope, id + '-role', {
      assumedBy: new iam.ServicePrincipal('logs.amazonaws.com', {
        conditions: {
          StringLike: {
            'aws:SourceArn': [`arn:aws:logs:${region}:${targetAccount}:*`, `arn:aws:logs:${region}:${mainAccount}:*`],
          },
        },
      }),
      inlinePolicies: {
        ['Permissions-Policy-For-CWL']: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              actions: ['firehose:PutRecord'],
              resources: [targetArn],
              effect: iam.Effect.ALLOW,
            }),
          ],
        }),
      },
    });

    const destinationName = `sreDestination-${targetProfile}`;
    const destinationArn = `arn:aws:logs:${region}:${mainAccount}:destination:${destinationName}`;
    const destinationPolicy = JSON.stringify(accessPolicyJson)
      .replace('REPLACED_BY_TARGET_ACCOUNT', targetAccount)
      .replace('REPLACED_BY_DESTINATION_ARN', destinationArn);

    const cfnDestination = new logs.CfnDestination(scope, id + '-Destination', {
      destinationName: destinationName,
      roleArn: role.roleArn,
      targetArn: targetArn,
      destinationPolicy: destinationPolicy,
    });
    cfnDestination.node.addDependency(role);

    new CfnOutput(scope, id + '-export-destination', {
      value: cfnDestination.attrArn,
      description: 'The destination arn of the stream',
      exportName: `destination-${targetProfile}-${region}`,
    });
  }
}
