import { CfnOutput, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Transformer } from './transformer';
import { FirehoseStream } from './firehose-stream';
import { Destination } from './destination';
import { getConfig, getOpensearchVpc } from '../common/utils';
import { Vpc } from 'aws-cdk-lib/aws-ec2';
import { SSMParameterReader } from '../common/ssm-parameter-reader';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';

export class PipelineStack extends Stack {
  constructor(
    scope: Construct,
    id: string,
    props: StackProps,
    mainProfile: string,
    targetProfile: string,
    mainRegion: string,
    targetAccount: string
  ) {
    super(scope, id, props);
    const targetRegion = props.env?.region + '';
    const mainAccount = props.env?.account + '';

    const transformer = new Transformer(this, id + '-transformer');

    const firehoseDestBucketName = new SSMParameterReader(this, id + '-get-1', {
      parameterName: `/Firehose/${targetRegion}/DestBucketName`,
      region: mainRegion,
    }).getParameterValue();

    const firehoseDestBucketArn = new SSMParameterReader(this, id + '-get-2', {
      parameterName: `/Firehose/${targetRegion}/DestBucketArn`,
      region: mainRegion,
    }).getParameterValue();

    const firehoseBackupBucketArn = new SSMParameterReader(this, id + '-get-3', {
      parameterName: `/Firehose/${targetRegion}/BackupBucketArn`,
      region: mainRegion,
    }).getParameterValue();

    const firehoseRoleArn = new SSMParameterReader(this, id + '-get-4', {
      parameterName: `/Firehose/${targetRegion}/RoleArn`,
      region: mainRegion,
    }).getParameterValue();

    const firehoseStream = new FirehoseStream(
      this,
      id + '-kinesis',
      firehoseDestBucketName,
      firehoseDestBucketArn,
      firehoseBackupBucketArn,
      firehoseRoleArn,
      transformer.transformerLambda
    );

    new Destination(
      this,
      id + '-destination',
      targetProfile,
      mainAccount,
      targetAccount,
      targetRegion,
      firehoseStream.firehoseStreamToS3.attrArn
    );
  }
}
