import { RemovalPolicy, Stack } from 'aws-cdk-lib';
import { IVpc, Vpc } from 'aws-cdk-lib/aws-ec2';
import { FilterPattern, LogGroup, LogRetention, RetentionDays, SubscriptionFilter } from 'aws-cdk-lib/aws-logs';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';
import * as destinations from 'aws-cdk-lib/aws-logs-destinations';
import { Stream } from 'aws-cdk-lib/aws-kinesis';

const PropertiesReader = require('properties-reader');

export const getConfig: Function = function (mainProfile: string) {
  return PropertiesReader(`config-${mainProfile}.properties`);
};

export const getParameterStore = (scope: any, name: string) => {
  return StringParameter.valueFromLookup(scope, name);
};

export const setParameterStore = (scope: any, id: string, name: string, value: string) => {
  return new StringParameter(scope, id + '-ssm', {
    parameterName: name,
    stringValue: value,
  });
};

export function getOpensearchVpc(scope: Stack, id: string): IVpc {
  const vpc = Vpc.fromLookup(scope, 'ImportVPC-' + id, {
    isDefault: false,
    tags: {
      'opensearch-vpc': 'true',
    },
    subnetGroupNameTag: 'Private subnet',
  });

  return vpc;
}

export const generateLogGroup = (
  scope: any,
  id: string,
  platform: 'lambda' | 'ecs',
  logDestinationArn?: any,
  lambdaFunctionName?: string,
  retention: RetentionDays = RetentionDays.THREE_MONTHS
): LogGroup => {
  const logGroup =
    platform === 'ecs'
      ? new LogGroup(scope, id, {
          retention: retention,
          removalPolicy: RemovalPolicy.DESTROY,
        })
      : new LogGroup(scope, id, {
          logGroupName: '/aws/lambda/' + lambdaFunctionName,
          retention: retention,
          removalPolicy: RemovalPolicy.DESTROY,
        });

  if (logDestinationArn) {
    const logStream = Stream.fromStreamArn(scope, id + 'KinesisStream', logDestinationArn);
    new SubscriptionFilter(scope, id + '-SubscriptionFilter', {
      logGroup: logGroup,
      filterName: `${platform}-cw-to-firehose-cross-account`,
      filterPattern: FilterPattern.allEvents(),
      destination: new destinations.KinesisDestination(logStream),
    });
  }
  return logGroup;
};
