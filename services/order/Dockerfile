FROM --platform=linux/amd64 openjdk:21-ea-17-buster as builder
WORKDIR /application
ARG JAR_FILE=build/libs/*-SNAPSHOT.jar
COPY ${JAR_FILE} application.jar
RUN java -Djarmode=layertools -jar application.jar extract
RUN yum install -y unzip

FROM --platform=linux/amd64 openjdk:21-ea-17-buster
WORKDIR /application
ENV port 8080
ENV spring.profiles.active local
COPY --from=builder /application/dependencies/ ./
COPY --from=builder /application/spring-boot-loader/ ./
COPY --from=builder /application/snapshot-dependencies/ ./
COPY --from=builder /application/application/ ./

ADD https://github.com/aws/aws-xray-java-agent/releases/latest/download/xray-agent.zip ./xray-agent.zip
RUN unzip ./xray-agent.zip -d .

ENV JAVA_TOOL_OPTIONS "-javaagent:./disco/disco-java-agent.jar=pluginPath=./disco/disco-plugins"
ENV AWS_XRAY_TRACING_NAME "orderService"
ENV AWS_XRAY_CONTEXT_MISSING "IGNORE_ERROR"

ENTRYPOINT ["java", "org.springframework.boot.loader.JarLauncher"]
