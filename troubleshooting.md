# Trouble Shooting

## Docker Permission

아래와 같이 docker 관련 에러가 발생할 경우에 대한 대응 방법입니다. 

```java
2022-11-09T14:56:57.032Z [ERROR] (pool-2-thread-22) com.aws.greengrass.deployment.DeploymentService: Error occurred while processing deployment. {deploymentId=cdec9d54-928a-41ed-bca8-a6d81a10951b, serviceName=DeploymentService, currentState=RUNNING}
java.util.concurrent.ExecutionException: com.aws.greengrass.componentmanager.exceptions.PackageDownloadException: Failed to download artifact name: 'docker:123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/cdk-hnb659fds-container-assets-123456789012-ap-northeast-2:6421efde9b674e2b82dfb41d8a696fb780120467d9b97426c0c94cfe88e723db' for component com.ml.xgboost-1.0.0, reason: Failed to get auth token for docker login

Caused by: com.aws.greengrass.componentmanager.exceptions.PackageDownloadException: Failed to download artifact name: 'docker:123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/cdk-hnb659fds-container-assets-123456789012-ap-northeast-2:6421efde9b674e2b82dfb41d8a696fb780120467d9b97426c0c94cfe88e723db' for component com.ml.xgboost-1.0.0, reason: Failed to get auth token for docker login

Caused by: software.amazon.awssdk.services.ecr.model.EcrException: User: arn:aws:sts::123456789012:assumed-role/GreengrassV2TokenExchangeRole/599efcf081cb2f8ffd6d27e9f2f75a32129224b0bba059aeae065e332b4f18ba is not authorized to perform: ecr:GetAuthorizationToken on resource: * because no identity-based policy allows the ecr:GetAuthorizationToken action (Service: Ecr, Status Code: 400, Request ID: 0ecc7c57-56a7-44c3-bb5c-d053765714ed, Extended Request ID: null)
```

[IAM Role](https://us-east-1.console.aws.amazon.com/iamv2/home#/roles)로 이동하여 GreengrassV2TokenExchangeRole을 검색합니다.

아래 Policy가 추가될 수 있도록 합니다. 

```java
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "ecr:CreateRepository",
                "ecr:GetDownloadUrlForLayer",
                "ecr:BatchGetImage",
                "ecr:CompleteLayerUpload",
                "ecr:GetAuthorizationToken",
                "ecr:UploadLayerPart",
                "ecr:InitiateLayerUpload",
                "ecr:BatchCheckLayerAvailability",
                "ecr:PutImage"
            ],
            "Resource": "*"
        }
    ]
}
```

## Reference 

[Give you Cloud9 user permissions to access ECR](https://catalog.us-east-1.prod.workshops.aws/workshops/5ecc2416-f956-4273-b729-d0d30556013f/en-US/chapter8-containers/10-step1#give-you-cloud9-user-permissions-to-access-ecr)
