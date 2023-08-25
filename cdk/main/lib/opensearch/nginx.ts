import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as au from 'aws-cdk-lib/aws-autoscaling';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as path from 'path';
import { Construct, IConstruct } from 'constructs';
import { getConfig } from '../common/utils';
import { Port, SecurityGroup } from 'aws-cdk-lib/aws-ec2';
import { SSMParameterReader } from '../common/ssm-parameter-reader';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';

export class Nginx {
  constructor(
    scope: Construct,
    id: string,
    mainProfile: string,
    vpc: ec2.IVpc,
    osEndpoint: string,
    osSecurityGroup: SecurityGroup,
    proxyInstanceType: string,
    proxyInstanceNumber: number,
    elbDomain?: string // The custom domain name of the ELB. e.g. opensearch.samsungvxt.com
  ) {
    ///import env configs

    const elbDomainCertificateArn = getConfig(mainProfile).get('sre.elb.domain.certificate.arn');

    const nginxKeyPair = new ec2.CfnKeyPair(scope, id + 'nginxCfnKeyPair', {
      keyName: `nginx-proxy-${mainProfile}`,
    });
    const keyName = nginxKeyPair.keyName;

    //user data for Nginx proxy
    const ud_ec2 = ec2.UserData.forLinux();

    //create ec2 role
    const ec2Role = new iam.Role(scope, id + '-ec2-role', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
    });
    ec2Role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'));

    // Create the load balancer security group
    const lbSecurityGroup = new ec2.SecurityGroup(scope, id + 'LoadBalancerSecurityGroup', {
      vpc: vpc, // Specify your VPC reference here
      allowAllOutbound: false,
    });
    // lbSecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(443), 'Allow inbound HTTPS traffic');
    lbSecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80), 'Allow inbound HTTPS traffic');

    // Create the EC2 instance security group
    const nginxSecurityGroup = new ec2.SecurityGroup(scope, id + 'EC2SecurityGroup', {
      vpc: vpc, // Specify your VPC reference here
      allowAllOutbound: false,
    });
    lbSecurityGroup.addEgressRule(nginxSecurityGroup, ec2.Port.tcp(443), 'Allow inbound HTTPS traffic');
    nginxSecurityGroup.addIngressRule(
      lbSecurityGroup,
      ec2.Port.tcp(443),
      'Allow inbound HTTPS traffic from Load Balancer'
    );

    // Add ingress rule from nginx to opensearch
    osSecurityGroup.addIngressRule(nginxSecurityGroup, ec2.Port.tcp(443));
    nginxSecurityGroup.addEgressRule(ec2.Peer.anyIpv4(), Port.tcp(443));

    const proxyLaunchTemplate = new ec2.LaunchTemplate(scope, id + 'NginxProxyEC2LaunchTemplate', {
      instanceType: new ec2.InstanceType(proxyInstanceType),
      machineImage: new ec2.AmazonLinuxImage({
        generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2,
      }),
      userData: ud_ec2,
      role: ec2Role,
      keyName: keyName,
      securityGroup: nginxSecurityGroup,
      blockDevices: [
        {
          deviceName: '/dev/xvda',
          volume: ec2.BlockDeviceVolume.ebs(8, {
            deleteOnTermination: true,
            encrypted: true,
            volumeType: ec2.EbsDeviceVolumeType.GP2,
          }),
        },
      ],
    });

    // ASG for Nginx proxy, one per az for HA
    const nginx_asg = new au.AutoScalingGroup(scope, id + 'NginxProxyEC2', {
      vpc: vpc,
      maxCapacity: 4,
      minCapacity: 0,
      desiredCapacity: proxyInstanceNumber,
      signals: au.Signals.waitForMinCapacity(),
      launchTemplate: proxyLaunchTemplate,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        onePerAz: true,
      },
      healthCheck: au.HealthCheck.elb({
        grace: cdk.Duration.millis(0),
      }),
    });

    // ACM certifacates
    const cert = acm.Certificate.fromCertificateArn(scope, id + 'Certificate', elbDomainCertificateArn);

    // Create the load balancer in a VPC
    const lb = new elbv2.ApplicationLoadBalancer(scope, id + 'Load Balancer', {
      vpc: vpc,
      internetFacing: true,
      securityGroup: lbSecurityGroup,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
    });

    // const listener = lb.addListener(id + 'Listener', {
    //   port: 443,
    //   // 'open: true' is the default, you can leave it out if you want. Set it
    //   // to 'false' and use `listener.connections` if you want to be selective
    //   // about who can access the load balancer.
    //   certificates: [cert],
    //   open: true,
    //   sslPolicy: elbv2.SslPolicy.TLS12,
    // });

    const listener = lb.addListener(id + 'Listener', {
      port: 80,
      // 'open: true' is the default, you can leave it out if you want. Set it
      // to 'false' and use `listener.connections` if you want to be selective
      // about who can access the load balancer.
      open: true,
    });

    //listener target group && health check
    listener.addTargets(id + 'ApplicationFleet', {
      port: 443,
      healthCheck: {
        enabled: true,
        path: '/',
        port: '443',
        protocol: elbv2.Protocol.HTTPS,
        healthyHttpCodes: '302',
      },
      targets: [nginx_asg],
    });

    const engineURL = '_dashboards';
    const customEndpointValue = elbDomain ? elbDomain : lb.loadBalancerDnsName;

    nginx_asg.applyCloudFormationInit(
      ec2.CloudFormationInit.fromElements(
        ec2.InitFile.fromFileInline('/etc/nginx/conf.d/default.conf', path.join(__dirname, './config/default.conf')),
        ec2.InitFile.fromFileInline('/etc/nginx/openssl.cnf', path.join(__dirname, './config/openssl.cnf')),
        ec2.InitFile.fromFileInline('/etc/init.d/nginx', path.join(__dirname, './config/nginx'))
      )
    );
    //proxy user data
    ud_ec2.addCommands(
      `amazon-linux-extras install nginx1`,
      `openssl genrsa -out /etc/nginx/cert.key 2048`,
      `openssl req -config /etc/nginx/openssl.cnf -new -key /etc/nginx/cert.key -out /etc/nginx/cert.csr`,
      `openssl x509 -req -days 2048 -in /etc/nginx/cert.csr -signkey /etc/nginx/cert.key -out /etc/nginx/cert.crt`,
      'mac_address=`curl -H "X-aws-ec2-metadata-token: $TOKEN" -v http://169.254.169.254/latest/meta-data/mac`',
      'cider_block=`curl -H "X-aws-ec2-metadata-token: $TOKEN" -v http://169.254.169.254/latest/meta-data/network/interfaces/macs/$mac_address/vpc-ipv4-cidr-block`',
      'cider_ip=`echo ${cider_block%/*}`',
      'front_three=`echo ${cider_ip%.*}`',
      'last_value=`echo ${cider_ip##*.}`',
      'value_add_two=`expr $last_value + 2`',
      'dns_address=$front_three.$value_add_two',
      `sed -i 's/$DNS_ADDRESS/'$dns_address'/' /etc/nginx/conf.d/default.conf`,
      `sed -i 's/$ES_endpoint/${osEndpoint}/' /etc/nginx/conf.d/default.conf`,
      `sed -i 's/$SERVER_NAME/${customEndpointValue}/' /etc/nginx/conf.d/default.conf`,
      `sed -i 's/$ENGINE_URL/${engineURL}/' /etc/nginx/conf.d/default.conf`,
      `sed -i 's#/bin.*#service nginx reload >/dev/null 2>\&1#' /etc/logrotate.d/nginx`,
      `chmod a+x /etc/init.d/nginx`,
      `chkconfig --add /etc/init.d/nginx`,
      `chkconfig nginx on`,
      `/etc/init.d/nginx start`
    );

    const ec2LaunchTemplateNetworkInterfaceSetting = [
      {
        DeviceIndex: 0,
        AssociatePublicIpAddress: 'false',
        Groups: [nginxSecurityGroup.securityGroupId],
      },
    ];

    new cdk.CfnOutput(scope, id + 'ALB CNAME', {
      value: `${lb.loadBalancerDnsName}`,
      description: 'CNAME for ALB',
    });
  }
}

class InjectEC2LaunchTemplateNetWorkInterfaceSetting implements cdk.IAspect {
  public constructor(private ec2LaunchTemplateNetworkInterfaceSetting: any) {}

  public visit(node: IConstruct): void {
    if (node instanceof cdk.CfnResource && node.cfnResourceType === 'AWS::EC2::LaunchTemplate') {
      node.addOverride(
        'Properties.LaunchTemplateData.NetworkInterfaces',
        this.ec2LaunchTemplateNetworkInterfaceSetting
      );
      node.addDeletionOverride('Properties.LaunchTemplateData.SecurityGroupIds');
    }
  }
}
