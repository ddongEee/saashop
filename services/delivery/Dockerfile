# syntax=docker/dockerfile:experimental
FROM --platform=linux/amd64 gradle:7.3-jdk17 as build  
WORKDIR /workspace/app

COPY . .

RUN chmod +x gradlew
RUN --mount=type=cache,target=/root/.m2 ./gradlew build -DskipTests
RUN mkdir -p target/dependency && (cd target/dependency; jar -xf ../*.jar)

FROM --platform=linux/amd64 gradle:7.3-jdk17  

VOLUME /tmp
ARG DEPENDENCY=/workspace/app/target/dependency
COPY --from=build ${DEPENDENCY}/BOOT-INF/lib /app/lib
COPY --from=build ${DEPENDENCY}/META-INF /app/META-INF
COPY --from=build ${DEPENDENCY}/BOOT-INF/classes /app
ENTRYPOINT ["java","-cp","app:app/lib/*","com.example.saashop.delivery.DeliveryApplication"]