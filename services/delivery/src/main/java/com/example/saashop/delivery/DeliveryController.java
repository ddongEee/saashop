package com.example.saashop.delivery;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class DeliveryController {
    @GetMapping("/hello")
    public String hello() {
        return "hello world!";
    }

    @GetMapping("/delivery")
    public String delivery() {
        System.out.println("delivered");
        return "doneToDelivery";
    }
}
