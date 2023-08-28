FROM --platform=linux/amd64 openjdk:21-ea-17-buster as builder
WORKDIR /application
ARG JAR_FILE=build/libs/*-SNAPSHOT.jar
COPY ${JAR_FILE} application.jar
RUN java -Djarmode=layertools -jar application.jar extract 

FROM --platform=linux/amd64 openjdk:21-ea-17-buster
WORKDIR /application
ENV port 8080
ENV spring.profiles.active local
COPY --from=builder /application/dependencies/ ./
COPY --from=builder /application/spring-boot-loader/ ./
COPY --from=builder /application/snapshot-dependencies/ ./
COPY --from=builder /application/application/ ./

ENTRYPOINT ["java", "org.springframework.boot.loader.JarLauncher"]
