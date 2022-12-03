export type JSONObject = any;

export interface RequestContext {
  awsRequestId: string;
  requestId: string;
  invokedFunctionArn: string;
  functionName: string;
  functionVersion: string;
  memoryLimitInMB: string;
  deadlineMs: number;
  logGroupName: string;
  _data: RequestEvent;
  token?: {
    access_token: string;
    expires_in: number;
    token_type: string;
  };
  getPayload: () => JSONObject;
}

type StringKeyObject<Value> = Record<string, Value>;
type StringMap = StringKeyObject<string>;
type MultiStringMap = StringKeyObject<string[]>;

export interface RequestEvent {
  httpMethod: string;
  headers: StringMap;
  url: string;
  params: StringMap;
  multiValueParams: MultiStringMap;
  pathParams: StringMap;
  multiValueHeaders: MultiStringMap;
  queryStringParameters: StringMap;
  multiValueQueryStringParameters: MultiStringMap;
  requestContext: {
    identity: {
      sourceIp: string;
      userAgent: string;
    };
    httpMethod: string;
    requestId: string;
    requestTime: string;
    requestTimeEpoch: number;
  };
  body: string;
  isBase64Encoded: boolean;
}

export interface FunctionResponse {
  statusCode?: number;
  body?: string;
  isBase64Encoded?: boolean;
  headers?: StringMap;
  multiValueHeaders?: MultiStringMap;
  [key: string]: any;
}

export type HandlerFunction = (
  event: RequestEvent,
  context: RequestContext
) => FunctionResponse | Promise<FunctionResponse>;
