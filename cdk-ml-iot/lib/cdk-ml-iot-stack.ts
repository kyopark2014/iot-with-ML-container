import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as path from "path";
import { DockerImageAsset } from 'aws-cdk-lib/aws-ecr-assets';
import * as greengrassv2 from 'aws-cdk-lib/aws-greengrassv2';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3Deploy from "aws-cdk-lib/aws-s3-deployment"

export class CdkMlIotStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    
    const deviceName = 'GreengrassCore-18163f7ac3e'
    const accountId = cdk.Stack.of(this).account

    // S3 for artifact storage
    const s3Bucket = new s3.Bucket(this, "gg-depolyment-storage",{
      bucketName: "gg-depolyment-storage",
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      publicReadAccess: false,
      versioned: false,
    });
    new cdk.CfnOutput(this, 'bucketName', {
      value: s3Bucket.bucketName,
      description: 'The nmae of bucket',
    });
    new cdk.CfnOutput(this, 's3Arn', {
      value: s3Bucket.bucketArn,
      description: 'The arn of s3',
    });
    new cdk.CfnOutput(this, 's3Path', {
      value: 's3://'+s3Bucket.bucketName,
      description: 'The path of s3',
    });    

    // copy web application files into s3 bucket
    new s3Deploy.BucketDeployment(this, "UploadArtifact", {
      sources: [s3Deploy.Source.asset("../src")],
      destinationBucket: s3Bucket,
    });

    // create container component - com.ml.xgboost
    const version_xgboost = "1.0.0"
    new containerComponent(scope, "container-component", version_xgboost)   

    // create local component
    const version_consumer = "1.0.0"
    new localComponent(scope, "local-component", version_consumer, s3Bucket.bucketName)  

    // deploy components
    new componentDeployment(scope, "deployments", version_consumer, version_xgboost, accountId, deviceName)   
  }
}

export class localComponent extends cdk.Stack {
  constructor(scope: Construct, id: string, version: string, bucketName: string, props?: cdk.StackProps) {    
    super(scope, id, props);

    // recipe of component - com.ml.consumer
    const recipe_consumer = `{
      "RecipeFormatVersion": "2020-01-25",
      "ComponentName": "com.ml.consumer",
      "ComponentVersion": "${version}",
      "ComponentDescription": "A component that consumes the API.",
      "ComponentPublisher": "Amazon",
      "ComponentConfiguration": {
        "DefaultConfiguration": {
          "accessControl": {
            "aws.greengrass.ipc.pubsub": {
              "com.ml.consumer:pubsub:1": {
                "policyDescription": "Allows access to publish to all topics.",
                "operations": [
                  "aws.greengrass#PublishToTopic"
                ],
                "resources": [
                  "*"
                ]
              }
            }
          }
        }
      },
      "Manifests": [{
        "Platform": {
          "os": "linux"
        },
        "Lifecycle": {
          "Install": "pip3 install awsiotsdk pandas",
          "Run": "python3 -u {artifacts:path}/consumer.py"
        },
        "Artifacts": [
          {
            "URI": "${'s3://'+bucketName}/consumer/artifacts/com.ml.consumer/1.0.0/consumer.py"
          },
          {
            "URI": "${'s3://'+bucketName}/consumer/artifacts/com.ml.consumer/1.0.0/samples.json"
          }
        ]
      }]
    }`

    // recipe of component - com.ml.consumer
    new greengrassv2.CfnComponentVersion(this, 'MyCfnComponentVersion-Consumer', {
      inlineRecipe: recipe_consumer,
    });        
  }
}


export class containerComponent extends cdk.Stack {
  constructor(scope: Construct, id: string, version: string, props?: cdk.StackProps) {    
    super(scope, id, props);

    const asset = new DockerImageAsset(this, 'BuildImage', {
      directory: path.join(__dirname, '../../src/ml-container'),
    })

    const imageUri = asset.imageUri
    new cdk.CfnOutput(this, 'ImageUri', {
      value: imageUri,
      description: 'Image Uri',
    }); 

    // recipe of component - com.ml.xgboost
    const recipe = `{
      "RecipeFormatVersion": "2020-01-25",
      "ComponentName": "com.ml.xgboost",
      "ComponentVersion": "${version}",
      "ComponentDescription": "A component that runs a ML docker container from ECR.",
      "ComponentPublisher": "Amazon",
      "ComponentDependencies": {
        "aws.greengrass.DockerApplicationManager": {
          "VersionRequirement": "~2.0.0"
        },
        "aws.greengrass.TokenExchangeService": {
          "VersionRequirement": "~2.0.0"
        }
      },
      "ComponentConfiguration": {
        "DefaultConfiguration": {
          "accessControl": {
            "aws.greengrass.ipc.pubsub": {
              "com.ml.xgboost:pubsub:1": {
                "policyDescription": "Allows access to subscribe to all topics.",
                "operations": [
                  "aws.greengrass#SubscribeToTopic"
                ],
                "resources": [
                  "*"
                ]
              }
            }
          }
        }
      },
      "Manifests": [
        {
          "Platform": {
            "os": "all"
          },
          "Lifecycle": {           
            "Run":"docker run --rm -v /greengrass/v2/ipc.socket:/greengrass/v2/ipc.socket -e AWS_CONTAINER_AUTHORIZATION_TOKEN=$AWS_CONTAINER_AUTHORIZATION_TOKEN -e SVCUID=$SVCUID -e AWS_GG_NUCLEUS_DOMAIN_SOCKET_FILEPATH_FOR_COMPONENT=/greengrass/v2/ipc.socket -e AWS_CONTAINER_CREDENTIALS_FULL_URI=$AWS_CONTAINER_CREDENTIALS_FULL_URI ${imageUri} --network=host"
          },
          "Artifacts": [
            {
              "URI": "docker:${imageUri}"
            }
          ]
        }
      ]
    }`

    const cfnComponentVersion = new greengrassv2.CfnComponentVersion(this, 'MyCfnComponentVersion_Container', {
      inlineRecipe: recipe,
    }); 
  }
}

export class componentDeployment extends cdk.Stack {
  constructor(scope: Construct, id: string, version_consumer: string, version_xgboost: string, accountId: string, deviceName: string, props?: cdk.StackProps) {    
    super(scope, id, props);

    // deployments
    const cfnDeployment = new greengrassv2.CfnDeployment(this, 'MyCfnDeployment', {
      targetArn: `arn:aws:iot:ap-northeast-2:`+accountId+`:thing/`+deviceName,    
      components: {
        "com.ml.consumer": {
          componentVersion: version_consumer, 
        }, 
        "com.ml.xgboost": {
          componentVersion: version_xgboost, 
        },  
        "aws.greengrass.Cli": {
          componentVersion: "2.9.0", 
        },
        "aws.greengrass.LegacySubscriptionRouter": {
          componentVersion: "2.1.8", 
          configurationUpdate: {
            merge: `{
              "subscriptions": {
                "com.ml.consumer": {
                  "id": "Greengrass_Container_Consumer",
                  "source": "component:com.ml.consumer",
                  "subject": "local/topic",
                  "target": "component:com.ml.container"   
                }
              }
            }`,    // target: cloud or lambda component name(component:com.ml.HelloWorldLambda) or ARN of a Lambda function
            reset: [],
          }, 
        } 
      },
      deploymentName: 'component-deployment',
      deploymentPolicies: {
        componentUpdatePolicy: {
          action: 'NOTIFY_COMPONENTS', // NOTIFY_COMPONENTS | SKIP_NOTIFY_COMPONENTS
          timeoutInSeconds: 60,
        },
        failureHandlingPolicy: 'ROLLBACK',  // ROLLBACK | DO_NOTHING
      },
    });   
  }
}
