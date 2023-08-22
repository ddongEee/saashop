package com.example.saashop.delivery;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class DeliveryController {
    private final Logger log = LoggerFactory.getLogger(getClass());

    @Deprecated
    @GetMapping("/hello")
    public String hello() {
        return "hello world!";
    }

    @Deprecated
    @GetMapping("/delivery")
    public String delivery() throws InterruptedException {
        Thread.sleep(500);
        log.info("### delivered");
        return "doneToDelivery";
    }
}
