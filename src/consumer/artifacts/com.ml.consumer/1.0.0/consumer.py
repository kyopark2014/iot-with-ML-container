# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: MIT-0
import numpy as np
import pandas as pd
import time
from xgboost import XGBRegressor
import datetime
import json
import awsiot.greengrasscoreipc
from awsiot.greengrasscoreipc.model import (
    PublishToTopicRequest,
    PublishMessage,
    JsonMessage
)

TIMEOUT = 10
ipc_client = awsiot.greengrasscoreipc.connect()
topic = "local/topic"

def publishEvent(body):
    message = {"timestamp": str(datetime.datetime.now()),
        "value": body}
    message_json = json.dumps(message).encode('utf-8')

    request = PublishToTopicRequest()
    request.topic = topic
    publish_message = PublishMessage()
    publish_message.json_message = JsonMessage()
    publish_message.json_message.message = message
    request.publish_message = publish_message
    operation = ipc_client.new_publish_to_topic()
    operation.activate(request)
    future = operation.get_response()
    future.result(TIMEOUT)

    print(f"publish: {message_json}")


def load_event():
    json_file = pd.read_json('samples.json')
    json_data = json_file.to_json(orient='records')

    event = {
        'body': json_data,
        'isBase64Encoded': False
    }
    print('event: ', event)

    return event

def main():
    # Version check
    print('np version: ', np.__version__)
    print('pandas version: ', pd.__version__)

    import xgboost as xgb
    print('xgb version: ', xgb.__version__)

    start = time.time()

    # load samples
    event = load_event()

    # request inference
    # while True:
    publishEvent(event)
    # time.sleep(5)
    #print(results['statusCode'])
    #print(results['body'])

    print('Elapsed time: %0.2fs' % (time.time()-start))   

if __name__ == '__main__':
    main()

