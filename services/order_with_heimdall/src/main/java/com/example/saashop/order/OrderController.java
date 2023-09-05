package com.example.saashop.order;

import com.fasterxml.jackson.core.JsonProcessingException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
public class OrderController {
    private final OrderService orderService;

    public OrderController(final OrderService orderService) {
        this.orderService = orderService;
    }

    @GetMapping("/order/all")
    public List<String> listOrders() {
        return orderService.getAll();
    }

    @GetMapping("/order/{orderId}/detail")
    public OrderDetailDto orderDetail(@PathVariable String orderId) {
        return orderService.getByOrderId(orderId);
    }

    @PostMapping("/order")
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
            return orderId;
        }

        public OrderDetailDto getByOrderId(final String orderId) {
            return ddbClient.getOrder(orderId);
        }

        public List<String> getAll() {
            return ddbClient.getAll();
        }
    }

    public static final class OrderDetailDto {
        private final String orderId;
        private final String status;
        private final String orderedAt;

        public OrderDetailDto(String orderId, String status, String orderedAt) {
            this.orderId = orderId;
            this.status = status;
            this.orderedAt = orderedAt;
        }

        public String getOrderId() {
            return orderId;
        }

        public String getStatus() {
            return status;
        }

        public String getOrderedAt() {
            return orderedAt;
        }
    }
}
