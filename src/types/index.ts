export const MESSAGE_TYPES = {
  PING: 'PING',
  ANALYZE_IMAGE: 'ANALYZE_IMAGE'
} as const;

export type MessageType = (typeof MESSAGE_TYPES)[keyof typeof MESSAGE_TYPES];

type BaseRequest<TType extends MessageType, TPayload> = {
  type: TType;
  requestId: string;
  payload: TPayload;
};

export type PingRequestMessage = BaseRequest<typeof MESSAGE_TYPES.PING, Record<string, never>>;

export type AnalyzeImageRequestMessage = BaseRequest<
  typeof MESSAGE_TYPES.ANALYZE_IMAGE,
  {
    imageUrl: string;
    pageUrl: string;
  }
>;

export type RuntimeRequestMessage = PingRequestMessage | AnalyzeImageRequestMessage;

type BaseSuccessResponse<TType extends MessageType, TData> = {
  success: true;
  type: TType;
  requestId: string;
  data: TData;
};

export type PingResponseMessage = BaseSuccessResponse<typeof MESSAGE_TYPES.PING, { pong: true }>;

export type AnalyzeImageResponseMessage = BaseSuccessResponse<
  typeof MESSAGE_TYPES.ANALYZE_IMAGE,
  {
    altText: string;
    source: 'mock' | 'api';
    latencyMs: number;
  }
>;

export type RuntimeErrorCode =
  | 'INVALID_MESSAGE'
  | 'INVALID_PAYLOAD'
  | 'NETWORK_ERROR'
  | 'TIMEOUT'
  | 'SERVER_ERROR'
  | 'UNKNOWN_ERROR';

export type RuntimeErrorResponse = {
  success: false;
  type: MessageType;
  requestId: string;
  error: {
    code: RuntimeErrorCode;
    message: string;
    retryable: boolean;
  };
};

export type RuntimeResponseMessage =
  | PingResponseMessage
  | AnalyzeImageResponseMessage
  | RuntimeErrorResponse;
