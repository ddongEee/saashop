package com.example.saashop.order.configuration;

import com.amazonaws.auth.AWSCredentialsProvider;
import com.amazonaws.auth.DefaultAWSCredentialsProviderChain;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class AwsGlobalConfig {
    @Bean
    public AWSCredentialsProvider awsCredentialsProvider() {
        return new DefaultAWSCredentialsProviderChain();
    }
}
