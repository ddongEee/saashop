# syntax=docker/dockerfile:experimental
FROM --platform=linux/amd64 eclipse-temurin:17-jdk-alpine AS build
WORKDIR /workspace/app

COPY . /workspace/app
RUN --mount=type=cache,target=/root/.gradle ./gradlew build
RUN mkdir -p build/dependency && (cd build/dependency; jar -xf ../libs/order.jar)

FROM --platform=linux/amd64 eclipse-temurin:17-jdk-alpine
VOLUME /tmp
ARG DEPENDENCY=/workspace/app/build/dependency
COPY --from=build ${DEPENDENCY}/BOOT-INF/lib /app/lib
COPY --from=build ${DEPENDENCY}/META-INF /app/META-INF
COPY --from=build ${DEPENDENCY}/BOOT-INF/classes /app
ENTRYPOINT ["java","-cp","app:app/lib/*","com.example.saashop.order.OrderApplication"]