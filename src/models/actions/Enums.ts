export enum ActionTypeEnum {
  request = 'request',
  response = 'response',
}

export enum OperatorEnum {
  equal = "equal",
  notEqual = "not-equal",
  greaterThan = "greater-than",
  greaterThanEqual = "greater-than-equal",
  lessThan = "less-than",
  lessThanEqual = "less-than-equal",
  contains = "contains",
  regex = "regex",
}

export enum RequestDataSourceEnum {
  url = "url",
  method = "method",
  headers = "headers",
  body = "body"
}

export enum ResponseDataSourceEnum {
  url = "url",
  status = "status",
  headers = "headers",
  body = "body"
}
