# 머신러닝 컨테이너 

여기서는 머신러닝 컨테이너를 준비하는 과정에 대해 설명합니다. 

## XGBoost 머신러닝 

[Wine Quality Data Set](https://archive.ics.uci.edu/ml/datasets/wine+quality)을 이용하여, [Wine Quality을 예측](https://github.com/kyopark2014/ML-Algorithms/tree/main/kaggle/xgboost-wine-quality)을 하기 위해여, [XGBoost 알고리즘](https://github.com/kyopark2014/ML-Algorithms/blob/main/xgboost.md)을 이용합니다. 먼저, [XGBoost를 이용한 Wine Quality](https://github.com/kyopark2014/ML-Algorithms/tree/main/kaggle/xgboost-wine-quality)에서 [xgboost-wine-quality-EDA.ipynb](https://github.com/kyopark2014/ML-Algorithms/blob/main/kaggle/xgboost-wine-quality/xgboost-wine-quality-EDA.ipynb)을 통해 [특성공학(Feature Engineering)](https://github.com/kyopark2014/ML-Algorithms/blob/main/feature-enginnering.md)을 적용하여, [wine_concat.csv](https://github.com/kyopark2014/ML-Algorithms/blob/main/kaggle/xgboost-wine-quality/data/wine_concat.csv)로 데이터셋을 변환됩니다.

[Wine Quality (Regression)](https://github.com/kyopark2014/ML-Algorithms/blob/main/regression.md)에서는 jupyter notebook으로 작성된 XGBoost 알고리즘을 [xgboost-wine-quality.py](https://github.com/kyopark2014/ML-xgboost/blob/main/wine-quality/src/xgboost-wine-quality.py)와 같이 Python 코드로 변환한 후에, 학습(Training)을 수행합니다. 학습의 결과로 [xgboost_wine_quality.json](https://github.com/kyopark2014/ML-xgboost/blob/main/wine-quality/src/xgboost_wine_quality.json)이 만들어집니다. 

여기서는, 이렇게 학습된 XGBoost 모델인 [xgboost_wine_quality.json](https://github.com/kyopark2014/ML-xgboost/blob/main/wine-quality/src/xgboost_wine_quality.json)을 이용하여, 머신러닝 동작을 수행할 수 있도록 [inference.py](https://github.com/kyopark2014/ML-xgboost/blob/main/wine-quality/src/inference.py)으로 추론(Inference)을 수행합니다. 


### Docker Image 준비

IoT 디바이스의 특성한 다양한 디바이스에 동일한 머신러닝 동작을 수행하여야 하므로, Docker를 이용해 컨테이너 환경에서 머신러닝 동작을 수행하고자 합니다. Docker용 이미지를 생성하기 위하여 아래와 같이 Dockerfile을 생성하여야 합니다. 

```java
FROM amazon/aws-lambda-python:3.8

RUN /var/lang/bin/python3.8 -m pip install --upgrade pip
RUN /var/lang/bin/python3.8 -m pip install joblib
RUN /var/lang/bin/python3.8 -m pip install scikit-learn

WORKDIR /var/task/lambda-with-ML-container

COPY inference.py /var/task/
COPY . .

RUN pip install -r requirements.txt

CMD ["inference.handler"]
```

[Dockerfile](https://github.com/kyopark2014/lambda-with-ML-container/blob/main/src/Dockerfile)에서는 AWS Lambda와 Python 3.8 위하여 AWS에서 제공하는 이미지를 활용합니다. 이것은 추후 Lambda와의 호환성과 배포환경을 유사하게 이끌어서 배포 및 검증을 원할히 하기 위함입니다. 

pip, joblib, scikit-learn등 필수 라이브러리를 설치하고, directory를 지정하고, 필요한 파일들을 복사합니다. 또한 [requirements.txt](https://github.com/kyopark2014/lambda-with-ML-container/blob/main/src/requirements.txt)에 따라 필요한 라이브러리를 버전에 맞추어 설치합니다. 여기서는 [inference.py](https://github.com/kyopark2014/lambda-with-ML-container/blob/main/src/inference.py)의 handler()를 이용해 추론(inference)를 수행합니다. 이때 사용하는 모델은 [Wine Quality (Regression)](https://github.com/kyopark2014/ML-xgboost/tree/main/wine-quality)에서 학습시킨 [xgboost_wine_quality.json](https://github.com/kyopark2014/lambda-with-ML-container/blob/main/src/xgboost_wine_quality.json)입니다. 



## 동작 확인 

Docker 이미지에 설치된 라이브러리 버전등이 학습 환경과 다른 경우에, 정상적으로 동작하지 않을수 있습니다. 이를 확인하기 위하여 아래와 같이 docker 컨테이너에서 테스트를 수행합니다. 

Docker 소스로 이동하여 이미지를 빌드합니다. 

```java
cd src
docker build -t inference:v1 .
```

빌드된 이미지를 확인합니다. 

```java
docker images
```

Docker를 실행합니다. 
```java
docker run -d -p 8080:8080 inference:v1
```


Docker의 실행된 container 정보를 확인합니다. 

```java
docker ps
```

아래와 같이 Container ID를 확인 할 수 있습니다. 

```java
CONTAINER ID   IMAGE          COMMAND                  CREATED         STATUS         PORTS                    NAMES
41e297948511   inference:v1   "/lambda-entrypoint.…"   6 seconds ago   Up 4 seconds   0.0.0.0:8080->8080/tcp   stupefied_carson
```

아래와 같이 Bash shell로 접속합니다. 

```java
docker exec -it  41e297948511 /bin/bash
```

[inference-test.py](https://github.com/kyopark2014/lambda-with-ML-container/blob/main/src/inference-test.py)는 [samples.json](https://github.com/kyopark2014/lambda-with-ML-container/blob/main/src/samples.json)을 로드하여 Lambda의 event와 동일한 input을 만든 후에, [inference.py](https://github.com/kyopark2014/lambda-with-ML-container/blob/main/src/inference.py)을 테스트합니다. 따라서, "python3 inference-test.py"와 같이 실행하여, inference.py가 정상적으로 동작하는지 확인할 수 있습니다.

```java
bash-4.2# python3 inference-test.py
np version:  1.23.4
pandas version:  1.5.1
xgb version:  1.6.2
event:  {'body': '[{"fixed acidity":6.6,"volatile acidity":0.24,"citric acid":0.28,"residual sugar":1.8,"chlorides":0.028,"free sulfur dioxide":39,"total sulfur dioxide":132,"density":0.99182,"pH":3.34,"sulphates":0.46,"alcohol":11.4,"color_red":0,"color_white":1},{"fixed acidity":8.7,"volatile acidity":0.78,"citric acid":0.51,"residual sugar":1.7,"chlorides":0.415,"free sulfur dioxide":12,"total sulfur dioxide":66,"density":0.99623,"pH":3.0,"sulphates":1.17,"alcohol":9.2,"color_red":1,"color_white":0}]', 'isBase64Encoded': False}
event:  {'body': '[{"fixed acidity":6.6,"volatile acidity":0.24,"citric acid":0.28,"residual sugar":1.8,"chlorides":0.028,"free sulfur dioxide":39,"total sulfur dioxide":132,"density":0.99182,"pH":3.34,"sulphates":0.46,"alcohol":11.4,"color_red":0,"color_white":1},{"fixed acidity":8.7,"volatile acidity":0.78,"citric acid":0.51,"residual sugar":1.7,"chlorides":0.415,"free sulfur dioxide":12,"total sulfur dioxide":66,"density":0.99623,"pH":3.0,"sulphates":1.17,"alcohol":9.2,"color_red":1,"color_white":0}]', 'isBase64Encoded': False}
isBase64Encoded:  False
Base64 decoding is not required
body:  [{"fixed acidity":6.6,"volatile acidity":0.24,"citric acid":0.28,"residual sugar":1.8,"chlorides":0.028,"free sulfur dioxide":39,"total sulfur dioxide":132,"density":0.99182,"pH":3.34,"sulphates":0.46,"alcohol":11.4,"color_red":0,"color_white":1},{"fixed acidity":8.7,"volatile acidity":0.78,"citric acid":0.51,"residual sugar":1.7,"chlorides":0.415,"free sulfur dioxide":12,"total sulfur dioxide":66,"density":0.99623,"pH":3.0,"sulphates":1.17,"alcohol":9.2,"color_red":1,"color_white":0}]
values:     fixed acidity  volatile acidity  citric acid  residual sugar  ...  sulphates  alcohol  color_red  color_white
0            6.6              0.24         0.28             1.8  ...       0.46     11.4          0            1
1            8.7              0.78         0.51             1.7  ...       1.17      9.2          1            0

[2 rows x 13 columns]
result: [6.573914 4.869721]
200
[6.573914051055908, 4.869720935821533]
Elapsed time: 0.02s
```
