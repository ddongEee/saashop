package com.example.saashop.order;

import com.amazonaws.services.dynamodbv2.AmazonDynamoDB;
import com.amazonaws.services.dynamodbv2.model.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;

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

    public void putItemInTableV2(final String orderId, final String message){
        HashMap<String,AttributeValue> itemValues = new HashMap<>();
        itemValues.put("orderId", new AttributeValue().withS(orderId));
        itemValues.put("message", new AttributeValue().withS(message));
        itemValues.put("datetime", new AttributeValue().withS(LocalDateTime.now().format(DateTimeFormatter.ISO_DATE_TIME)));

        PutItemRequest request = new PutItemRequest(this.tableName, itemValues);

        try {
            PutItemResult putItemResult = ddb.putItem(request);
            log.info(tableName +" was successfully updated. The request id is "+putItemResult.getSdkResponseMetadata().getRequestId());
        } catch (Exception e) {
            log.error("Error: The Amazon DynamoDB table \"{}\" can't be found.\n", tableName);
            log.error("Be sure that it exists and that you've typed its name correctly!");
        }
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

    private void listTables() {
        ListTablesResult listTablesResult = ddb.listTables();
        log.info("## list ddbTables : {}", listTablesResult.getTableNames());
    }

    private void createTable() {
        AttributeDefinition keyAttrDefinition = new AttributeDefinition("orderId", "S");
//        AttributeDefinition msgAttrDefinition = new AttributeDefinition("message", "S");

        CreateTableRequest createTableRequest = new CreateTableRequest().withTableName("aaa-bbb")
                .withKeySchema(new KeySchemaElement("orderId", "HASH"))
                .withAttributeDefinitions(keyAttrDefinition)
                .withBillingMode(BillingMode.PAY_PER_REQUEST);
        CreateTableResult createTableResult = ddb.createTable(createTableRequest);
        log.info("CreateTableResult : {}", createTableResult.getTableDescription());
    }

    public void getItemInTable(){
        HashMap<String, AttributeValue> key = new HashMap<>();
        key.put("Artist", new AttributeValue().withS("No One You Know"));
        key.put("SongTitle", new AttributeValue().withS("Scared of My Shadow"));

        GetItemRequest request = new GetItemRequest()
                .withTableName(this.tableName).withKey(key);

        try {
            System.out.println("Attempting to read the item...");
            GetItemResult result = ddb.getItem(request);
            System.out.println("GetItem succeeded: " + result);

        } catch (Exception e) {
            System.err.println("Unable to read item");
            System.err.println(e.getMessage());
        }
    }
}
