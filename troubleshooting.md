
```java
2022-11-09T10:47:10.037Z [INFO] (pool-2-thread-17) com.aws.greengrass.componentmanager.DependencyResolver: resolve-group-dependencies-finish. Finish resolving group dependencies. {resolvedComponents={com.ml.xgboost=ComponentMetadata(componentIdentifier=com.ml.xgboost-v1.0.0, dependencies={aws.greengrass.TokenExchangeService=>=2.0.0 <2.1.0, aws.greengrass.DockerApplicationManager=>=2.0.0 <2.1.0}), aws.greengrass.TokenExchangeService=ComponentMetadata(componentIdentifier=aws.greengrass.TokenExchangeService-v2.0.3, dependencies={}), aws.greengrass.DockerApplicationManager=ComponentMetadata(componentIdentifier=aws.greengrass.DockerApplicationManager-v2.0.7, dependencies={aws.greengrass.Nucleus=>=2.1.0 <2.9.0}), aws.greengrass.Nucleus=ComponentMetadata(componentIdentifier=aws.greengrass.Nucleus-v2.8.1, dependencies={})}, componentToVersionRequirements={com.ml.xgboost={thing/GreengrassCore-18163f7ac3e==1.0.0}, aws.greengrass.TokenExchangeService={com.ml.xgboost=>=2.0.0 <2.1.0}, aws.greengrass.DockerApplicationManager={com.ml.xgboost=>=2.0.0 <2.1.0}, aws.greengrass.Nucleus={aws.greengrass.DockerApplicationManager=>=2.1.0 <2.9.0}}}
2022-11-09T10:47:10.054Z [INFO] (pool-2-thread-17) com.aws.greengrass.componentmanager.ComponentManager: prepare-package-start. {packageIdentifier=com.ml.xgboost-v1.0.0}
2022-11-09T10:47:12.057Z [INFO] (pool-2-thread-17) com.aws.greengrass.tes.CredentialRequestHandler: Received IAM credentials that will be cached until 2022-11-09T11:42:12Z. {iotCredentialsPath=/role-aliases/GreengrassV2TokenExchangeRoleAlias/credentials}
2022-11-09T10:47:12.166Z [ERROR] (pool-2-thread-17) com.aws.greengrass.componentmanager.ComponentManager: Failed to prepare package com.ml.xgboost-v1.0.0. {}
com.aws.greengrass.componentmanager.exceptions.PackageDownloadException: Failed to download artifact name: 'docker:677146750822.dkr.ecr.ap-northeast-2.amazonaws.com/cdk-hnb659fds-container-assets-677146750822-ap-northeast-2:6421efde9b674e2b82dfb41d8a696fb780120467d9b97426c0c94cfe88e723db' for component com.ml.xgboost-1.0.0, reason: Failed to get auth token for docker login
        at com.aws.greengrass.componentmanager.plugins.docker.DockerImageDownloader.performDownloadSteps(DockerImageDownloader.java:174)
        at com.aws.greengrass.componentmanager.plugins.docker.DockerImageDownloader.download(DockerImageDownloader.java:90)
        at com.aws.greengrass.componentmanager.ComponentManager.prepareArtifacts(ComponentManager.java:440)
        at com.aws.greengrass.componentmanager.ComponentManager.preparePackage(ComponentManager.java:386)
        at com.aws.greengrass.componentmanager.ComponentManager.lambda$preparePackages$1(ComponentManager.java:347)
        at java.base/java.util.concurrent.FutureTask.run(FutureTask.java:264)
        at java.base/java.util.concurrent.ThreadPoolExecutor.runWorker(ThreadPoolExecutor.java:1128)
        at java.base/java.util.concurrent.ThreadPoolExecutor$Worker.run(ThreadPoolExecutor.java:628)
        at java.base/java.lang.Thread.run(Thread.java:829)
Caused by: com.aws.greengrass.componentmanager.plugins.docker.exceptions.RegistryAuthException: Failed to get credentials for ECR registry - 677146750822
        at com.aws.greengrass.componentmanager.plugins.docker.EcrAccessor.getCredentials(EcrAccessor.java:91)
        at com.aws.greengrass.componentmanager.plugins.docker.DockerImageDownloader.lambda$performDownloadSteps$0(DockerImageDownloader.java:165)
        at com.aws.greengrass.util.RetryUtils.runWithRetry(RetryUtils.java:50)
        at com.aws.greengrass.componentmanager.plugins.docker.DockerImageDownloader.performDownloadSteps(DockerImageDownloader.java:158)
        ... 8 more
Caused by: software.amazon.awssdk.services.ecr.model.EcrException: User: arn:aws:sts::677146750822:assumed-role/GreengrassV2TokenExchangeRole/599efcf081cb2f8ffd6d27e9f2f75a32129224b0bba059aeae065e332b4f18ba is not authorized to perform: ecr:GetAuthorizationToken on resource: * because no identity-based policy allows the ecr:GetAuthorizationToken action (Service: Ecr, Status Code: 400, Request ID: 1a59da26-7271-46be-b5b7-e8649a71e28e, Extended Request ID: null)
        at software.amazon.awssdk.core.internal.http.CombinedResponseHandler.handleErrorResponse(CombinedResponseHandler.java:123)
        at software.amazon.awssdk.core.internal.http.CombinedResponseHandler.handleResponse(CombinedResponseHandler.java:79)
        at software.amazon.awssdk.core.internal.http.CombinedResponseHandler.handle(CombinedResponseHandler.java:59)
        at software.amazon.awssdk.core.internal.http.CombinedResponseHandler.handle(CombinedResponseHandler.java:40)
        at software.amazon.awssdk.core.internal.http.pipeline.stages.HandleResponseStage.execute(HandleResponseStage.java:40)
        at software.amazon.awssdk.core.internal.http.pipeline.stages.HandleResponseStage.execute(HandleResponseStage.java:30)
        at software.amazon.awssdk.core.internal.http.pipeline.RequestPipelineBuilder$ComposingRequestPipelineStage.execute(RequestPipelineBuilder.java:206)
        at software.amazon.awssdk.core.internal.http.pipeline.stages.ApiCallAttemptTimeoutTrackingStage.execute(ApiCallAttemptTimeoutTrackingStage.java:73)
        at software.amazon.awssdk.core.internal.http.pipeline.stages.ApiCallAttemptTimeoutTrackingStage.execute(ApiCallAttemptTimeoutTrackingStage.java:42)
        at software.amazon.awssdk.core.internal.http.pipeline.stages.TimeoutExceptionHandlingStage.execute(TimeoutExceptionHandlingStage.java:78)
        at software.amazon.awssdk.core.internal.http.pipeline.stages.TimeoutExceptionHandlingStage.execute(TimeoutExceptionHandlingStage.java:40)
        at software.amazon.awssdk.core.internal.http.pipeline.stages.ApiCallAttemptMetricCollectionStage.execute(ApiCallAttemptMetricCollectionStage.java:50)
        at software.amazon.awssdk.core.internal.http.pipeline.stages.ApiCallAttemptMetricCollectionStage.execute(ApiCallAttemptMetricCollectionStage.java:36)
        at software.amazon.awssdk.core.internal.http.pipeline.stages.RetryableStage.execute(RetryableStage.java:81)
        at software.amazon.awssdk.core.internal.http.pipeline.stages.RetryableStage.execute(RetryableStage.java:36)
        at software.amazon.awssdk.core.internal.http.pipeline.RequestPipelineBuilder$ComposingRequestPipelineStage.execute(RequestPipelineBuilder.java:206)
        at software.amazon.awssdk.core.internal.http.StreamManagingStage.execute(StreamManagingStage.java:56)
        at software.amazon.awssdk.core.internal.http.StreamManagingStage.execute(StreamManagingStage.java:36)
        at software.amazon.awssdk.core.internal.http.pipeline.stages.ApiCallTimeoutTrackingStage.executeWithTimer(ApiCallTimeoutTrackingStage.java:80)
        at software.amazon.awssdk.core.internal.http.pipeline.stages.ApiCallTimeoutTrackingStage.execute(ApiCallTimeoutTrackingStage.java:60)
        at software.amazon.awssdk.core.internal.http.pipeline.stages.ApiCallTimeoutTrackingStage.execute(ApiCallTimeoutTrackingStage.java:42)
        at software.amazon.awssdk.core.internal.http.pipeline.stages.ApiCallMetricCollectionStage.execute(ApiCallMetricCollectionStage.java:48)
        at software.amazon.awssdk.core.internal.http.pipeline.stages.ApiCallMetricCollectionStage.execute(ApiCallMetricCollectionStage.java:31)
        at software.amazon.awssdk.core.internal.http.pipeline.RequestPipelineBuilder$ComposingRequestPipelineStage.execute(RequestPipelineBuilder.java:206)
        at software.amazon.awssdk.core.internal.http.pipeline.RequestPipelineBuilder$ComposingRequestPipelineStage.execute(RequestPipelineBuilder.java:206)
        at software.amazon.awssdk.core.internal.http.pipeline.stages.ExecutionFailureExceptionReportingStage.execute(ExecutionFailureExceptionReportingStage.java:37)
        at software.amazon.awssdk.core.internal.http.pipeline.stages.ExecutionFailureExceptionReportingStage.execute(ExecutionFailureExceptionReportingStage.java:26)
        at software.amazon.awssdk.core.internal.http.AmazonSyncHttpClient$RequestExecutionBuilderImpl.execute(AmazonSyncHttpClient.java:193)
        at software.amazon.awssdk.core.internal.handler.BaseSyncClientHandler.invoke(BaseSyncClientHandler.java:103)
        at software.amazon.awssdk.core.internal.handler.BaseSyncClientHandler.doExecute(BaseSyncClientHandler.java:167)
        at software.amazon.awssdk.core.internal.handler.BaseSyncClientHandler.lambda$execute$1(BaseSyncClientHandler.java:82)
        at software.amazon.awssdk.core.internal.handler.BaseSyncClientHandler.measureApiCallSuccess(BaseSyncClientHandler.java:175)
        at software.amazon.awssdk.core.internal.handler.BaseSyncClientHandler.execute(BaseSyncClientHandler.java:76)
        at software.amazon.awssdk.core.client.handler.SdkSyncClientHandler.execute(SdkSyncClientHandler.java:45)
        at software.amazon.awssdk.awscore.client.handler.AwsSyncClientHandler.execute(AwsSyncClientHandler.java:56)
        at software.amazon.awssdk.services.ecr.DefaultEcrClient.getAuthorizationToken(DefaultEcrClient.java:1405)
        at com.aws.greengrass.componentmanager.plugins.docker.EcrAccessor.getCredentials(EcrAccessor.java:79)
        ... 11 more

2022-11-09T10:47:12.168Z [ERROR] (pool-2-thread-16) com.aws.greengrass.deployment.DeploymentService: Error occurred while processing deployment. {deploymentId=140af990-b14c-4cd8-9a46-6930074ab1ab, serviceName=DeploymentService, currentState=RUNNING}
```
