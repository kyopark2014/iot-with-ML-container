# CDK로 머신러닝 알고리즘 추론을 IoT Greengrass에 배포하기 

## CDK Code 설명

아래와 같이 [cdk-ml-iot-stack.ts](https://github.com/kyopark2014/iot-with-ML-container/blob/main/cdk-ml-iot/lib/cdk-ml-iot-stack.ts)에 대해 설명합니다.

### 추론용 Docker Image로 Container Component 생성

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

### 추론을 수행하는 com.ml.consumer 생성

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

### 추론을 위한 Container component의 배포

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


## CDK Code 생성 및 배포

여기에서는 CDK를 이용해 머신러닝 알고리즘 추론을 IoT Greengrass에 배포하는 방법에 대해 설명합니다. 

### Github Code를 활용하는 경우

아래와 같이 github의 코드를 다운로드 합니다. 

```java
git clone https://github.com/kyopark2014/iot-with-ML-container
```

cdk 폴더로 이동합니다. 

```java
cd iot-with-ML-container/cdk-ml-iot/
```

CDK V2를 설치합니다.

```java
cd cdk-ml-iot
npm install aws-cdk-lib
```

Path 라이브러리를 설치합니다.

```java
npm install path
```

Component들이 여러개의 stack으로 구성하였으므로 아래와 같이 배포를 수행합니다. 

```java
cdk deploy --all
```

### 신규로 CDK를 생성하는 경우

[CDK 초기화](https://github.com/kyopark2014/technical-summary/blob/main/cdk-introduction.md#cdk-initiation)를 참조하여 아래처럼 CDK를 신규로 생성합니다.

```java
mkdir cdk-ml-iot && cd cdk-ml-iot
cdk init app --language typescript
```

아래와 같이 bootstrap을 수행합니다. AWS 계정 당 한번만 수행하면 됩니다.

```java
cdk bootstrap aws://123456789012/ap-northeast-2
```

여기서 “123456789012”는 AWS account number입니다. 이 값은 AWS Console에서 확인할 수 있고, 아래와 같이 AWS CLI 명령어로 확인할 수도 있습니다.

```java
aws sts get-caller-identity --query Account --output text
```

CDK V2를 설치합니다.

```java
cd cdk-ml-iot
npm install aws-cdk-lib
```

Path 라이브러리를 설치합니다.

```java
npm install path
```

[cdk-ml-iot-stack.ts](https://github.com/kyopark2014/iot-with-ML-container/blob/main/cdk-ml-iot/lib/cdk-ml-iot-stack.ts)를 참조하여 import와 component 선언 및 배포 부분을 복사합니다. 

Component들이 여러개의 stack으로 구성하였으므로 아래와 같이 배포를 수행합니다. 

```java
cdk deploy --all
```

## 배포상태의 확인

[Greengrass Console - Deployment](https://ap-northeast-2.console.aws.amazon.com/iot/home?region=ap-northeast-2#/greengrass/v2/deployments)에서 아래와 같이 배포상태를 확인합니다. 

![image](https://user-images.githubusercontent.com/52392004/204114110-16803b65-98e8-46a2-a131-df20bc203624.png)

또한, 아래와 같이 Greengrass에 Docker로 container component가 등록되었는지 확인합니다. 

```java
docker ps
CONTAINER ID   IMAGE                                                                                                                                                                           COMMAND                  CREATED         STATUS         PORTS     NAMES
70e87fcbb8ee   123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/cdk-hnb659fds-container-assets-123456789012-ap-northeast-2:01f0d4028663d4e0a7798d55e70bfee2c94f7e0a25d849b11f868555b0da650d   "python3 /var/task/x…"   3 minutes ago   Up 3 minutes             modest_edison
```

정상적으로 배포가 되었다면 아래와 같이 "com.ml.consumer"로그에서 request에 대해 container component가 정상적으로 응답함을 알수 있습니다. 
```java
sudo tail -f /greengrass/v2/logs/com.ml.consumer.log

2022-11-27T00:53:02.267Z [INFO] (Copier) com.ml.consumer: stdout. request: {"body": "[{\"fixed acidity\":6.6,\"volatile acidity\":0.24,\"citric acid\":0.28,\"residual sugar\":1.8,\"chlorides\":0.028,\"free sulfur dioxide\":39,\"total sulfur dioxide\":132,\"density\":0.99182,\"pH\":3.34,\"sulphates\":0.46,\"alcohol\":11.4,\"color_red\":0,\"color_white\":1},{\"fixed acidity\":8.7,\"volatile acidity\":0.78,\"citric acid\":0.51,\"residual sugar\":1.7,\"chlorides\":0.415,\"free sulfur dioxide\":12,\"total sulfur dioxide\":66,\"density\":0.99623,\"pH\":3.0,\"sulphates\":1.17,\"alcohol\":9.2,\"color_red\":1,\"color_white\":0}]", "isBase64Encoded": false}. {scriptName=services.com.ml.consumer.lifecycle.Run, serviceName=com.ml.consumer, currentState=RUNNING}
2022-11-27T00:53:02.292Z [INFO] (Copier) com.ml.consumer: stdout. result: [6.573914051055908, 4.869720935821533]. {scriptName=services.com.ml.consumer.lifecycle.Run, serviceName=com.ml.consumer, currentState=RUNNING}
```


## 삭제



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

<!--
## Troubleshooting

Deployment가 있는 상태에서 신규로 같은 이름의 Device를 생성하면 아래처럼 배포에 실패할 수 있습니다.

![image](https://user-images.githubusercontent.com/52392004/204113867-7c6463e8-f523-42ca-86ae-6cbe8bd2b271.png)

이때의 로그를 보면 아래처럼 필요한 component가 없어서 발생하는 문제점입니다.

```java
2022-11-27T00:14:17.923Z [INFO] (pool-2-thread-34) com.aws.greengrass.deployment.DeploymentService: deployment-task-execution. Starting deployment task. {Deployment service config={ComponentToGroups={}, dependencies=[], GroupToRootComponents={}, runtime={ProcessedDeployments={}}, version=0.0.0}, deploymentId=04992599-708c-438f-b0c7-02aa0adfa66e, serviceName=DeploymentService, currentState=RUNNING}
2022-11-27T00:14:19.189Z [INFO] (pool-2-thread-35) com.aws.greengrass.componentmanager.DependencyResolver: resolve-group-dependencies-start. Start to resolve group dependencies. {targetComponents=[com.ml.xgboost, aws.greengrass.Cli, com.ml.consumer], componentToVersionRequirements={com.ml.xgboost={thing/GreengrassCore-18163f7ac3e==1.0.0}, aws.greengrass.Cli={thing/GreengrassCore-18163f7ac3e==2.9.0}, com.ml.consumer={thing/GreengrassCore-18163f7ac3e==1.0.0}}}
2022-11-27T00:14:19.191Z [INFO] (pool-2-thread-35) com.aws.greengrass.componentmanager.ComponentManager: No running component satisfies the requirement. Searching in the local component store.. {}
2022-11-27T00:14:19.196Z [INFO] (pool-2-thread-35) com.aws.greengrass.componentmanager.ComponentManager: Can't find a local candidate that satisfies the requirement.. {}
2022-11-27T00:14:19.554Z [INFO] (pool-2-thread-35) com.aws.greengrass.componentmanager.ComponentManager: resolve-component-version-end. Resolved component version.. {ResolvedComponent=com.ml.xgboost-v1.0.0}
```

이때는 아래처럼 [Actions] - [Revise]에서 수동으로 재배포를 수행합니다. 

![noname](https://user-images.githubusercontent.com/52392004/204114007-6f64e580-3df9-4f69-bfea-166c2149d251.png)
->


## Reference


[AWS CDK Docker Image Assets](https://docs.aws.amazon.com/cdk/api/v1/docs/aws-ecr-assets-readme.html)

[class DockerImageAsset (construct)](https://docs.aws.amazon.com/cdk/api/v1/docs/@aws-cdk_aws-ecr-assets.DockerImageAsset.html)

[@aws-cdk/aws-ecr module](https://docs.aws.amazon.com/cdk/api/v1/docs/aws-ecr-readme.html)

[AWS IoT Greengrass OnBoarding and Data Logging using AWS CDK](https://github.com/aws-samples/aws-iot-greengrass-v2-using-aws-cdk)

[AWS IoT Greengrass resource type reference](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/AWS_Greengrass.html)

[class CfnDeployment (construct)](https://docs.aws.amazon.com/cdk/api/v1/docs/@aws-cdk_aws-greengrassv2.CfnDeployment.html)

[class CfnComponentVersion (construct)](https://docs.aws.amazon.com/cdk/api/v1/docs/@aws-cdk_aws-greengrassv2.CfnComponentVersion.html)
