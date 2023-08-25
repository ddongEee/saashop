import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { IVpc, Port, SecurityGroup, Vpc } from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

export class SecGroup {
  dataPrepperSg: SecurityGroup;
  openSearchSg: SecurityGroup;
  bastionWindowSg: SecurityGroup;

  constructor(scope: Construct, id: string, vpc: IVpc) {
    // data prepper service security group
    this.dataPrepperSg = new SecurityGroup(scope, 'data-prepper-sg', {
      vpc: vpc,
      allowAllOutbound: false,
    });

    // opensearch security group
    this.openSearchSg = new SecurityGroup(scope, 'opensearch-sg', {
      vpc: vpc,
      allowAllOutbound: false,
    });

    this.openSearchSg.addIngressRule(this.dataPrepperSg, Port.tcp(443));
    this.dataPrepperSg.addEgressRule(this.openSearchSg, Port.tcp(443));

    // window bastion instance security group for accessing opensearch
    this.bastionWindowSg = new SecurityGroup(scope, 'bastion-window-sg', {
      vpc: vpc,
      allowAllOutbound: false,
    });

    //this.bastionWindowSg.addIngressRule(ec2.Peer.ipv4('0.0.0.0/0'), Port.tcp(3389));
    this.openSearchSg.addIngressRule(this.bastionWindowSg, Port.tcp(443));
  }
}
