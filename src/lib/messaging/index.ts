/**
 * 메시징 모듈 진입점 — 서버 전용
 *
 * 환경변수(SOLAPI_*, KAKAO_PF_ID)가 설정되어 있으면 `MessagingService` 싱글톤 반환.
 * 미설정 시 `null` 반환 — 호출자가 알림 발송을 skip해야 한다.
 *
 * 클라이언트 컴포넌트에서 import 금지.
 */

import "server-only";

import { MessagingService } from "./MessagingService";
import { loadConfigFromEnv } from "./config";

let cachedService: MessagingService | null | undefined;

/**
 * Solapi 환경변수가 모두 있으면 MessagingService 싱글톤, 없으면 null.
 *
 * 알림 발송이 선택적이므로 환경변수 부재가 정상 동작이다 (개발/테스트 환경).
 */
export function getMessaging(): MessagingService | null {
  if (cachedService !== undefined) {
    return cachedService;
  }

  const config = loadConfigFromEnv();
  cachedService = config ? new MessagingService(config) : null;
  return cachedService;
}

/**
 * 테스트용 — 캐시 초기화
 */
export function __resetMessagingCacheForTest(): void {
  cachedService = undefined;
}

export { MessagingService } from "./MessagingService";
export { SmsService } from "./SmsService";
export { AlimtalkService } from "./AlimtalkService";
export { loadConfigFromEnv, validateConfig, validateKakaoConfig } from "./config";
export {
  sanitizePhoneNumber,
  isValidKoreanPhone,
  validatePhoneNumber,
  validatePhoneNumbers,
  getMessageType,
  validateMessageText,
} from "./validator";
export type {
  MessagingConfig,
  KakaoConfig,
  SmsMessage,
  AlimtalkMessage,
  SendOptions,
  SendResult,
  QueryOptions,
  MessageLog,
  MessageType,
} from "./types";
