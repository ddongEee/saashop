import { Construct } from 'constructs';
import { Function } from 'aws-cdk-lib/aws-lambda';
import { CfnDeliveryStream } from 'aws-cdk-lib/aws-kinesisfirehose';
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs';
import { RemovalPolicy } from 'aws-cdk-lib';

export class FirehoseStream {
  public firehoseStreamToS3: CfnDeliveryStream;
  constructor(
    scope: Construct,
    id: string,
    firehoseDestBucketName: string,
    firehoseDestBucketArn: string,
    firehoseBackupBucketArn: string,
    firehoseRoleArn: string,
    transformer?: Function
  ) {
    /**
     * Create firehose delivery stream
     */

    const firehoseLogGroup = new LogGroup(scope, id + '-firehose-loggroup', {
      retention: RetentionDays.THREE_DAYS,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    this.firehoseStreamToS3 = new CfnDeliveryStream(scope, id + '-FirehoseStreamToS3', {
      deliveryStreamName: firehoseDestBucketName,
      deliveryStreamType: 'DirectPut',
      extendedS3DestinationConfiguration: {
        bucketArn: firehoseDestBucketArn,
        roleArn: firehoseRoleArn,
        s3BackupMode: 'Enabled',
        s3BackupConfiguration: {
          bucketArn: firehoseBackupBucketArn,
          roleArn: firehoseRoleArn,
        },
        cloudWatchLoggingOptions: {
          enabled: true,
          logGroupName: firehoseLogGroup.logGroupName,
          logStreamName: 'firehose',
        },
        processingConfiguration:
          transformer == undefined
            ? {}
            : {
                enabled: true,
                processors: [
                  {
                    type: 'Lambda',
                    parameters: [
                      {
                        parameterName: 'LambdaArn',
                        parameterValue: transformer!.functionArn,
                      },
                      {
                        parameterName: 'BufferIntervalInSeconds',
                        parameterValue: '60',
                      },
                      {
                        parameterName: 'BufferSizeInMBs',
                        parameterValue: '0.2', // Set buffer size with minimum value. Change this to proper value.
                      },
                    ],
                  },
                ],
              },
        bufferingHints: {
          sizeInMBs: 1,
          intervalInSeconds: 60,
        },
        compressionFormat: 'UNCOMPRESSED',
      },
    });
  }
}
