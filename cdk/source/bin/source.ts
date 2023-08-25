#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { SourceStack } from '../lib/SourceStack';

const app = new cdk.App();
const profile = 'src';
new SourceStack(
  app,
  'SourceStack',
  {
    env: { account: '496772517886', region: 'ap-southeast-1' },
  },
  profile
);
