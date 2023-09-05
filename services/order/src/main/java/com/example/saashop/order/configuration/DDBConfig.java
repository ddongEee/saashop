package com.example.saashop.order.configuration;

import com.amazonaws.auth.AWSCredentialsProvider;
import com.amazonaws.services.dynamodbv2.AmazonDynamoDB;
import com.amazonaws.services.dynamodbv2.AmazonDynamoDBClientBuilder;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
// todo : ADD : logging, tracing
//import com.amazonaws.xray.AWSXRay;
//import com.amazonaws.xray.handlers.TracingHandler;

@Configuration
public class DDBConfig {
    @Value("${cloud.aws.region.static}")
    private String region;

    @Bean
    public AmazonDynamoDB amazonDynamoDB(final AWSCredentialsProvider awsCredentialsProvider) {
        return AmazonDynamoDBClientBuilder
                .standard()
                .withRegion(this.region)
                .withCredentials(awsCredentialsProvider)
                // todo : ADD : tracing
//                .withRequestHandlers(new TracingHandler(AWSXRay.getGlobalRecorder()))
                .build();
    }
}
