import "server-only";

import type { MessagingConfig, KakaoConfig } from "./types";

/**
 * 환경변수에서 Solapi 설정 로드
 * - 필수 키(SOLAPI_API_KEY/SECRET, DEFAULT_SENDER) 누락 → null 반환 (호출자가 skip)
 * - 카카오 설정(KAKAO_PF_ID)이 있으면 kakao 추가
 */
export function loadConfigFromEnv(): MessagingConfig | null {
  const apiKey = process.env.SOLAPI_API_KEY;
  const apiSecret = process.env.SOLAPI_API_SECRET;
  const defaultSender = process.env.DEFAULT_SENDER;

  if (!apiKey || !apiSecret || !defaultSender) {
    return null;
  }

  const config: MessagingConfig = {
    apiKey,
    apiSecret,
    defaultSender,
  };

  const pfId = process.env.KAKAO_PF_ID;
  if (pfId) {
    config.kakao = {
      pfId,
      templatePrefix: process.env.KAKAO_TEMPLATE_PREFIX,
    };
  }

  return config;
}

/**
 * 설정 유효성 검사 (생성자에서 호출)
 */
export function validateConfig(config: MessagingConfig): void {
  if (!config.apiKey || config.apiKey.trim() === "") {
    throw new Error("API Key is required");
  }
  if (!config.apiSecret || config.apiSecret.trim() === "") {
    throw new Error("API Secret is required");
  }
  if (!config.defaultSender || config.defaultSender.trim() === "") {
    throw new Error("Default sender number is required");
  }
}

/**
 * 카카오 설정 유효성 검사 (알림톡 발송 직전 호출)
 */
export function validateKakaoConfig(kakao?: KakaoConfig): void {
  if (!kakao) {
    throw new Error("Kakao configuration is required for Alimtalk");
  }
  if (!kakao.pfId || kakao.pfId.trim() === "") {
    throw new Error("Kakao pfId is required");
  }
}
