/**
 * 메시징 서비스 설정
 */
export interface MessagingConfig {
  apiKey: string;
  apiSecret: string;
  defaultSender: string;
  kakao?: KakaoConfig;
}

/**
 * 카카오 알림톡 설정
 */
export interface KakaoConfig {
  pfId: string;
  templatePrefix?: string;
}

/**
 * SMS/LMS 메시지
 */
export interface SmsMessage {
  to: string;
  from?: string;
  text: string;
  subject?: string;
}

/**
 * 알림톡 메시지
 */
export interface AlimtalkMessage {
  to: string;
  from?: string;
  templateId: string;
  variables?: Record<string, string>;
  disableSms?: boolean;
}

/**
 * 발송 옵션
 */
export interface SendOptions {
  scheduledDate?: string;
  allowDuplicates?: boolean;
}

/**
 * 발송 결과
 */
export interface SendResult {
  success: boolean;
  messageId?: string;
  groupId?: string;
  to: string;
  statusCode?: string;
  statusMessage?: string;
}

/**
 * 메시지 조회 옵션
 */
export interface QueryOptions {
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

/**
 * 메시지 로그
 */
export interface MessageLog {
  messageId: string;
  to: string;
  from: string;
  type: MessageType;
  status: string;
  statusMessage?: string;
  sentAt?: string;
  createdAt: string;
}

/**
 * 메시지 타입
 */
export type MessageType = "SMS" | "LMS" | "MMS" | "ATA" | "CTA";

/**
 * Solapi 발송 요청 타입 (내부용)
 */
export interface SolapiSendRequest {
  to: string;
  from: string;
  text?: string;
  subject?: string;
  kakaoOptions?: {
    pfId: string;
    templateId: string;
    variables?: Record<string, string>;
    disableSms?: boolean;
  };
}

/**
 * Solapi 발송 응답 (외부 SDK 응답의 일부)
 */
export interface SolapiSingleResponse {
  groupId?: string;
  messageId?: string;
  statusCode?: string;
  statusMessage?: string;
}

/**
 * Solapi 실패 메시지 형태
 */
export interface SolapiFailedMessage {
  to: string;
  statusCode?: string;
  statusMessage?: string;
}

/**
 * Solapi 대량 발송 응답 (외부 SDK 응답의 일부)
 */
export interface SolapiBulkResponse {
  groupId?: string;
  failedMessageList?: SolapiFailedMessage[];
}

/**
 * Solapi 메시지 조회 응답 항목 (외부 SDK)
 */
export interface SolapiMessageItem {
  messageId: string;
  to: string;
  from: string;
  type: MessageType;
  statusCode: string;
  statusMessage?: string;
  sentAt?: string;
  createdAt: string;
}
