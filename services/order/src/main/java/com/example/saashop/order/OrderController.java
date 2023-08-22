package com.example.saashop.order;

import com.fasterxml.jackson.core.JsonProcessingException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Locale;
import java.util.UUID;

@RestController
public class OrderController {
    private final OrderService orderService;

    public OrderController(final OrderService orderService) {
        this.orderService = orderService;
    }

    @GetMapping("/order")
    public String order() throws JsonProcessingException {
        return orderService.doOrder();
    }

    @Service
    public static final class OrderService {
        private final Logger log = LoggerFactory.getLogger(getClass());
        private final MessageProducer producer;
        private final DdbClient ddbClient;

        public OrderService(MessageProducer producer, DdbClient ddbClient) {
            this.producer = producer;
            this.ddbClient = ddbClient;
        }

        public String doOrder() throws JsonProcessingException {
            final String orderId = UUID.randomUUID().toString();
            log.info("### [{}] order start",orderId);
            ddbClient.putItemInTable(orderId, "ORDERED");
            final String message = "done to order";
            producer.produce(MessageProducer.TestMessage.createMessage(orderId, message));
            return "done";
        }
    }
}
