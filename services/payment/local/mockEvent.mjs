const mockEvent = {
    "event": {
      "headers": {
        "authorization": "Bearer eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJob3N0IjoiZGV2Mi5zYW1zdW5ndnguY29tIiwiYWNjb3VudCI6eyJuZXdVc2VyIjpmYWxzZSwiZW1haWwiOiJrYW5nMzQ5OEBoYW5tYWlsLm5ldCIsInVzZXJOYW1lIjoi7IOB6recIOqwlSIsInVzZXJMb2dvVXJsIjoiaHR0cHM6Ly9hcGkuc2Ftc3VuZ2Nsb3VkLmNvbTo0NDMvZGF0YS92Mi9jb20uc2Ftc3VuZy5hY2NvdW50LnByb2ZpbGVfaW1hZ2Uvc252P3M9Wm9QekQ2SGhXbVRZYnNtd3ZGMG9CM1kzLW5mM0JQYkRBUV9UbEFMaDQwdHBFYVpYOGpnRTZwRUQ2N2VVVjg3RExseFpEWDNocktWa3F2NDh5NDJjNW9BczRWaDF0N0JxbDQyc3kxS2dqak5mQ3RfZEFVWUpyeEdyMThVSUxGTDd1MU84ZDg2WU5vVHJOV1IxWjJvUFZJZlFnOVFqTEI3cURLWXU0NnZRWDBsZl84MHpJa3psbGczU29pOE1YaERfZ3lfNG8tZEFnTVRraWJjV3A1TU1OUFRrUS1raEx1Z0JodU40UGExTVVjMERkaFVLSjlOQzVfUElTLWI3WWdXazlfaUtyeHdkQWRjX3l1NktwbFBFcDVOVkdjclBVcnNUTkNQdk5sZlZJQXcmdj03NDg3MDgxMDAiLCJ1c2VySWQiOiIwQzQ2ODRCMS1BNzdGLTRCNzMtODk3My05ODc5NzFFNEIzMDciLCJ1c2VyU3RhdHVzIjoicmVnaXN0ZXJlZCIsImlzU3VwZXJBZG1pbiI6ZmFsc2UsInVzZXJNZXRhSWQiOiJCNEM0NkNBMi03NTlCLTQ4MEUtOENDNy1FMUUyMTE1NTI4RjUiLCJkYXRlRm9ybWF0IjoiWVlZWS1NTS1ERCIsImZpcnN0RGF5T2ZXZWVrIjoiTU9OIiwidGltZUZvcm1hdCI6IjEyaCIsImlzRnJlZVRyaWFsIjpmYWxzZSwibGFuZ3VhZ2UiOiJlbiIsInVzZXJMb2dVcmwiOiJodHRwczovL2FwaS5zYW1zdW5nY2xvdWQuY29tOjQ0My9kYXRhL3YyL2NvbS5zYW1zdW5nLmFjY291bnQucHJvZmlsZV9pbWFnZS9zbnY_cz1ab1B6RDZIaFdtVFlic213dkYwb0IzWTMtbmYzQlBiREFRX1RsQUxoNDB0cEVhWlg4amdFNnBFRDY3ZVVWODdETGx4WkRYM2hyS1ZrcXY0OHk0MmM1b0FzNFZoMXQ3QnFsNDJzeTFLZ2pqTmZDdF9kQVVZSnJ4R3IxOFVJTEZMN3UxTzhkODZZTm9Uck5XUjFaMm9QVklmUWc5UWpMQjdxREtZdTQ2dlFYMGxmXzgweklremxsZzNTb2k4TVhoRF9neV80by1kQWdNVGtpYmNXcDVNTU5QVGtRLWtoTHVnQmh1TjRQYTFNVWMwRGRoVUtKOU5DNV9QSVMtYjdZZ1drOV9pS3J4d2RBZGNfeXU2S3BsUEVwNU5WR2NyUFVyc1ROQ1B2TmxmVklBdyZ2PTc0ODcwODEwMCJ9LCJ1c2VySW5mbyI6eyJzdWIiOiJ6dW5vYmp2bTVzIiwiZmlyc3ROYW1lIjoi7IOB6recIiwibGFzdE5hbWUiOiLqsJUiLCJwaWN0dXJlIjoiaHR0cHM6Ly9hcGkuc2Ftc3VuZ2Nsb3VkLmNvbTo0NDMvZGF0YS92Mi9jb20uc2Ftc3VuZy5hY2NvdW50LnByb2ZpbGVfaW1hZ2Uvc252P3M9Wm9QekQ2SGhXbVRZYnNtd3ZGMG9CM1kzLW5mM0JQYkRBUV9UbEFMaDQwdHBFYVpYOGpnRTZwRUQ2N2VVVjg3RExseFpEWDNocktWa3F2NDh5NDJjNW9BczRWaDF0N0JxbDQyc3kxS2dqak5mQ3RfZEFVWUpyeEdyMThVSUxGTDd1MU84ZDg2WU5vVHJOV1IxWjJvUFZJZlFnOVFqTEI3cURLWXU0NnZRWDBsZl84MHpJa3psbGczU29pOE1YaERfZ3lfNG8tZEFnTVRraWJjV3A1TU1OUFRrUS1raEx1Z0JodU40UGExTVVjMERkaFVLSjlOQzVfUElTLWI3WWdXazlfaUtyeHdkQWRjX3l1NktwbFBFcDVOVkdjclBVcnNUTkNQdk5sZlZJQXcmdj03NDg3MDgxMDAifSwiY29udGFjdEluZm8iOnsiY29udGFjdE5hbWUiOm51bGwsImNvbnRhY3RFbWFpbCI6bnVsbCwiY29udGFjdFBob25lTnVtYmVyIjpudWxsfSwib3JnYW5pemF0aW9ucyI6W3sib3JnYW5pemF0aW9uSWQiOiIzMzE2NDhGOC1GNDE5LTQwMjktQjU1MC1GNURBREQzMkNCOUUiLCJvcmdhbml6YXRpb25OYW1lIjoiVlhULUFXUy1Qcm9zZXJ2aWNlIiwib3JnYW5pemF0aW9uU3RhdHVzIjoiYWRkZWQiLCJyb2xlSWQiOm51bGx9XSwibGFzdFBsYWNlIjp7InBsYWNlSWQiOiJFRDgyNDg5Ni05QzY0LTREQ0QtQjg4My0xRDgzQjVFODc4MkIiLCJwbGFjZU5hbWUiOiJEZWZhdWx0IFdvcmtzcGFjZSIsInJvbGVJZCI6IlJPTEVfQURNSU4iLCJzdWJzY3JpcHRpb25zIjpbeyJpc0V4cGlyZWQiOmZhbHNlLCJzdWJzY3JpcHRpb25JZCI6IjYyQTRCOUM2LURCQkYtNENCMC05NERCLTYyQTRCOUM2N0U2RSIsImRldmljZVF1b3RhIjoxMDAwMDAwLCJwbGFuVHlwZSI6IlRSSUFMIn1dfSwidG9rZW5UeXBlIjoidXNlciIsImlhdCI6MTY4ODUxNDEyOSwiZXhwIjoxNjg4NjAwNTI5LCJpc3MiOiJWWFRDbG91ZCJ9.0mXtmBQb7TnNHnbsVvJ0gJxO1H9ABEm2sN2uBGyhucPl2sfgI08ic02axAfjipQTs8RX5W-IfNvmqOn1auExFA"
      },
      "orderId": "order-000",
      "Records": [
        {
          "messageId": "093e94a4-63d4-4a77-a70f-9ed037bf6a8b",
          "receiptHandle":"AQEBp8nsJPRjjvyX1Z/5ire0j5bt6FOTYT6wAV0vjIDK5fuXyKzmUs4VZZS0k7nHqQjwoTFSOcw9CrHE13+NrBTITiHrN9fUi+huk8olc6f+Hs9Uiq4bSGbDiieDo+v3k2kSYC/8gia1RpjJOPF1zOzza9gm1M7WM7T9s79Pyn3OX8FN/UB1/njgApWrZei05Uu6+9xl9QgHCsQCk0rEKYwsbTYIGcafYUJJ9yz87VY59ubEybdpaXv8XOOjf4aFQLHBfTz2Pv5sY6z+C63tQ7YQrp/Ht27ekiog2IKzhkUGy+N85kFIZ6ekIdjPPIUAVKcFAnVRlUSldtmJsQk5tjxyL+f2LzPoGXRTXyVsixxtjm7KQMFoBH59u070Si8/2ayYTAJbe145yR+3wIXw3xwJ3w==",
          "body": "test",
          "attributes": {
            "ApproximateReceiveCount": "1",
            "AWSTraceHeader": "Root=1-649ed9ed-70a9ee2758e38d3d705268e4;Parent=cc491f946f406af4;Sampled=0",
            "SentTimestamp": "1688132077589",
            "SenderId": "AROAYNCSDB2RLL3QNRFJP:5k-saas-lambda-demo",
            "ApproximateFirstReceiveTimestamp": "1688132077591",
          },
          "messageAttributes": {
            "logContext": {
              "stringValue": "{'tenantContext':{'organizationId':'EA003DC7-C155-431D-876E-EDF37CBBCCB0','businessType':'it','organizationName':'prsv-kr','industry':'entertain','country':'USA'},'userContext':{'userId':'C75D6EE0-8FE9-4918-8EEA-1DC382521771','roldId':{'aaa':{'bbb':{'ccc':'unknown'}}},'roldId2:'unknown'},'traceId':'unknown'}",
              "stringListValues": [],
              "binaryListValues": [],
              "dataType": "String",
            },
          },
          "md5OfBody": "9f9ddc66766d1a30e4e1ee505da1c2a9",
          "md5OfMessageAttributes": "b6a0090840931ec4181201ed5f2b82a4",
          "eventSource": "aws:sqs",
          "eventSourceARN": "arn:aws:sqs:us-east-1:577845268130:ksuyeon-test",
          "awsRegion": "us-east-1",
        },
      ],
    },
    "context": {
        "functionName": "test-function",
    },
  };
  
  export default mockEvent;
  