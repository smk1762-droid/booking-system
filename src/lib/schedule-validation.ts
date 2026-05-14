/**
 * 스케줄 관련 입력 검증 유틸 + 상수.
 * 사장님 스케줄 API와 손님 예약 라우트에서 공통으로 사용.
 */

/**
 * 토큰 만료 기본값 (시간).
 * 사장님이 스케줄에서 별도 설정하지 않거나 schedule 자체가 없는 극단 케이스의 폴백.
 */
export const DEFAULT_TOKEN_EXPIRY_HOURS = 24;

/**
 * tokenExpiryHours === 0(무제한)일 때 사용하는 sentinel `Date`.
 * 사실상 영구 유효. confirm/cancel 라우트의 `tokenExpiresAt: { gt: now }` 비교에서
 * 항상 통과한다. PostgreSQL TIMESTAMP 범위(4713 BC ~ 294276 AD) 안.
 */
export const TOKEN_EXPIRY_NEVER = new Date("9999-12-31T23:59:59Z");

/**
 * tokenExpiryHours 검증.
 * - 0 = 만료 없음(영구 링크)
 * - 1~720 = N시간 후 만료 (최대 30일)
 * - 음수 / 721+ / 비정수 / 비숫자 → null 반환 (호출자가 400 처리)
 *
 * DB CHECK 제약(`Schedule_tokenExpiryHours_range_check`)과 일치 유지.
 */
export function validateTokenExpiryHours(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isInteger(value)) return null;
  if (value < 0 || value > 720) return null;
  return value;
}
