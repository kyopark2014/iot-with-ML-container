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
