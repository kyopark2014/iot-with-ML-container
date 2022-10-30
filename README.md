# AWS Lambda를 이용하여 IoT 디바이스에 XGBoost 머신러닝 알고리즘 적용하기 

여기에서는 AWS Lambda를 이용하여 IoT 디바이스에서 XGBoost 머신러닝 알고리즘을 활용하는 방법에 대해 설명합니다. 

IoT Device에서 머신러닝 알고리즘을 활용하기 위하여 Greengrass의 ML Component를 활용할 수 있습니다. 하지만, 이를 위해서는 ML에 대해 충분한 이해를 통해 디바이스에 ML 환경을 구축하여야 하고, 배포시 디바이스별로 테스트가 필요합니다. 

[Greengrass V2에서는 Lambda함수를 쉽게 실행](https://docs.aws.amazon.com/greengrass/v2/developerguide/run-lambda-functions.html)할 수 있습니다. aws.greengrass.LambdaLauncher을 이용하여 process와 환경을 관리할 수 있고, aws.greengrass.LambdaManager를 이용하여 IPC를 관리할 수 있으며, aws.greengrass.LambdaRuntimes으로 lambda runtime을 구동할 수 있습니다. 

2020년 12월부터 [Lambda가 Container이미지를 지원](https://aws.amazon.com/ko/blogs/korea/new-for-aws-lambda-container-image-support/)함으로써, Lambda에 Container를 등록하여 사용할 수 있습니다. Machine Learning 알고리즘을 활용하기 위해서는 Inference를 제공할수 있는 API를 준비하여야 하는데, 사용한 만큼만 과금되고 별도 관리가 필요하지 않은 Lambda Serverless는 Machine Learning의 Inference API를 제공할 수 있는 유용한 방법입니다. 

Greengrass에서는 Lambda를 Component로 등록하여 설치 및 배포환경을 손쉽게 제공할 수 있으므로, ML algorithm을 Container 환경으로 제공할 수 있다면, Greengrass에서 ML 기능을 활용할 때 유용하게 사용할 수 있습니다.

1) Greengrass에서 사용하는 ML Algorithm은 Jupyter Notebook이나 Amazon Sagemaker를 통해 학습되어지고, 이때 만들어진 알고리즘은 저장되어 container image로 저장되어 이후 Lambda에 배포되어 집니다. 

2) Lambda의 편리한 인터페이스를 통해 ML Algorithm은 충분히 검증 되어지고, Greengrass 디바이스에 배포할 준비가 되면, 디바이스 또는 디바이스 그룹으로 배포할 수 있습니다. 

3) Greengrass 디바이스는 ML 기능을 lambda component로 관리할 수 있습니다. 

4) Greengrass에 설치된 component들은 ML component에 PUBSUB으로 inference 요청을 수행합니다.

5) ML model이 업그레이드 되는 경우에 Lambda를 통해 기능검증을 하고, 충분히 검증되면, AWS Greeengrass를 통해 device에 새로운 모델을 배포할 수 있습니다. 


## Reference

[Run AWS Lambda functions in Greengrass V2](https://docs.aws.amazon.com/greengrass/v2/developerguide/run-lambda-functions.html)

[AWS Lambda의 새로운 기능 — 컨테이너 이미지 지원](https://aws.amazon.com/ko/blogs/korea/new-for-aws-lambda-container-image-support/)
