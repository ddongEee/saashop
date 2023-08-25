#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { OpenSearchStack, osStackProps } from '../lib/opensearch/opensearch-stack';
import { PipelineStack } from '../lib/ingestionPipeline/pipeline-stack';
import { getConfig } from '../lib/common/utils';
const app = new cdk.App();

const mainProfile = app.node.tryGetContext('main');
const mainAccount = getConfig(mainProfile).get('main.account').toString();
const mainRegion = getConfig(mainProfile).get('main.region');

const targetProfile = app.node.tryGetContext('target');
const targetAccount = getConfig(mainProfile).get(`${targetProfile}.account`).toString();
const targetRegion = getConfig(mainProfile).get(`${targetProfile}.region`);

const mainEnv = {
  account: mainAccount,
  region: mainRegion,
};

const osProps: osStackProps = {
  env: mainEnv,
  mainProfile: mainProfile,
  nginxProxyInstanceType: 't3.large',
  nginxProxyInstanceNubmer: 2,
  // elbDomain: 'opensearch.example.com' // The custom domain name of the ELB. e.g. opensearch.example.com
};

const openSearchStack = new OpenSearchStack(
  app,
  'OpenSearchStack',
  osProps,
  mainProfile,
  mainRegion,
  targetProfile,
  targetRegion
);

const pipelineStack = new PipelineStack(
  app,
  `PipelineStack-${targetProfile}`,
  { env: { account: mainAccount, region: targetRegion } },
  mainProfile,
  targetProfile,
  mainRegion,
  targetAccount
);

pipelineStack.addDependency(openSearchStack);
