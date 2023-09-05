const LOG_CONFIG = {
  enableLogging: true, // whether enable or disable logger
  logOptions: {
    ENABLE_XRAY_TRACE_ID: true, // whether to append the trace id to the logger
    ENABLE_CALLER: true, // whether to append the function name to the logger
    CALLER_PREFIX: 'lambda:', // when 'ENABLE_CALLER' is 'true', prefix of the caller
  },
  logConst: {
    UNKNOWN: 'unknown', // string to be set when tenant context can't be identified
    LOG_CONTEXT_FROM_TOKEN_KEY: 'headers.authorization', // key value when adding the extracted context to the lambda event payload
    LOG_CONTEXT_FROM_LAMBDA_KEY: 'logContext', // key value of the JWT
    LOG_CONTEXT_FROM_SQS_KEY: 'messageAttributes.logAttributes.stringValue', // key value of the tenanat context, if it is invoked from another lambda function
    LOG_CONTEXT_FROM_ECS_KEY: 'logContext', // key value of the tenanat context, if it is triggered from SQS
    SET_CONTEXT_INTO_LAMBDA_PAYLOAD_KEY: 'logContext', // key value of the tenanat context, if it is invoked from ECS
  },
  // log format when tenant context extracted form JWT and it is appended to logger
  // configure the log format using dot notation expression
  // e.g) "<key of tenant context in JWT>": "<key to be set into logger>"
  headerLogFormat: {
    'tenant.tenantId': 'tenantContext.tenantId',
    'tenant.tenantName': 'tenantContext.tenantName',
    'tenant.plan': 'tenantContext.tier',
    'account.userId': 'userContext.userId',
    'account.gender': 'userContext.gender',
    'account.role': 'userContext.userRole',
  },
};

export default LOG_CONFIG;
