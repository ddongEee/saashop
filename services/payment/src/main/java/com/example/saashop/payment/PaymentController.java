package com.example.saashop.payment;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;

@RestController
public class PaymentController {
    @GetMapping("/hello")
    public String hello() {
        return "hello world!";
    }

    @GetMapping("/payment")
    public String payment() {
        System.out.println("paid");
        PaymentService paymentService = new PaymentService();
        return paymentService.doOrder();
    }

    public static final class PaymentService {
        public String doOrder() {
            RestTemplate restTemplate = new RestTemplate();
            restTemplate.getForObject("http://localhost:8082/delivery", String.class);
            return "done";
        }
    }
}
