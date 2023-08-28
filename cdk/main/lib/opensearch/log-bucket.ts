import { Construct } from 'constructs';
import { RemovalPolicy } from 'aws-cdk-lib';
import { BlockPublicAccess, Bucket, BucketAccessControl, BucketEncryption, EventType } from 'aws-cdk-lib/aws-s3';
import { Key } from 'aws-cdk-lib/aws-kms';
import { ArnPrincipal, Effect, PolicyDocument, PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { Queue } from 'aws-cdk-lib/aws-sqs';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';

export class LogBucket {
  public firehoseDestBucket: Bucket;
  public firehoseBackupBucket: Bucket;
  public IngestionFailedBudket: Bucket;
  public s3EventNoti: Queue;
  public firehoseRole: Role;
  public stsRole: Role;

  constructor(
    scope: Construct,
    id: string,
    targetProfile: string,
    targetRegion: string = '',
    account: string = '',
    osDomainName: string
  ) {
    /**
     * Create S3 bucket and corresponding policies
     */
    const s3AccessLogBucket = new Bucket(scope, id + '-accesslog-main', {
      encryption: BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const s3KmsKey = new Key(scope, id + '-s3-kms-key', {
      //alias: 's3-kms-key',
      description: 'Key used for KMS Encryption for the SRE s3 bucket',
      policy: new PolicyDocument({
        statements: [
          new PolicyStatement({
            sid: 'Enable IAM User Permissions',
            effect: Effect.ALLOW,
            principals: [new ArnPrincipal(`arn:aws:iam::${account}:root`)],
            actions: ['kms:*'],
            resources: ['*'],
          }),
        ],
      }),
      enableKeyRotation: true,
    });

    this.firehoseDestBucket = new Bucket(scope, id + '-dest-bucket', {
      removalPolicy: RemovalPolicy.DESTROY,
      versioned: true,
      accessControl: BucketAccessControl.PRIVATE,
      publicReadAccess: false,
      blockPublicAccess: new BlockPublicAccess(BlockPublicAccess.BLOCK_ALL),
      bucketKeyEnabled: true,
      encryption: BucketEncryption.KMS,
      encryptionKey: s3KmsKey,
      enforceSSL: true,
      serverAccessLogsBucket: s3AccessLogBucket,
      serverAccessLogsPrefix: `s3/${targetProfile}-applog-from-${targetRegion}/`,
      eventBridgeEnabled: true,
    });

    // allow the principal to have all admin access to bucket
    this.firehoseDestBucket.addToResourcePolicy(
      new PolicyStatement({
        sid: 'Set Admin Access',
        effect: Effect.ALLOW,
        principals: [new ArnPrincipal(`arn:aws:iam::${account}:root`)],
        actions: ['s3:*'],
        resources: [`${this.firehoseDestBucket.bucketArn}`, `${this.firehoseDestBucket.bucketArn}/*`],
      })
    );

    /**
     * Create SQS queue and add event notification to S3 with queue as destination
     */
    this.s3EventNoti = new Queue(scope, id + '-sqs-s3-event-notification');

    this.firehoseDestBucket.addEventNotification(
      EventType.OBJECT_CREATED_PUT,
      new s3n.SqsDestination(this.s3EventNoti)
    );

    //const test = this.firehoseDestBucket.node.defaultChild as Function;
    this.firehoseBackupBucket = new Bucket(scope, id + '-firehose-backup-bucket', {
      encryption: BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      serverAccessLogsPrefix: `s3/${targetProfile}-firehose-backup-bucket/`,
      serverAccessLogsBucket: s3AccessLogBucket,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    // resource policy 추가해야함
    this.IngestionFailedBudket = new Bucket(scope, id + '-data-prepper-failed', {
      encryption: BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      serverAccessLogsPrefix: 's3/data-prepper-failed/',
      serverAccessLogsBucket: s3AccessLogBucket,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    this.firehoseRole = new Role(scope, id + '-firehoseRole', {
      assumedBy: new ServicePrincipal('firehose.amazonaws.com'),
    });

    this.firehoseRole.addToPolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ['s3:PutObject', 's3:PutObjectAcl', 's3:ListBucket'],
        resources: [
          this.firehoseDestBucket.bucketArn,
          this.firehoseDestBucket.bucketArn + '/*',
          this.firehoseBackupBucket.bucketArn,
          this.firehoseBackupBucket.bucketArn + '/*',
        ],
      })
    );

    this.firehoseRole.addToPolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ['lambda:InvokeFunction', 'lambda:GetFunctionConfiguration'],
        resources: ['*'],
      })
    );
    this.firehoseRole.addToPolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ['kms:Encrypt', 'kms:Decrypt', 'kms:ReEncrypt*', 'kms:GenerateDataKey*', 'kms:DescribeKey'],
        resources: [s3KmsKey.keyArn],
      })
    );

    // Add resource policy for firehose role to access S3
    const bucketPolicy = new PolicyStatement({
      effect: Effect.ALLOW,
      actions: ['s3:PutObject'],
      resources: [this.firehoseDestBucket.bucketArn + '/*'],
      principals: [new ArnPrincipal(this.firehoseRole.roleArn)],
    });

    this.firehoseDestBucket.addToResourcePolicy(bucketPolicy);

    s3KmsKey.addToResourcePolicy(
      new PolicyStatement({
        sid: 'Enable firehose role to access kms key',
        effect: Effect.ALLOW,
        principals: [new ArnPrincipal(this.firehoseRole.roleArn)],
        actions: ['kms:Encrypt', 'kms:Decrypt', 'kms:ReEncrypt*', 'kms:GenerateDataKey*', 'kms:DescribeKey'],
        resources: ['*'],
      })
    );

    const applogS3Policy = {
      sid: 'applogS3Access',
      effect: Effect.ALLOW,
      actions: ['s3:GetObject'],
      resources: [`${this.firehoseDestBucket.bucketArn}/*`],
    };

    const failedLogS3Policy = {
      sid: 'failedS3Access',
      effect: Effect.ALLOW,
      actions: ['s3:PutObject'],
      resources: [`${this.firehoseDestBucket.bucketArn}/*`],
    };

    const sqsPolicy = {
      sid: 'sqsAccess',
      effect: Effect.ALLOW,
      actions: ['sqs:DeleteMessage', 'sqs:ReceiveMessage'],
      resources: [this.s3EventNoti.queueArn],
    };

    const kmsPolicy = {
      sid: 'kmsAccess',
      effect: Effect.ALLOW,
      actions: ['kms:Decrypt'],
      resources: [s3KmsKey.keyArn],
    };

    const esPolicy1 = {
      sid: 'esAccess',
      effect: Effect.ALLOW,
      actions: ['es:DescribeDomain'],
      resources: [`arn:aws:es:*:${account}:domain/*`],
    };

    const esPolicy2 = {
      sid: 'esAccess2',
      effect: Effect.ALLOW,
      actions: ['es:ESHttp*'],
      resources: [`arn:aws:es:*:${account}:domain/${osDomainName}/*`],
    };

    this.stsRole = new Role(scope, id + '-data-prepper-stsRole', {
      roleName: `sts2-${targetProfile}-${targetRegion}`,
      assumedBy: new ServicePrincipal('osis-pipelines.amazonaws.com'),
    });
    this.stsRole.addToPolicy(new PolicyStatement(applogS3Policy));
    this.stsRole.addToPolicy(new PolicyStatement(failedLogS3Policy));
    this.stsRole.addToPolicy(new PolicyStatement(sqsPolicy));
    this.stsRole.addToPolicy(new PolicyStatement(kmsPolicy));
    this.stsRole.addToPolicy(new PolicyStatement(esPolicy1));
    this.stsRole.addToPolicy(new PolicyStatement(esPolicy2));

    s3KmsKey.addToResourcePolicy(
      new PolicyStatement({
        sid: 'Enable data ingestion sts role to access kms key',
        effect: Effect.ALLOW,
        principals: [new ArnPrincipal(this.stsRole.roleArn)],
        actions: ['kms:Encrypt', 'kms:Decrypt', 'kms:ReEncrypt*', 'kms:GenerateDataKey*', 'kms:DescribeKey'],
        resources: ['*'],
      })
    );
  }
}
