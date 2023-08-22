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

    public MessageConsumer(final TenantAwareThreadPoolTaskExecutor asyncTaskExecutor) {
        this.asyncTaskExecutor = asyncTaskExecutor;
    }

    @SqsListener(value = "techsummit-paid-queue", deletionPolicy = SqsMessageDeletionPolicy.NEVER)
    public void consume(String message, Acknowledgment ack, @Headers Map<String, String> headers) {
        asyncTaskExecutor.submit(headers, () -> {
            try {
                Thread.sleep(500);
                TestMessage bootstrap = mapper.readValue(message, TestMessage.class);
                log.info("### Consume message : {}", bootstrap.toString());
                log.info("### Started to delivering");
            } catch (Exception e) {
                log.error("[{}] Consume error : {}", this.getClass().getSimpleName(), e.getMessage());
            } finally {
                ack.acknowledge();
            }
        });
    }

    public static class TestMessage {
        String testMessage;

        public TestMessage() {}

        public String getTestMessage() {
            return testMessage;
        }

        @Override
        public String toString() {
            return this.testMessage;
        }

    }
}
