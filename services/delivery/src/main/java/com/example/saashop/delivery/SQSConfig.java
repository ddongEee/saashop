package com.example.saashop.delivery;

import com.amazon.sdk.spring.common.message.TenantAwareQueueMessagingTemplate;
import com.amazon.sdk.spring.common.message.TenantAwareThreadPoolTaskExecutor;
import com.amazonaws.auth.AWSStaticCredentialsProvider;
import com.amazonaws.auth.BasicAWSCredentials;
import com.amazonaws.client.builder.AwsClientBuilder;
import com.amazonaws.services.sqs.AmazonSQSAsync;
import com.amazonaws.services.sqs.AmazonSQSAsyncClientBuilder;
import com.amazonaws.xray.AWSXRay;
import com.amazonaws.xray.handlers.TracingHandler;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.aws.messaging.config.SimpleMessageListenerContainerFactory;
import org.springframework.cloud.aws.messaging.config.annotation.EnableSqs;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.core.env.Environment;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import java.util.Arrays;

@EnableSqs
@Configuration
public class SQSConfig {

    @Value("${cloud.aws.region.static}")
    private String region;

    @Value("${cloud.aws.credentials.access-key}")
    private String accessKeyId;

    @Value("${cloud.aws.credentials.secret-key}")
    private String secretAccessKey;

    @Value("${cloud.aws.queue.uri}")
    private String sqsUrl;

    @Bean
    @Primary
    public AmazonSQSAsync amazonSQSAsync(Environment env) {
        AmazonSQSAsyncClientBuilder amazonSQSAsyncClientBuilder = AmazonSQSAsyncClientBuilder.standard()
                .withEndpointConfiguration(new AwsClientBuilder.EndpointConfiguration(sqsUrl, region))
                .withCredentials(new AWSStaticCredentialsProvider(new BasicAWSCredentials(accessKeyId, secretAccessKey)));
        if (Arrays.asList(env.getActiveProfiles()).contains("consumer")) {
            return amazonSQSAsyncClientBuilder
                    .build();
        }
        return amazonSQSAsyncClientBuilder
                .withRequestHandlers(new TracingHandler(AWSXRay.getGlobalRecorder()))
                .build();
    }

    @Bean
    public TenantAwareQueueMessagingTemplate queueMessagingTemplate(final Environment environment) {
        return new TenantAwareQueueMessagingTemplate(amazonSQSAsync(environment), environment);
    }

    @Bean
    public ObjectMapper objectMapper() {
        return new ObjectMapper();
    }

    @Bean
    public SimpleMessageListenerContainerFactory simpleMessageListenerContainerFactory(AmazonSQSAsync amazonSQSAsync, ThreadPoolTaskExecutor threadPoolTaskExecutorV2) {
        SimpleMessageListenerContainerFactory factory = new SimpleMessageListenerContainerFactory();
        factory.setAmazonSqs(amazonSQSAsync);
        factory.setTaskExecutor(threadPoolTaskExecutorV2); // 변경
        factory.setWaitTimeOut(20);
        return factory;
    }

    @Bean
    public ThreadPoolTaskExecutor threadPoolTaskExecutorV2() {
        ThreadPoolTaskExecutor threadPoolTaskExecutor = new ThreadPoolTaskExecutor();
        threadPoolTaskExecutor.setCorePoolSize(5);
        threadPoolTaskExecutor.setMaxPoolSize(20);
        threadPoolTaskExecutor.setQueueCapacity(0);
        threadPoolTaskExecutor.setThreadNamePrefix("first-sqsThread-");
        threadPoolTaskExecutor.initialize(); // 변경
        return threadPoolTaskExecutor;
    }

    @Bean
    public TenantAwareThreadPoolTaskExecutor tenantAwareThreadPoolTaskExecutor(final Environment environment) {
        ThreadPoolTaskExecutor threadPoolTaskExecutor = new ThreadPoolTaskExecutor();
        threadPoolTaskExecutor.setCorePoolSize(20);
        threadPoolTaskExecutor.setMaxPoolSize(100);
        threadPoolTaskExecutor.setQueueCapacity(0);
        threadPoolTaskExecutor.setThreadNamePrefix("sqsThread-");
//        threadPoolTaskExecutor.initialize(); // 변경
        return new TenantAwareThreadPoolTaskExecutor(threadPoolTaskExecutor, environment);
    }
}
