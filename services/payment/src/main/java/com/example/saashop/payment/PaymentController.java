package com.example.saashop.payment;

import com.fasterxml.jackson.core.JsonProcessingException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;

@RestController
public class PaymentController {
    private final PaymentService paymentService;

    public PaymentController(final PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @Deprecated
    @GetMapping("/hello")
    public String hello() {
        return "hello world!";
    }

    @Deprecated
    @GetMapping("/payment")
    public String payment() throws InterruptedException, JsonProcessingException {

        return paymentService.doPayment();
    }

    @Service
    public static final class PaymentService {
        private final Logger log = LoggerFactory.getLogger(getClass());
        private final MessageProducer producer;

        public PaymentService(final MessageProducer producer) {
            this.producer = producer;
        }

        public String doPayment() throws InterruptedException, JsonProcessingException {
            Thread.sleep(500);
            log.info("### paid");
            producer.produce(MessageProducer.TestMessage.createTestMessage());
//            RestTemplate restTemplate = new RestTemplate();
//            restTemplate.getForObject("http://localhost:8082/delivery", String.class);
            return "done";
        }
    }
}
