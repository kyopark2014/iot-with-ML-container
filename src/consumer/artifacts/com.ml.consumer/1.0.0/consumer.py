import pandas as pd
import time
import datetime
import json
import os
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
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))  
    print('BASE_DIR = ', BASE_DIR)
        
    json_file = pd.read_json(BASE_DIR+'/samples.json')
    json_data = json_file.to_json(orient='records')

    event = {
        'body': json_data,
        'isBase64Encoded': False
    }
    print('event: ', event)

    return event

def main():    
    event = load_event()   # load samples

    # request inference
    while True:
        publishEvent(event)        
        #print(results['statusCode'])
        #print(results['body'])

        print('event=', event)
        time.sleep(5)

if __name__ == '__main__':
    main()
