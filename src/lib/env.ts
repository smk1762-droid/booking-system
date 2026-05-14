const requiredEnvVars = [
  "DATABASE_URL",
  "DIRECT_URL",
  "NEXTAUTH_SECRET",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
] as const;

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`필수 환경 변수가 설정되지 않았습니다: ${envVar}`);
  }
}

/**
 * Solapi 메시징 설정. 알림 발송이 선택적 기능이므로
 * 필수 키(SOLAPI_API_KEY/SECRET/DEFAULT_SENDER) 모두 채워졌을 때만 활성화.
 *
 * - null: 알림 비활성 (`getMessaging()`이 null 반환 → 호출자가 skip)
 * - object: 알림 활성. 카카오 PF_ID가 있으면 알림톡, 없으면 SMS만.
 */
const solapiApiKey = process.env.SOLAPI_API_KEY;
const solapiApiSecret = process.env.SOLAPI_API_SECRET;
const solapiDefaultSender = process.env.DEFAULT_SENDER;
const solapiEnabled = Boolean(solapiApiKey && solapiApiSecret && solapiDefaultSender);

export const env = {
  databaseUrl: process.env.DATABASE_URL!,
  directUrl: process.env.DIRECT_URL!,
  nextAuthSecret: process.env.NEXTAUTH_SECRET!,
  googleClientId: process.env.GOOGLE_CLIENT_ID!,
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  baseUrl: process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000",

  /** Solapi 활성 여부 (true면 알림 발송, false면 skip) */
  messagingEnabled: solapiEnabled,
  /** 카카오 알림톡 활성 여부 (false면 SMS만) */
  alimtalkEnabled: solapiEnabled && Boolean(process.env.KAKAO_PF_ID),
};
