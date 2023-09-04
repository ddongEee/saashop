FROM amazonlinux:2.0.20230612.0
RUN yum  update -y && yum install -y amazon-linux-extras
RUN amazon-linux-extras enable java-openjdk11
RUN yum install -y java-11-openjdk
RUN yum install -y unzip
RUN java -version
ENV PROFILE local
ENV ORDER_SERVER build/libs/order-0.0.1-SNAPSHOT.jar
ENV ORDER_SERVER_PATH /usr/local/order-service
RUN mkdir -p $ORDER_SERVER_PATH
ADD $ORDER_SERVER $ORDER_SERVER_PATH

ADD https://github.com/aws/aws-xray-java-agent/releases/latest/download/xray-agent.zip /usr/local/order-service/xray-agent.zip
RUN unzip /usr/local/order-service/xray-agent.zip -d /usr/local/order-service
RUN ls /usr/local/order-service
ENV JAVA_TOOL_OPTIONS "-javaagent:/usr/local/order-service/disco/disco-java-agent.jar=pluginPath=/usr/local/order-service/disco/disco-plugins"
ENV AWS_XRAY_TRACING_NAME "orderService"
#local 에서 test 시..
#ENV AWS_XRAY_DAEMON_ADDRESS "host.docker.internal:2000"

EXPOSE 8080
ENTRYPOINT ["java", "-Dspring.profiles.active=${PROFILE}", "-Dspring.config.location=classpath:/application.properties", "-jar", "/usr/local/order-service/order-0.0.1-SNAPSHOT.jar"]
