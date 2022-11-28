# 배포 가이드

여기에서는 AWS의 개발환경인 Cloud9을 이용하여 Docker image된 ML 알고리즘을 IoT Greengrass에 배포하는 일련의 과정을 설명합니다. 

## 1) Cloud9을 Greengrass 디바이스로 사용하기

Cloud9은 브라우저만으로 코드를 작성, 실행 및 디버깅할 수 있는 클라우드 기반 IDE(통합 개발 환경)로서 Greengrass 디바이스 동작을 테스트하기에 유용합니다.

### Cloud9 생성

[Cloud9 Console](https://ap-northeast-2.console.aws.amazon.com/cloud9control/home?region=ap-northeast-2#/create)에서 아래와 같이 [Name]을 입력합니다.

![noname](https://user-images.githubusercontent.com/52392004/204112727-f14df4fc-830f-4c58-b229-8adda848a7c0.png)

[Instance type]은 어떤 type이라도 관련없으나 여기서는 편의상 m5.large를 선택하였습니다. Platform은 "Ubuntu Server 18.04 LTS"을 선택합니다. 

![noname](https://user-images.githubusercontent.com/52392004/204112516-ebd04eb3-e1a5-4a87-8bab-8782ecd511ae.png)

아래로 이동하여 [Create]를 선택하면 수분후에 Cloud9이 생성됩니다.

## 2) Greengrass 설치하기 

### Greengrass installer 다운로드

Cloud9을 오픈하고 터미널을 실행합니다.

![noname](https://user-images.githubusercontent.com/52392004/204112636-de69a319-86d8-4199-91ff-1ff9fa1871b8.png)

아래와 같이 Greengrass를 다운로드 합니다. 

```java
curl -s https://d2s8p88vqu9w66.cloudfront.net/releases/greengrass-nucleus-latest.zip > greengrass-nucleus-latest.zip
unzip greengrass-nucleus-latest.zip -d GreengrassCore
```

### Greengrass 설치 

아래와 같이 디바이스 이름은 "GreengrassCore-18163f7ac3e", Group은 ggc_user:ggc_group로 설치를 진행합니다. 

```java
sudo -E java -Droot="/greengrass/v2" -Dlog.store=FILE -jar ./GreengrassCore/lib/Greengrass.jar \
	--aws-region ap-northeast-2 \
	--thing-name GreengrassCore-18163f7ac3e \
	--thing-group-name GreengrassGroup \
	--component-default-user ggc_user:ggc_group \
	--provision true \
	--setup-system-service true \
	--deploy-dev-tools true
```

설치가 다 완료가 되면, [Greengrass Console](https://ap-northeast-2.console.aws.amazon.com/iot/home?region=ap-northeast-2#/greengrass/v2/cores)에서 아래와 같이 Greengrass core device로 "GreengrassCore-18163f7ac3e"가 등록된것을 알 수 있습니다. 설치후 Console 화면에 Core device 정보가 노출되는데 수분정도 지연될수 있으니 보이지 않는 경우에 몇분 후에 refresh 합니다. 

![noname](https://user-images.githubusercontent.com/52392004/204112707-7d82e8dd-4e30-4c24-9e77-c64f42995a76.png)


### Cloud9의 EBS 크기 변경 

필요시 [EBS 크기 변경](https://github.com/kyopark2014/technical-summary/blob/main/resize.md)에 따라 EBS 크기를 확대합니다. 다수의 Docker 이미지 빌드시 Cloud9의 기본 사용용량이 부족할 수 있습니다. 

## 3) Docker Container관련 설정

Greengrass에서 Docker Container를 Component이용하기 위해서는 아래와 같은 설정이 필요합니다. 

Greengrass 디바이스에 접속하여 아래와 같이 사용자를 docker user group에 추가하여야 합니다. 

```java
sudo usermod -aG docker ggc_user
```

ECR을 사용하기 위해서는 [device role](https://docs.aws.amazon.com/greengrass/v2/developerguide/device-service-role.html)을 참조하여, [IAM Console](https://us-east-1.console.aws.amazon.com/iamv2/home?region=ap-northeast-2#/roles/details/GreengrassV2TokenExchangeRole?section=permissions)에서 GreengrassV2TokenExchangeRole에 아래의 permission을 추가합니다. 

```java
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": [
        "ecr:GetAuthorizationToken",
        "ecr:BatchGetImage",
        "ecr:GetDownloadUrlForLayer"
      ],
      "Resource": [
        "*"
      ],
      "Effect": "Allow"
    }
  ]
}
```

## 4) CDK Deployment

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

최초 CDK 배포시에 즉시 deployment가 적용되지 않을 수 있습니다. 이때 아래처럼, [Console - Deployment]에서 Revise를 선택하여 

![noname](https://user-images.githubusercontent.com/52392004/204179872-b7e06e36-7896-46c7-91cf-9f5ae2677c2e.png)



## 배포 결과 확인


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



## Troubleshooting

배포후 Status가 "Completed"로 되었음에도 [Console Core Deivces](https://ap-northeast-2.console.aws.amazon.com/iot/home?region=ap-northeast-2#/greengrass/v2/cores)에서 components가 조회되지 않을 수 있습니다.

![image](https://user-images.githubusercontent.com/52392004/204120961-110112df-7057-4228-aa04-8ef542d6610f.png)

이와같이 배포가 안되었을 경우에는 아래처럼 Deployment를 선택하고, [Revise]를 선택하여 수동으로 재배포를 수행합니다. 

![noname](https://user-images.githubusercontent.com/52392004/204121132-c1fb5873-829a-4399-bd96-4be6b7a49abd.png)


