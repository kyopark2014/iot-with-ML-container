# CDK Deployment

This is a blank project for CDK development with TypeScript.

The `cdk.json` file tells the CDK Toolkit how to execute your app.

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
