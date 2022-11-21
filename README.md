# IoT 디바이스에서 XGBoost 머신러닝(ML) 구현하기 

머신러닝(Machine Learning) 활용이 일반화 되면서 IoT 디바이스에서도 머신러닝을 활용하려는 요구가 증가하고 있습니다. [XGBoost](https://github.com/kyopark2014/ML-Algorithms/blob/main/xgboost.md)는 빠르고 정확한 머신러닝 알고리즘이고, [분류(Classficiation)](https://github.com/kyopark2014/ML-Algorithms/blob/main/classification.md)와 [회귀(Regression)](https://github.com/kyopark2014/ML-Algorithms/blob/main/regression.md)문제에 모두 적용할 수 있어서 널리 활용되어 지고 있습니다. 

머신러닝 알고리즘을 IoT 디바이스의 동작에 활용하기 위해서 머신러닝 서버 API를 이용하면, 1) 디바이스는 항상 네트워크에 접속이 가능하여야 하고, 2) 디바이스의 숫자가 증가하면 서버의 처리 용량이 동일하게 증가되어야 하고, 3) 추론을 위한 API 호출 비용 부담으로 인해서, IoT 디바이스에서 머신러닝을 활용할 때 제한 요소가 될 수 있습니다. 

[AWS Greengrass V2](https://docs.aws.amazon.com/greengrass/v2/developerguide/what-is-iot-greengrass.html)는 오픈소스 edge runtime으로 2022년에 re-invtent에서 소개되었습니다. Java 기반의 Core는 Docker 컨테이너를 사용할 수 있는 component를 제공하고, IoT Greengrass Deployments를 통해 편리한 배포 환경을 제공합니다. 


<!--
[Greengrass V2에서는 IoT 디바이스에서 Lambda함수를 쉽게 실행](https://docs.aws.amazon.com/greengrass/v2/developerguide/run-lambda-functions.html)할 수 있는 환경을 제공합니다. aws.greengrass.LambdaLauncher을 이용하여 process와 환경을 관리할 수 있고, aws.greengrass.LambdaManager를 이용하여 IPC를 관리할 수 있으며, aws.greengrass.LambdaRuntimes으로 lambda runtime을 구동할 수 있습니다. 

**컨테이너 이미지 방식으로 AWS Lambda를 구현한 경우는 IoT Greengrass에서 불러서 사용할 수 없습니다. (2022.11.7)**
추후 해당 기능을 제공하면 이 git을 재활용할 예정임  -->


2020년 12월부터 [Lambda가 Container이미지를 지원](https://aws.amazon.com/ko/blogs/korea/new-for-aws-lambda-container-image-support/)함으로써, Lambda에 Container를 등록하여 사용할 수 있습니다. Machine Learning 알고리즘을 활용하기 위해서는 Inference를 제공할수 있는 API를 준비하여야 하는데, 사용한 만큼만 과금되고 별도 관리가 필요하지 않은 Lambda Serverless는 Machine Learning의 Inference API를 제공할 수 있는 유용한 방법입니다. 


이와같이 머신러닝 알고리즘을 Greengrass의 컴포넌트로 등록함으로 Lambda의 기능이 Greeengrass가 설치된 디바이스에서 실행되면, 1) 네트워크 연결없이 머신러닝을 활용할 수 있고, 2) 디바이스 숫자가 늘더라도 서버에 영향을 주지 않으며, 3) 추론을 위한 API 호출 비용이 발생하지 않습니다. 또한, Greengrass의 Lambda 컴퍼넌트는 디바이스 종류에 관계없이 동일한 개발 및 배포 환경을 제공하므로, 다수의 다른 디바이스들을 위한 머신러닝 알고리즘의 개발과 배포에 도움을 줄 수 있습니다.

아래는 전체적인 Architecture를 설명하고 있습니다. IoT Greengrass 디바이스에는 추론(Inference)을 제공하는 Container Component와 추론을 요청하는 Local Component가 있습니다. Local Component는 각종 IoT 센서와 연결되어 있는데, 동작에 머신러닝을 활용하고자 할때 마치 Cloud 사용자가 RESTful API로 Lambda의 추론(Inference) API를 호출하듯이, Component간의 IPC 통신을 이용하여 Container Component의 추론(Inference) 기능을 호출하여 사용할 수 있습니다. Container Component는 Lambda의 Infence API를 그대로 가져와서 Greengrass 디바이스에서 실행할 수 있도록 해줍니다. Lambda는 event 방식으로 호출하는 구조이지만, Greengrass의 component들은 IPC 통신으로 연결되어야 하므로, Container Component에 있는 [Interface.py](https://github.com/kyopark2014/iot-with-ML-container/blob/main/src/ml-container/interface.py)는 IPC Client V2를 이용하여 local component와 IPC 세션을 열고, 인입된 요청을 event 형태로 바꾸어서 추론을 Inference 모듈로 전달하여 처리합니다. Container Component에 있는 Inference model에는 Lambda와 동일한 [inference.py](https://github.com/kyopark2014/iot-with-ML-container/blob/main/src/ml-container/inference.py)와 [xgboost machine learning model](https://github.com/kyopark2014/iot-with-ML-container/blob/main/src/ml-container/xgboost_wine_quality.json)을 가지고 있습니다. AWS CDK는 Container Component의 [Dockerfile](https://github.com/kyopark2014/iot-with-ML-container/blob/main/src/ml-container/Dockerfile)을 이용하여 Infernce API를 제공할수 있는 Docker Container Image를 생성하고, ECR에 저장한 다음에, AWS IoT Device Management를 이용하여 Greengrass 디바이스에 배포합니다. 

<img width="869" alt="image" src="https://user-images.githubusercontent.com/52392004/202946335-5dfde6a3-e238-483e-95e9-ac5842901aca.png">

 
<!--
여기에서는 AWS Lambda를 IoT 디바이스에서 동작하게 함으로써, 손쉽게 XGBoost 머신러닝 알고리즘을 활용하는 방법에 대해 설명합니다. 

또한, 기존에 ML을 component로 등록하기 위해 필요로 했던, ML에 대한 많은 지식을 필요로 하지 않으며, 디바이스별로 최적화할 필요없이, 

IoT Device에서 머신러닝 알고리즘을 활용하기 위하여 Greengrass의 ML Component를 활용할 수 있습니다. 하지만, 이를 위해서는 ML에 대해 충분한 이해를 통해 디바이스에 ML 환경을 구축하여야 하고, 배포시 디바이스별로 테스트가 필요합니다. 
Greengrass에서는 Lambda를 Component로 등록하여 설치 및 배포환경을 손쉽게 제공할 수 있으므로, ML algorithm을 Container 환경으로 제공할 수 있다면, Greengrass에서 ML 기능을 활용할 때 유용하게 사용할 수 있습니다.-->


이를 위한 전체적인 과정은 아래와 같습니다. 

1) IoT 디바이스에서 사용하는 머신러닝 알고리즘은 Jupyter Notebook이나 Amazon Sagemaker를 통해 학습되어지고, 이때 만들어진 알고리즘은 저장되어 컨테이너 이미지로 저장되어 Lambda에 배포되어 집니다. 

2) Lambda의 편리한 인터페이스를 통해 머신러닝 알고리즘은 충분히 검증 되어지고, IoT Greengrass를 이용해 Docker 컨테이너 환경에서 안정적으로 디바이스 또는 디바이스 그룹으로 배포될 수 있습니다.

3) Greengrass 디바이스는 머신러닝 기능을 IoT Greengrass에서 Component로 편리하게 관리할 수 있습니다. 

4) 디바이스에서 머신러닝을 실제로 활용하는 Greengrass Component들은 서버에 머신러닝 요청을 하듯이 디바이스 내부의 머신러닝 컴포넌트에게 PUBSUB 방식으로 요청합니다.

5) 이후 머신러닝 알고리즘이 업데이트 되면, Lambda를 통해 기능검증을 하여 충분히 검증된다믐에, AWS Greeengrass를 통해 다수의 다른 디바이스에 편리하게 배포할 수 있습니다. 


Greengrass V1.x에서는 Docker connector를 이용하였고 V2.0에서는 Component의 Recipy의 environment variable에 정의된 registry에서 Docker Component를 생성하게 됩니다. 여기서는 Greengrass V2에 기반하여 추론용 Docker Image를 Greengrass에 container component로 배포합니다.




## Preparation

### Greengrass

[Greengrass 준비](https://github.com/kyopark2014/iot-greengrass/blob/main/greengrass-commands.md#greengrass-preparation)에 따라, Greengrass installer를 다운로드하고, Core 디바이스로 등록합니다.

### Docker Container 

[Docker Container 준비](https://github.com/kyopark2014/iot-greengrass/blob/main/docker-component.md#docker-container-preparation)에 따라, Greengrass에서 Docker container component를 사용하기 위하여 반드시 필요한 사용자 퍼미션을 설정합니다. 

### Cloud9

Cloud9에서는 [EBS 크기 변경](https://github.com/kyopark2014/technical-summary/blob/main/resize.md)에 따라 EBS 크기를 확대합니다. 


## Greengrass에서 추론을 수행하기 위한 Interface 구성

Greengrass에서 사용하려고 하는 머신러닝 알고리즘은 Lambda에서 사용하였던 [inference.py](https://github.com/kyopark2014/iot-with-ML-container/blob/main/src/ml-container/inference.py)입니다. Lambdad의 경우에 입력의 형태가 event 이므로, [interface.py](https://github.com/kyopark2014/iot-with-ML-container/blob/main/src/ml-container/interface.py)를 이용해 다른 component가 요청한 추론을 event로 변환하고, 그 결과를 다시 다른 component로 전송하여야 합니다.

Greengrass의 componnet들은 IPC 방식으로 통신을 하므로, [interface.py](https://github.com/kyopark2014/iot-with-ML-container/blob/main/src/ml-container/interface.py)에서는 IPC Client V2을 활용하여 Necleus와 IPC session을 생성하고, 다른 추론을 원하는 Component가 publish 방식으로 전달한 요청(Request)을 event 포맷으로 변경하여, inference.py를 이용해 추론을 수행합니다. 여기서는 추론을 요청하는 component인 "com.ml.consumer"로부터 'local/topic'이라는 topic 이름으로 request를 stream event를 통해 받아서 처리하는 구조입니다. 

```python
def on_stream_event(event: SubscriptionResponseMessage) -> None:
    try:
        message = str(event.binary_message.message, 'utf-8')
        topic = event.binary_message.context.topic
        logger.debug('Received new message on topic %s: %s' % (topic, message))

        # Inference
        json_data = json.loads(message) # json decoding        
        results = handler(json_data,"")  
        
        # results
        logger.debug('result: ' + json.dumps(results['body']))

    except:
        traceback.print_exc()
```        

## CDK로 Component 배포하기 

[CDK로 머신러닝 알고리즘 추론을 IoT Greengrass에 배포하기](https://github.com/kyopark2014/iot-with-ML-container/tree/main/cdk-ml-iot)에 따라 CDK로 추론을 수행하는 Container component와 추론을 요청하는 local compnent를 생성합니다. 




## 배포 결과

아래와 같이 Greengrass CLI를 이용하여 배포된 Component를 확인합니다. 

```java
sudo /greengrass/v2/bin/greengrass-cli component list
```

아래와 같이 com.ml.consumer와 com.ml.xgboost가 배포되었습니다. 

```java
Nov 19, 2022 1:26:07 PM software.amazon.awssdk.eventstreamrpc.EventStreamRPCConnection$1 onConnectionSetup
INFO: Socket connection /greengrass/v2/ipc.socket:8033 to server result [AWS_ERROR_SUCCESS]
Nov 19, 2022 1:26:08 PM software.amazon.awssdk.eventstreamrpc.EventStreamRPCConnection$1 onProtocolMessage
INFO: Connection established with event stream RPC server
Components currently running in Greengrass:

Component Name: com.ml.consumer
    Version: 1.0.0
    State: RUNNING
    Configuration: {"accessControl":{"aws.greengrass.ipc.pubsub":{"com.ml.consumer:pubsub:1":{"operations":["aws.greengrass#PublishToTopic"],"policyDescription":"Allows access to publish to all topics.","resources":["*"]}}}}
Component Name: com.ml.xgboost
    Version: 1.0.2
    State: RUNNING
    Configuration: {"accessControl":{"aws.greengrass.ipc.pubsub":{"com.ml.xgboost:pubsub:1":{"operations":["aws.greengrass#SubscribeToTopic"],"policyDescription":"Allows access to subscribe to all topics.","resources":["*"]}}}}
```

아래와 같이 "docker ps"로 정상적으로 inference용 Docker Container가 배포되었는것을 확인할 수 있습니다.

```java
CONTAINER ID   IMAGE                                                                                                                                                                           COMMAND                  CREATED         STATUS         PORTS     NAMES
1c458928843e   123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/cdk-hnb659fds-container-assets-123456789012-ap-northeast-2:5f39c9f7a2229021f0500caff1bb29c35cd12fbd37bcd2cbe74e2fc30a721a89   "python3 /var/task/x…"   6 minutes ago   Up 5 minutes             nervous_elgamal
```

[AWS Console의 Component](https://ap-northeast-2.console.aws.amazon.com/iot/home?region=ap-northeast-2#/greengrass/v2/components)에서 아래처럼 생성된 Component에 대한 정보를 확인할 수 있습니다. 

![image](https://user-images.githubusercontent.com/52392004/202870851-15e7fae2-7550-48e1-84d8-013d0c26e3c0.png)

[AWS Console의 Deployment](https://ap-northeast-2.console.aws.amazon.com/iot/home?region=ap-northeast-2#/greengrass/v2/deployments)에서 아래와 같이 배포 상태를 확인할 수 있수 있습니다.

![image](https://user-images.githubusercontent.com/52392004/202870871-f6f404c2-9ce3-4f6e-9f44-8be8fc035879.png)

"com.ml.consumer"의 로그를 보면 아래와 같이 request에 대해 적절한 응답을 받음을 알 수 있습니다.

```java
2022-11-20T17:21:59.386Z [INFO] (Copier) com.ml.consumer: stdout. request: {"body": "[{\"fixed acidity\":6.6,\"volatile acidity\":0.24,\"citric acid\":0.28,\"residual sugar\":1.8,\"chlorides\":0.028,\"free sulfur dioxide\":39,\"total sulfur dioxide\":132,\"density\":0.99182,\"pH\":3.34,\"sulphates\":0.46,\"alcohol\":11.4,\"color_red\":0,\"color_white\":1},{\"fixed acidity\":8.7,\"volatile acidity\":0.78,\"citric acid\":0.51,\"residual sugar\":1.7,\"chlorides\":0.415,\"free sulfur dioxide\":12,\"total sulfur dioxide\":66,\"density\":0.99623,\"pH\":3.0,\"sulphates\":1.17,\"alcohol\":9.2,\"color_red\":1,\"color_white\":0}]", "isBase64Encoded": false}. {scriptName=services.com.ml.consumer.lifecycle.Run, serviceName=com.ml.consumer, currentState=RUNNING}
2022-11-20T17:21:59.411Z [INFO] (Copier) com.ml.consumer: stdout. result: [6.573914051055908, 4.869720935821533]. {scriptName=services.com.ml.consumer.lifecycle.Run, serviceName=com.ml.consumer, currentState=RUNNING}
```

## Greengrass Commands와 Memo

유용한 [Greengrass 명령어와 중요한 메모들](https://github.com/kyopark2014/iot-greengrass/blob/main/greengrass-commands.md)를 정리하였습니다.



## Reference

[Run AWS Lambda functions in Greengrass V2](https://docs.aws.amazon.com/greengrass/v2/developerguide/run-lambda-functions.html)

[AWS Lambda의 새로운 기능 — 컨테이너 이미지 지원](https://aws.amazon.com/ko/blogs/korea/new-for-aws-lambda-container-image-support/)

[AWS Edge computing example with Lambda and IoT Greengrass (version 2)](https://medium.com/@rostyslav.myronenko/aws-edge-computing-example-with-lambda-and-iot-greengrass-version-2-aa68f2cc246)

[How to configure optimized machine learning inference using the AWS Management Console - V1](https://docs.aws.amazon.com/greengrass/v1/developerguide/ml-dlc-console.html)

[AWS CDK: Deploy Lambda with Docker](https://sbstjn.com/blog/aws-cdk-lambda-docker-container-example/)

[Amazon S3 이미지에서 도커 컨테이너 실행](https://docs.aws.amazon.com/ko_kr/greengrass/v2/developerguide/run-docker-container.html#run-docker-container-s3)
