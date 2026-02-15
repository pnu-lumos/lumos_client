export const MESSAGE_TYPES = {
  PING: 'PING',
  ANALYZE_IMAGE: 'ANALYZE_IMAGE'
} as const;

export interface AnalyzeImageRequestMessage {
  type: typeof MESSAGE_TYPES.ANALYZE_IMAGE;
  payload: {
    imageUrl: string;
    pageUrl: string;
  };
}

export interface PingRequestMessage {
  type: typeof MESSAGE_TYPES.PING;
}

export type RuntimeRequestMessage = AnalyzeImageRequestMessage | PingRequestMessage;

export interface RuntimeSuccessResponse {
  success: true;
  data?: {
    altText?: string;
    pong?: true;
  };
}

export interface RuntimeErrorResponse {
  success: false;
  error: string;
}

export type RuntimeResponseMessage = RuntimeSuccessResponse | RuntimeErrorResponse;
