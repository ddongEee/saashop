import { aws_osis as osis, CfnOutput, RemovalPolicy, Stack } from 'aws-cdk-lib';
import { parse, stringify } from 'yaml';
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs';
import * as fs from 'fs';
import { getConfig, getOpensearchVpc } from '../common/utils';
import { IVpc, SubnetType, Vpc } from 'aws-cdk-lib/aws-ec2';
import { Role } from 'aws-cdk-lib/aws-iam';

export class DataIngestion {
  constructor(
    scope: Stack,
    id: string,
    targetProfile: string,
    targetRegion: string,
    mainRegion: string,
    osEndpoint: string,
    dlqFailedBucketName: string,
    eventQueueUrl: string,
    stsRole: Role
  ) {
    /**
     * Create opensearch data ingestion pipeline
     */

    const eventQueueVisibilityTimeout = '300s'; // This value is set based on the load test result

    // const subnetIds = vpc.selectSubnets({ subnetType: SubnetType.PRIVATE_WITH_EGRESS, onePerAz: true }).subnetIds;
    // yaml 데이터를 자바스크립트 객체로 바로 변환한다.
    const configTemplate = parse(fs.readFileSync(__dirname + '/config/pipelinesTemplate.yaml', 'utf8'));
    configTemplate['s3-log-pipeline'].source.s3.sqs.queue_url = eventQueueUrl;
    configTemplate['s3-log-pipeline'].source.s3.sqs.visibility_timeout = eventQueueVisibilityTimeout;
    configTemplate['s3-log-pipeline'].source.s3.aws.region = mainRegion;
    configTemplate['s3-log-pipeline'].source.s3.aws.sts_role_arn = stsRole.roleArn;
    configTemplate['s3-log-pipeline'].sink[0].opensearch.hosts[0] = 'https://' + osEndpoint;
    configTemplate['s3-log-pipeline'].sink[0].opensearch.aws.sts_role_arn = stsRole.roleArn;
    configTemplate['s3-log-pipeline'].sink[0].opensearch.aws.region = mainRegion;
    configTemplate['s3-log-pipeline'].sink[0].opensearch.dlq.s3.bucket = dlqFailedBucketName;
    configTemplate['s3-log-pipeline'].sink[0].opensearch.dlq.s3.region = mainRegion;
    configTemplate['s3-log-pipeline'].sink[0].opensearch.dlq.s3.sts_role_arn = stsRole.roleArn;
    configTemplate['s3-log-pipeline'].sink[0].opensearch.index = `${targetProfile}-applog-%{yyyy.MM.dd}`;

    const pipelineConfigurationBody = stringify(configTemplate);

    const ingestionLogGroup = new LogGroup(scope, id + '-ingestion-pipeline-loggroup', {
      logGroupName: `/aws/vendedlogs/OpenSearchIngestion/applogs-${targetProfile}-${targetRegion}`,
      retention: RetentionDays.THREE_DAYS,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const ingestionPipeline = new osis.CfnPipeline(scope, id + `-pipeline`, {
      maxUnits: 4,
      minUnits: 1, // should be large enough value to tolerate large amount of log data in short time
      pipelineConfigurationBody: pipelineConfigurationBody,
      pipelineName: `applogs-${targetProfile}-${targetRegion}`,
      logPublishingOptions: {
        cloudWatchLogDestination: {
          logGroup: ingestionLogGroup.logGroupName,
        },
        isLoggingEnabled: true,
      },
      // vpcOptions: {
      //   securityGroupIds: [dataPrepperSgId],
      //   subnetIds: subnetIds,
      // },
    });
    ingestionPipeline.node.addDependency(stsRole);

    new CfnOutput(scope, id + '-export-sts-role', {
      value: stsRole.roleArn,
      description: 'The role arn of the stream, this should be registered as backend-role in Open Search',
      exportName: `sts-role-${targetProfile}-${targetRegion}`,
    });
  }
}
