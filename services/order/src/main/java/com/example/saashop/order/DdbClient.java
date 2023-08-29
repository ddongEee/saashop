package com.example.saashop.order;

import com.amazonaws.services.dynamodbv2.AmazonDynamoDB;
import com.amazonaws.services.dynamodbv2.model.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Component
public class DdbClient {
    private final Logger log = LoggerFactory.getLogger(getClass());
    private final AmazonDynamoDB ddb;
    private final String tableName;

    public DdbClient(AmazonDynamoDB amazonDynamoDB,
                     @Value("${cloud.aws.ddb.table-name}") String tableName) {
        this.ddb = amazonDynamoDB;
        this.tableName = tableName;
    }

    public OrderController.OrderDetailDto getOrder(final String orderId) {
        HashMap<String,AttributeValue> key = new HashMap<>();
        key.put("orderId", new AttributeValue().withS(orderId));
        GetItemRequest getItemRequest = new GetItemRequest(this.tableName, key);
        GetItemResult item = ddb.getItem(getItemRequest);
        Map<String, AttributeValue> itemMap = item.getItem();
        String savedOrderId = itemMap.get("orderId").getS();
        AttributeValue attributeValue = itemMap.get("event").getL().get(0).getM().get("ORDERED");
        String createdAt = attributeValue.getS();
        return new OrderController.OrderDetailDto(savedOrderId, "ORDERED", createdAt);
    }

    public void putItemInTable(final String orderId, final String state){
        final String datetime = LocalDateTime.now().format(DateTimeFormatter.ISO_DATE_TIME);
        HashMap<String,AttributeValue> key = new HashMap<>();
        key.put("orderId", new AttributeValue().withS(orderId));
        HashMap<String,AttributeValueUpdate> itemValues = new HashMap<>();
        itemValues.put("lastUpdatedAt", new AttributeValueUpdate().withValue(new AttributeValue().withS(datetime)).withAction(AttributeAction.PUT));
        AttributeValue event = new AttributeValue().addMEntry(state, new AttributeValue().withS(datetime));
        itemValues.put("event", new AttributeValueUpdate().withValue(new AttributeValue().withL(event)).withAction(AttributeAction.ADD));

        UpdateItemRequest request = new UpdateItemRequest(this.tableName, key, itemValues, ReturnValue.ALL_NEW);

        try {
            UpdateItemResult result = ddb.updateItem(request);
            log.info(tableName +" was successfully updated. The request id is "+ result.getSdkResponseMetadata().getRequestId());
        } catch (Exception e) {
            log.error("Error: The Amazon DynamoDB table \"{}\" can't be found.\n", tableName);
            log.error("Be sure that it exists and that you've typed its name correctly!");
        }
    }

    public List<String> getAll() {
        ScanRequest request = new ScanRequest(this.tableName);
        ScanResult result = ddb.scan(request);
        return result.getItems().stream()
                .map(i -> i.get("orderId").getS())
                .collect(Collectors.toList());
    }
}
