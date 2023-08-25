import { Stack } from 'aws-cdk-lib';
import { IVpc, Vpc } from 'aws-cdk-lib/aws-ec2';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';

const PropertiesReader = require('properties-reader');

export const getConfig: Function = function (mainProfile: string) {
  return PropertiesReader(`config-${mainProfile}.properties`);
};

export const getParameterStore = (scope: any, path: string) => {
  return StringParameter.valueFromLookup(scope, path);
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
