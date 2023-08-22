package com.example.saashop.order;

import com.amazon.sdk.spring.common.message.TenantAwareQueueMessagingTemplate;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.messaging.Message;
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.stereotype.Component;

@Component
public class MessageProducer {
    private final Logger log = LoggerFactory.getLogger(getClass());
    private static final ObjectMapper mapper = new ObjectMapper();
    private final TenantAwareQueueMessagingTemplate queueMessagingTemplate;
    private final String bootstrapQueue;

    public MessageProducer(TenantAwareQueueMessagingTemplate queueMessagingTemplate,
                           @Value("${cloud.aws.queue.ordered-name}") String bootstrapQueue) {
        this.queueMessagingTemplate = queueMessagingTemplate;
        this.bootstrapQueue = bootstrapQueue;
    }

    public void produce(TestMessage testMessage) throws JsonProcessingException {
        String payload = mapper.writeValueAsString(testMessage);
        Message<String> message = MessageBuilder.withPayload(payload).build();
        log.info("### publish message : {}", testMessage.toString());
        queueMessagingTemplate.send(bootstrapQueue, message);
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

        public static TestMessage createTestMessage() {
            TestMessage message = new TestMessage();
            message.testMessage = "This is test message";
            return message;
        }
    }
}
