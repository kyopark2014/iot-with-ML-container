# AWS Lambda를 이용하여 IoT 디바이스에 XGBoost 머신러닝 알고리즘 적용하기 

여기에서는 AWS Lambda를 이용하여 IoT 디바이스에서 XGBoost 머신러닝 알고리즘을 활용하는 방법에 대해 설명합니다. 

IoT Device에서 머신러닝 알고리즘을 활용하기 위하여 Greengrass의 ML Component를 활용할 수 있습니다. 하지만, 이를 위해서는 ML에 대해 충분한 이해를 통해 디바이스에 ML 환경을 구축하여야 하고, 배포시 디바이스별로 테스트가 필요합니다. 

[Greengrass V2에서는 Lambda함수를 쉽게 실행](https://docs.aws.amazon.com/greengrass/v2/developerguide/run-lambda-functions.html)할 수 있습니다. 

aws.greengrass.LambdaLauncher을 이용하여 process와 환경을 관리할 수 있고, aws.greengrass.LambdaManager를 이용하여 IPC를 관리할 수 있으며, aws.greengrass.LambdaRuntimes으로 lambda runtime을 구동할 수 있습니다. 




## Reference

[Run AWS Lambda functions in Greengrass V2](https://docs.aws.amazon.com/greengrass/v2/developerguide/run-lambda-functions.html)
