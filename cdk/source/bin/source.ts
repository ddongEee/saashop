import * as cdk from 'aws-cdk-lib';
import { SourceStack } from '../lib/SourceStack';

const app = new cdk.App();
const profile = 'src';
const srcAccountId = app.node.tryGetContext('srcAccountId');
const srcRegion = app.node.tryGetContext('srcRegion');

const srcProfile = { account: srcAccountId, region: srcRegion };

new SourceStack(
  app,
  'SourceStack',
  {
    env: srcProfile,
  },
  profile
);
