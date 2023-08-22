package com.example.saashop.order;

import com.fasterxml.jackson.core.JsonProcessingException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class OrderController {
    private final Logger log = LoggerFactory.getLogger(getClass());
    private final OrderService orderService;

    public OrderController(final OrderService orderService) {
        this.orderService = orderService;
    }

    @GetMapping("/hello")
    public String hello() {
        return "hello world!";
    }

    @GetMapping("/order")
    public String order() throws JsonProcessingException {
        log.info("### order start");
        return orderService.doOrder();
    }

    @Service
    public static final class OrderService {
        private final MessageProducer producer;

        public OrderService(MessageProducer producer) {
            this.producer = producer;
        }

        public String doOrder() throws JsonProcessingException {
            producer.produce(MessageProducer.TestMessage.createTestMessage());
//            RestTemplate restTemplate = new RestTemplate();
//            restTemplate.getForObject("http://localhost:8081/payment", String.class);
            return "done";
        }
    }
}
