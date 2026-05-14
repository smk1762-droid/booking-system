-- 2026-05-15 Schedule.tokenExpiryHours 추가
-- 사장님이 확정/취소 알림톡 링크의 유효 시간을 직접 설정할 수 있게 한다.
-- 단위: 시간. 0 = 만료 없음(영구 링크), 최대 720h(=30일).
-- 기본값 24로 백필하여 기존 운영 동작 유지.
--
-- Supabase SQL Editor 또는 psql로 운영 DB에 적용:
--   psql $DATABASE_URL -f prisma/migrations/2026-05-15_schedule_token_expiry.sql

ALTER TABLE "Schedule"
  ADD COLUMN IF NOT EXISTS "tokenExpiryHours" INTEGER NOT NULL DEFAULT 24;

-- 안전 검증: 1~720 범위와 0(무제한)만 허용. 음수·721 이상 금지.
ALTER TABLE "Schedule"
  ADD CONSTRAINT "Schedule_tokenExpiryHours_range_check"
  CHECK ("tokenExpiryHours" >= 0 AND "tokenExpiryHours" <= 720);
