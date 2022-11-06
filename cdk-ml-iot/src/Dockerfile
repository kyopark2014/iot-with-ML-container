FROM amazon/aws-lambda-nodejs:12

ARG FUNCTION_DIR="/var/task"

RUN mkdir -p ${FUNCTION_DIR}

COPY handler.js ${FUNCTION_DIR}

CMD [ "handler.run" ]