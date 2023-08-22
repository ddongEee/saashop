package com.example.saashop.delivery;

import com.amazon.sdk.spring.common.message.TenantAwareThreadPoolTaskExecutor;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cloud.aws.messaging.listener.Acknowledgment;
import org.springframework.cloud.aws.messaging.listener.SqsMessageDeletionPolicy;
import org.springframework.cloud.aws.messaging.listener.annotation.SqsListener;
import org.springframework.messaging.handler.annotation.Headers;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
public class MessageConsumer {
    private final Logger log = LoggerFactory.getLogger(getClass());
    private static final ObjectMapper mapper = new ObjectMapper();
    private final TenantAwareThreadPoolTaskExecutor asyncTaskExecutor;
    private final DdbClient ddbClient;

    public MessageConsumer(TenantAwareThreadPoolTaskExecutor asyncTaskExecutor, DdbClient ddbClient) {
        this.asyncTaskExecutor = asyncTaskExecutor;
        this.ddbClient = ddbClient;
    }

    @SqsListener(value = "techsummit-paid-queue", deletionPolicy = SqsMessageDeletionPolicy.NEVER)
    public void consume(String message, Acknowledgment ack, @Headers Map<String, String> headers) {
        asyncTaskExecutor.submit(headers, () -> {
            try {
                Thread.sleep(500);
                TestMessage testMessage = mapper.readValue(message, TestMessage.class);
                log.info("### [{}] Consume message : {}", testMessage.getOrderId(), testMessage.getTestMessage());
                ddbClient.putItemInTable(testMessage.orderId, "DELIVERED");
                log.info("### [{}] Started to delivering", testMessage.getOrderId());
            } catch (Exception e) {
                log.error("[{}] Consume error : {}", this.getClass().getSimpleName(), e.getMessage());
            } finally {
                ack.acknowledge();
            }
        });
    }

    public static class TestMessage {
        String orderId;
        String testMessage;

        public TestMessage() {}

        public String getTestMessage() {
            return testMessage;
        }

        public String getOrderId() {
            return orderId;
        }
    }
}
