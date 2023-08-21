package com.example.saashop.order;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;

@RestController
public class OrderController {
    @GetMapping("/hello")
    public String hello() {
        return "hello world!";
    }

    @GetMapping("/order")
    public String order() {
        System.out.println("ordered");
        OrderService orderService = new OrderService();
        return orderService.doOrder();
    }

    public static final class OrderService {
        public String doOrder() {
            RestTemplate restTemplate = new RestTemplate();
            restTemplate.getForObject("http://localhost:8081/payment", String.class);
            return "done";
        }
    }

}
