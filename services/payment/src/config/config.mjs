const LOG_CONFIG = {
    enableLogging: true,
    logOptions: {
      ENABLE_XRAY_TRACE_ID: true,
      ENABLE_CALLER: true,
      CALLER_PREFIX: "lambda:"
    },
    logConst: {
      UNKNOWN: "unknown",
      LOG_CONTEXT_FROM_TOKEN_KEY: "headers.authorization",
      LOG_CONTEXT_FROM_LAMBDA_KEY: "_logContext",
      LOG_CONTEXT_FROM_SQS_KEY: "messageAttributes.logAttributes.stringValue",
      LOG_CONTEXT_FROM_ECS_KEY: "_logContext",
      SET_CONTEXT_INTO_LAMBDA_PAYLOAD_KEY: "_logContext"
    },
    headerLogFormat: {
    //   "tenant.id": "tenantContext.tenantId",
    //   "tenant.name": "tenantContext.tenantName",
    //   "tenant.tier": "tenantContext.tier",
    //   "user.userId": "userContext.userId",
    //   "user.gender": "userContext.gender",
    //   "user.role": "userContext.userRole",
    //   "user.country": "userContext.country",
        "organizations[0].organizationId": "tenantContext.tenantId",
        "organizations[0].organizationName": "tenantContext.tenantName",
        "account.userId": "userContext.userId",
        "user.gender": "userContext.gender",
        "lastPlace.roleId": "userContext.userRole"
    }
  }
    
  export default LOG_CONFIG;
    