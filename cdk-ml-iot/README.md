# CDK로 머신러닝 알고리즘 추론을 IoT Greengrass에 배포하기 

여기에서는 CDK를 이용해 머신러닝 알고리즘 추론을 IoT Greengrass에 배포하는 방법에 대해 설명합니다. 

## 필요한 라이브러리 설치

CDK V2를 설치합니다.

```java
cd cdk-ml-iot
npm install aws-cdk-lib
```

Path 라이브러리를 설치합니다.

```java
npm install path
```

## 추론용 Docker Image로 Container Component 생성

아래와 같이 ml-container 폴더에 있는 Dockerfile과 추론 소스인 inference.py을 이용하여 Docker Image를 생성하여, ECR로 복사하여 Artifact를 준비하고, Recipe로 준비합니다. 

```java
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
                  "aws.greengrass#PublishToTopic",
                  "aws.greengrass#SubscribeToTopic"   
                ],
                "resources": [
                  "local/inference",
                  "local/result"
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
```

## 추론을 수행하는 com.ml.consumer 생성

실제 추론을 원하는 Component는 아래와 같이 간단하게 local component로 생성할 수 있습니다.

```java
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
                  "aws.greengrass#PublishToTopic",
                  "aws.greengrass#SubscribeToTopic"                  
                ],
                "resources": [
                  "local/inference",
                  "local/result"
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
```

## 추론을 위한 Container component의 배포

아래와 같이 Greengrass에 추론용 Component들을 배포할 수 있습니다. 

```java
export class componentDeployment extends cdk.Stack {
  constructor(scope: Construct, id: string, version_consumer: string, version_xgboost: string, accountId: string, deviceName: string, props?: cdk.StackProps) {    
    super(scope, id, props);

    // deployments
    const cfnDeployment = new greengrassv2.CfnDeployment(this, 'MyCfnDeployment', {
      targetArn: `arn:aws:iot:ap-northeast-2:`+accountId+`:thing/`+deviceName,    
      components: {
        "com.ml.consumer": {
          componentVersion: version_consumer 
        }, 
        "com.ml.xgboost": {
          componentVersion: version_xgboost
        },  
        "aws.greengrass.Cli": {
          componentVersion: "2.9.0", 
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
```

## 배포 및 삭제

편의상 Component들이 여러개의 stack으로 구성하였으므로 아래와 같이 배포를 수행합니다. 

```java
cdk deploy --all
```

배포에 사용했던 S3와 Recipe, Artifact의 삭제는 아래 명령어를 통해 삭제할 수 있습니다. 하지만 아래 명령어로 Device에 배포된 Component들이 삭제되지 않습니다. 디바이스의 Component들은 재배포시 해당 Component를 리스트에서 제외하고 배포하여야 삭제가 가능합니다.

```java
cdk destroy --all
```


## 참고자료

아래는 추후 사용할 가능성이 있는 CDK 코드입니다.

Acount ID 확인합니다.

```java
const accountId = cdk.Stack.of(this).account
new cdk.CfnOutput(this, 'accountId', {
  value: accountId,
  description: 'accountId',
});
```

IoT용 Repository를 만들어 deployment를 복사합니다. 

```java
const repo = new ecr.Repository(this, 'IoTRepository', {
  repositoryName: 'iot_repository',
  removalPolicy: cdk.RemovalPolicy.DESTROY,
  imageTagMutability: ecr.TagMutability.IMMUTABLE
});

new ecrDeploy.ECRDeployment(this, 'DeployDockerImage', {
  src: new ecrDeploy.DockerImageName(asset.imageUri),
  dest: new ecrDeploy.DockerImageName(`${repo.repositoryUri}:latest`),
}); 

repo.addLifecycleRule({ tagPrefixList: ['dev'], maxImageCount: 9999 });
repo.addLifecycleRule({ maxImageAge: cdk.Duration.days(30) });
```    

## Reference


[AWS CDK Docker Image Assets](https://docs.aws.amazon.com/cdk/api/v1/docs/aws-ecr-assets-readme.html)

[class DockerImageAsset (construct)](https://docs.aws.amazon.com/cdk/api/v1/docs/@aws-cdk_aws-ecr-assets.DockerImageAsset.html)

[@aws-cdk/aws-ecr module](https://docs.aws.amazon.com/cdk/api/v1/docs/aws-ecr-readme.html)

[AWS IoT Greengrass OnBoarding and Data Logging using AWS CDK](https://github.com/aws-samples/aws-iot-greengrass-v2-using-aws-cdk)

[AWS IoT Greengrass resource type reference](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/AWS_Greengrass.html)

[class CfnDeployment (construct)](https://docs.aws.amazon.com/cdk/api/v1/docs/@aws-cdk_aws-greengrassv2.CfnDeployment.html)

[class CfnComponentVersion (construct)](https://docs.aws.amazon.com/cdk/api/v1/docs/@aws-cdk_aws-greengrassv2.CfnComponentVersion.html)
