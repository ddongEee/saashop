package com.example.saashop.delivery;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication(
		exclude = {
				org.springframework.cloud.aws.autoconfigure.context.ContextInstanceDataAutoConfiguration.class,
				org.springframework.cloud.aws.autoconfigure.context.ContextStackAutoConfiguration.class,
				org.springframework.cloud.aws.autoconfigure.context.ContextRegionProviderAutoConfiguration.class
		}
)

public class DeliveryApplication {
	static {
		System.setProperty("com.amazonaws.xray.strategy.contextMissingStrategy", "IGNORE_ERROR");
	}

	public static void main(String[] args) {
		SpringApplication.run(DeliveryApplication.class, args);
	}

}
