import * as cdk from 'aws-cdk-lib';
import * as opensearch from 'aws-cdk-lib/aws-opensearchservice';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as domainParameters from './config/opensearch-domain-parameter.json';
import { BlockDeviceVolume, ISubnet, IVpc, SecurityGroup, Subnet, SubnetType } from 'aws-cdk-lib/aws-ec2';
import { EbsDeviceVolumeType } from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';
import { SecGroup } from './sg';
import { AnyPrincipal, Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Nginx } from './nginx';
import { CfnOutput, Tags } from 'aws-cdk-lib';
import { Vpc } from 'aws-cdk-lib/aws-ec2';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';
import { setParameterStore } from '../common/utils';
import { LogBucket } from './log-bucket';
import { DataIngestion } from './data-ingestion';

export interface osStackProps extends cdk.StackProps {
  mainProfile: string;
  nginxProxyInstanceType: 't3.nano' | 't3.micro' | 't3.small' | 't3.large';
  nginxProxyInstanceNubmer: 1 | 2 | 3 | 4;
  elbDomain?: string;
}
export class OpenSearchStack extends cdk.Stack {
  public osDomainName: string;
  public osSecurityGroupId: string;
  public osDomainEndpoint: string;
  public vpc: Vpc;
  public vpcParameterStore: StringParameter;

  constructor(
    scope: Construct,
    id: string,
    props: osStackProps,
    mainProfile: string,
    mainRegion: string,
    targetProfile: string,
    targetRegion: string
  ) {
    super(scope, id, props);

    const domainName = 'techsummit';

    const domainProps = this.makeDomainProps(domainName);
    const osDomain = new opensearch.Domain(this, id + '-domain', domainProps);
    osDomain.addAccessPolicies(
      new PolicyStatement({
        actions: ['es:ESHttp*'],
        effect: Effect.ALLOW,
        resources: [osDomain.domainArn, `${osDomain.domainArn}/*`],
        principals: [new AnyPrincipal()],
      })
    );

    this.osDomainEndpoint = osDomain.domainEndpoint;
    this.osDomainName = osDomain.domainName;

    /**
     * S3 bucket construct
     * Four S3 buckets will be created
     * 1. firehose destination bucket
     * 2. firehose destination backup bucket
     * 3. data ingestion pipeline failed bucket
     * 4. access log bucket for security governance
     */
    const buckets = new LogBucket(
      this,
      id + '-bucket',
      targetProfile,
      targetRegion,
      props.env?.account,
      this.osDomainName
    );

    /**
     * Opensearch data ingestion pipeline construct
     */
    new DataIngestion(
      this,
      id + '-ingestion',
      targetProfile,
      targetRegion,
      mainRegion,
      this.osDomainEndpoint,
      buckets.IngestionFailedBudket.bucketName,
      buckets.s3EventNoti.queueUrl,
      buckets.stsRole
    );

    setParameterStore(
      this,
      id + '-set-1',
      `/Firehose/${targetRegion}/DestBucketName`,
      buckets.firehoseDestBucket.bucketName
    );
    setParameterStore(
      this,
      id + '-set-2',
      `/Firehose/${targetRegion}/DestBucketArn`,
      buckets.firehoseDestBucket.bucketArn
    );
    setParameterStore(
      this,
      id + '-set-3',
      `/Firehose/${targetRegion}/BackupBucketArn`,
      buckets.firehoseBackupBucket.bucketArn
    );
    setParameterStore(this, id + '-set-4', `/Firehose/${targetRegion}/RoleArn`, buckets.firehoseRole.roleArn);
    new CfnOutput(this, id + 'osEndpoint', {
      value: this.osDomainEndpoint,
    });
  }

  // OpenSearch inside vpc
  private makeDomainProps = (domainName: string) => {
    const commonProps: opensearch.DomainProps = {
      domainName: domainName,
      version: opensearch.EngineVersion.OPENSEARCH_2_7,
      zoneAwareness: {
        availabilityZoneCount: domainParameters.Capacity.AvailableZones,
      },
      capacity: {
        masterNodes: domainParameters.Capacity.MasterNode.Count,
        masterNodeInstanceType: domainParameters.Capacity.MasterNode.Type,
        dataNodes: domainParameters.Capacity.DataNode.Count,
        dataNodeInstanceType: domainParameters.Capacity.DataNode.Type,
        warmNodes: domainParameters.Capacity.WarmNode.Count,
        warmInstanceType: domainParameters.Capacity.WarmNode.Type,
      },
      ebs: {
        enabled: true,
        volumeSize: domainParameters.Capacity.EbsVoluemSize,
        volumeType: EbsDeviceVolumeType.GENERAL_PURPOSE_SSD_GP3,
      },
      fineGrainedAccessControl: {
        masterUserName: domainParameters.Security.MasterUserName,
      },
      enforceHttps: true,
      nodeToNodeEncryption: true,
      encryptionAtRest: {
        enabled: true,
      },
    };

    // (optional) Make vpc properties
    let vpcProps = {};
    if (domainParameters.Network.VpcEnabled) {
      const iVpc = Vpc.fromLookup(this, 'VPC', {
        vpcId: domainParameters.Network.VpcId,
      });

      const iSecurityGroup = SecurityGroup.fromSecurityGroupId(this, 'SG', domainParameters.Network.SecurityGroupId);

      let iSubnets: ISubnet[] = [];
      for (let i = 0; i < domainParameters.Capacity.AvailableZones; i++) {
        iSubnets.push(
          Subnet.fromSubnetAttributes(this, `Subnet-${i}`, {
            subnetId: domainParameters.Network.Subnets[i].Id,
            availabilityZone: domainParameters.Network.Subnets[i].Az,
          })
        );
      }

      vpcProps = {
        vpc: iVpc,
        vpcSubnets: [{ subnets: iSubnets }],
        securityGroups: [iSecurityGroup],
      };
    }

    return { ...commonProps, ...vpcProps };
  };
}
