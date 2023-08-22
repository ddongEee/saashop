package com.example.saashop.payment;

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
    private final MessageProducer producer;

    public MessageConsumer(TenantAwareThreadPoolTaskExecutor asyncTaskExecutor, MessageProducer producer) {
        this.asyncTaskExecutor = asyncTaskExecutor;
        this.producer = producer;
    }

    @SqsListener(value = "techsummit-ordered-queue", deletionPolicy = SqsMessageDeletionPolicy.NEVER)
    public void consume(String message, Acknowledgment ack, @Headers Map<String, String> headers) {
        asyncTaskExecutor.submit(headers, () -> {
            try {
                Thread.sleep(500);
                MessageProducer.TestMessage bootstrap = mapper.readValue(message, MessageProducer.TestMessage.class);
                log.info("### Consume message : {}", bootstrap.toString());
                log.info("### The payment process has started");
                producer.produce(MessageProducer.TestMessage.createTestMessage());
            } catch (Exception e) {
                log.error("[{}] Consume error : {}", this.getClass().getSimpleName(), e.getMessage());
            } finally {
                ack.acknowledge();
            }
        });
    }
}
