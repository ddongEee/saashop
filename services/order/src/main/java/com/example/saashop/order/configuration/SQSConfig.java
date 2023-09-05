package com.example.saashop.order.configuration;

import com.amazonaws.auth.AWSCredentialsProvider;
import com.amazonaws.client.builder.AwsClientBuilder;
import com.amazonaws.services.sqs.AmazonSQSAsync;
import com.amazonaws.services.sqs.AmazonSQSAsyncClientBuilder;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.aws.messaging.config.annotation.EnableSqs;
import org.springframework.cloud.aws.messaging.core.QueueMessagingTemplate;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.core.env.Environment;
// Todo : ADD : logging, tracing
//import com.amazon.sdk.spring.common.message.ContextAwareQueueMessagingTemplate;
//import com.amazonaws.xray.AWSXRay;
//import com.amazonaws.xray.handlers.TracingHandler;

@EnableSqs
@Configuration
public class SQSConfig {

    @Value("${cloud.aws.region.static}")
    private String region;

    @Value("${cloud.aws.queue.uri}")
    private String sqsUrl;

    @Bean
    @Primary
    public AmazonSQSAsync amazonSQSAsync(Environment env, final AWSCredentialsProvider awsCredentialsProvider) {
        AmazonSQSAsyncClientBuilder amazonSQSAsyncClientBuilder = AmazonSQSAsyncClientBuilder.standard()
                .withEndpointConfiguration(new AwsClientBuilder.EndpointConfiguration(sqsUrl, region))
                .withCredentials(awsCredentialsProvider);
        return amazonSQSAsyncClientBuilder
                // Todo : ADD : tracing
//                .withRequestHandlers(new TracingHandler(AWSXRay.getGlobalRecorder()))
                .build();
    }

    // Todo : MODIFY : logging
    @Bean
//    public ContextAwareQueueMessagingTemplate queueMessagingTemplate(final Environment environment, final AWSCredentialsProvider awsCredentialsProvider) {
    public QueueMessagingTemplate queueMessagingTemplate(final Environment environment, final AWSCredentialsProvider awsCredentialsProvider) {
//        return new ContextAwareQueueMessagingTemplate(amazonSQSAsync(environment, awsCredentialsProvider), environment);
        return new QueueMessagingTemplate(amazonSQSAsync(environment, awsCredentialsProvider));
    }
}
