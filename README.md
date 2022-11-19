# IoT 디바이스에서 XGBoost 머신러닝(ML) 구현하기 

머신러닝(Machine Learning) 활용이 일반화 되면서 IoT 디바이스에서도 머신러닝을 활용하려는 요구가 증가하고 있습니다. [XGBoost](https://github.com/kyopark2014/ML-Algorithms/blob/main/xgboost.md)는 빠르고 정확한 머신러닝 알고리즘이고, [분류(Classficiation)](https://github.com/kyopark2014/ML-Algorithms/blob/main/classification.md)와 [회귀(Regression)](https://github.com/kyopark2014/ML-Algorithms/blob/main/regression.md)문제에 모두 적용할 수 있어서 널리 활용되어 지고 있습니다. 

머신러닝 알고리즘을 IoT 디바이스의 동작에 활용하기 위해서 머신러닝 서버 API를 이용하면, 1) 디바이스는 항상 네트워크에 접속이 가능하여야 하고, 2) 디바이스의 숫자가 증가하면 서버의 처리 용량이 동일하게 증가되어야 하고, 3) 추론을 위한 API 호출 비용 부담으로 인해서, IoT 디바이스에서 머신러닝을 활용할 때 제한 요소가 될 수 있습니다. 

AWS Greengrass V2는 오픈소스 edge runtime으로 2022년에 re-invtent에서 소개되었습니다. Java 기반의 Core는 Docker 컨테이너를 사용할 수 있는 component를 제공하고, [IoT Greengrass Deployments](https://ap-northeast-2.console.aws.amazon.com/iot/home?region=ap-northeast-2#/greengrass/v2/deployments)를 통해 편리한 배포 환경을 제공합니다. 


<!--
[Greengrass V2에서는 IoT 디바이스에서 Lambda함수를 쉽게 실행](https://docs.aws.amazon.com/greengrass/v2/developerguide/run-lambda-functions.html)할 수 있는 환경을 제공합니다. aws.greengrass.LambdaLauncher을 이용하여 process와 환경을 관리할 수 있고, aws.greengrass.LambdaManager를 이용하여 IPC를 관리할 수 있으며, aws.greengrass.LambdaRuntimes으로 lambda runtime을 구동할 수 있습니다. 

**컨테이너 이미지 방식으로 AWS Lambda를 구현한 경우는 IoT Greengrass에서 불러서 사용할 수 없습니다. (2022.11.7)**
추후 해당 기능을 제공하면 이 git을 재활용할 예정임  -->


2020년 12월부터 [Lambda가 Container이미지를 지원](https://aws.amazon.com/ko/blogs/korea/new-for-aws-lambda-container-image-support/)함으로써, Lambda에 Container를 등록하여 사용할 수 있습니다. Machine Learning 알고리즘을 활용하기 위해서는 Inference를 제공할수 있는 API를 준비하여야 하는데, 사용한 만큼만 과금되고 별도 관리가 필요하지 않은 Lambda Serverless는 Machine Learning의 Inference API를 제공할 수 있는 유용한 방법입니다. 


이와같이 머신러닝 알고리즘을 Greengrass의 컴포넌트로 등록함으로 Lambda의 기능이 Greeengrass가 설치된 디바이스에서 실행되면, 1) 네트워크 연결없이 머신러닝을 활용할 수 있고, 2) 디바이스 숫자가 늘더라도 서버에 영향을 주지 않으며, 3) 추론을 위한 API 호출 비용이 발생하지 않습니다. 또한, Greengrass의 Lambda 컴퍼넌트는 디바이스 종류에 관계없이 동일한 개발 및 배포 환경을 제공하므로, 다수의 다른 디바이스들을 위한 머신러닝 알고리즘의 개발과 배포에 도움을 줍니다. 

 
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


Greengrass V1.x에서는 Docker connector를 이용하였고 V2.0에서는 Component의 Recipy의 environment variable에 정의된 registry에서 Docker Component를 생성하게 됩니다.




## Preparation

### Greengrass

[Greengrass 준비](https://github.com/kyopark2014/iot-greengrass/blob/main/greengrass-commands.md#greengrass-preparation)에 따라, Greengrass installer를 다운로드하고, Core 디바이스로 등록합니다.

### Docker Container 

[Docker Container 준비](https://github.com/kyopark2014/iot-greengrass/blob/main/docker-component.md#docker-container-preparation)에 따라, Greengrass에서 Docker container component를 사용하기 위하여 반드시 필요한 사용자 퍼미션을 설정합니다. 

### Cloud9

Cloud9에서는 [EBS 크기 변경](https://github.com/kyopark2014/technical-summary/blob/main/resize.md)에 따라 EBS 크기를 확대합니다. 


## Greengrass에 추론을 수행하기 위한 Interface 구성

Greengrass에서 사용하려고 하는 머신러닝 알고리즘은 Lambda에서 사용하였던 inference.py 입니다. Lambdad의 경우에 입력의 형태가 event 이므로, interface.py를 이용해 다른 component가 요청한 추론을 event로 변환하고, 그 결과를 다시 다른 component로 전송하여야 합니다.

Greengrass의 componnet들은 IPC 방식으로 통신을 하므로, interface.py에서는 IPC Client V2을 활용하여 Necleus와 IPC session을 생성하고, 다른 추론을 원하는 Component가 publish 방식으로 전달한 요청(Request)을 event 포맷으로 변경하여, inference.py를 이용해 추론을 수행합니다. 여기서는 추론을 요청하는 component인 com.ml.consumer로부터 'local/topic'이라는 topic 이름으로 request를 stream event를 통해 받아서 처리하는 구조입니다. 

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





## Deploy ML XGBoost

[Greengrass Console](https://ap-northeast-2.console.aws.amazon.com/iot/home?region=ap-northeast-2#/greengrass/v2/components)에서 [Create component]를 선택하여, [com.ml.xgboost-1.0.0.json](https://github.com/kyopark2014/iot-with-ML-container/blob/main/src/ml-component/recipes/com.ml.xgboost-1.0.0.json)을 아래와 같이 Recipe에 추가하여 Component를 생성한후 Deployment를 수행합니다. 

![noname](https://user-images.githubusercontent.com/52392004/200893595-b5213019-30db-4db2-81f6-719796aa78ff.png)


정상적으로 설치가 되면 아래와 같이 Greengrass 디바이스에서 greengrass-cli을 이용하여 "com.ml.xgboost"가 동작하는것을 확인 할 수 있습니다. 

```java
$ sudo /greengrass/v2/bin/greengrass-cli component list

Component Name: com.ml.xgboost
    Version: 1.0.0
    State: RUNNING
    Configuration: {"accessControl":{"aws.greengrass.ipc.pubsub":{"com.ml.xgboost:pubsub:1":{"operations":["aws.greengrass#SubscribeToTopic"],"policyDescription":"Allows access to publish to all topics.","resources":["*"]}}}}
```    





### Greengrass Commands와 Memo

유용한 [Greengrass 명령어와 중요한 메모들](https://github.com/kyopark2014/iot-greengrass/blob/main/greengrass-commands.md)를 정리하였습니다.



## Reference

[Run AWS Lambda functions in Greengrass V2](https://docs.aws.amazon.com/greengrass/v2/developerguide/run-lambda-functions.html)

[AWS Lambda의 새로운 기능 — 컨테이너 이미지 지원](https://aws.amazon.com/ko/blogs/korea/new-for-aws-lambda-container-image-support/)

[AWS Edge computing example with Lambda and IoT Greengrass (version 2)](https://medium.com/@rostyslav.myronenko/aws-edge-computing-example-with-lambda-and-iot-greengrass-version-2-aa68f2cc246)

[How to configure optimized machine learning inference using the AWS Management Console - V1](https://docs.aws.amazon.com/greengrass/v1/developerguide/ml-dlc-console.html)

[AWS CDK: Deploy Lambda with Docker](https://sbstjn.com/blog/aws-cdk-lambda-docker-container-example/)

[Amazon S3 이미지에서 도커 컨테이너 실행](https://docs.aws.amazon.com/ko_kr/greengrass/v2/developerguide/run-docker-container.html#run-docker-container-s3)
