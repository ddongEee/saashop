package com.example.saashop.order;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.aws.messaging.core.QueueMessagingTemplate;
import org.springframework.messaging.Message;
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.stereotype.Component;
// todo : ADD : logging
//import com.amazon.sdk.spring.common.message.ContextAwareQueueMessagingTemplate;

@Component
public class MessageProducer {
    private final Logger log = LoggerFactory.getLogger(getClass());
    private static final ObjectMapper mapper = new ObjectMapper();
    // todo : MODIFY : logging
//    private final ContextAwareQueueMessagingTemplate queueMessagingTemplate;
    private final QueueMessagingTemplate queueMessagingTemplate;
    private final String queue;

    // todo : MODIFY : logging
//    public MessageProducer(ContextAwareQueueMessagingTemplate queueMessagingTemplate,
    public MessageProducer(QueueMessagingTemplate queueMessagingTemplate,
                           @Value("${cloud.aws.queue.ordered-name}") String queue) {
        this.queueMessagingTemplate = queueMessagingTemplate;
        this.queue = queue;
    }

    public void produce(TestMessage testMessage) throws JsonProcessingException {
        String payload = mapper.writeValueAsString(testMessage);
        Message<String> message = MessageBuilder.withPayload(payload).build();
        log.info("### [{}] publish message : {}", testMessage.getOrderId(), testMessage.getTestMessage());
        queueMessagingTemplate.send(queue, message);
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

        public static TestMessage createMessage(final String orderId, final String msg) {
            TestMessage message = new TestMessage();
            message.orderId = orderId;
            message.testMessage = msg;
            return message;
        }
    }
}
