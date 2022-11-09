import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as path from "path";
import { DockerImageAsset } from 'aws-cdk-lib/aws-ecr-assets';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as ecrDeploy from 'cdk-ecr-deployment';

export class CdkMlIotStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    
    const repo = new ecr.Repository(this, 'IoTRepository', {
      repositoryName: 'iot_repository',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      imageTagMutability: ecr.TagMutability.IMMUTABLE
    });

    const asset = new DockerImageAsset(this, 'BuildImage', {
      directory: path.join(__dirname, '../../src/ml-container'),
    })
    
    new ecrDeploy.ECRDeployment(this, 'DeployDockerImage', {
      src: new ecrDeploy.DockerImageName(asset.imageUri),
      dest: new ecrDeploy.DockerImageName(`${repo.repositoryUri}:latest`),
    }); 

    repo.addLifecycleRule({ tagPrefixList: ['dev'], maxImageCount: 9999 });
    repo.addLifecycleRule({ maxImageAge: cdk.Duration.days(30) });

    new cdk.CfnOutput(this, 'imageUri', {
      value: asset.imageUri,
      description: 'The image uri',
    });
  }
}
