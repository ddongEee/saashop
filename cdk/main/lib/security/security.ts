import { Stack, StackProps } from 'aws-cdk-lib';
import { SecurityGroup } from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';
import { Aspects, aws_iam as iam, Tags } from 'aws-cdk-lib';
import { LambdaVPCAspect } from '../common/lambda-vpc-aspect';
import { Vpc } from 'aws-cdk-lib/aws-ec2';
import { SSMParameterReader } from '../common/ssm-parameter-reader';

export class SecurityStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps, targetStack: Stack, sreProfile: string) {
    super(scope, id, props);

    this.addDependency(targetStack);

    const mainRegion = props.env?.region + '';
    const vpc = Vpc.fromLookup(this, 'opensearchVpc', { tags: { ['Name']: 'opensearchVpc' } });

    const customSG = new SecurityGroup(this, id + 'custom-sg', {
      vpc: vpc,
      allowAllOutbound: false,
    });
    Aspects.of(targetStack).add(new LambdaVPCAspect(vpc, customSG));
  }
}
