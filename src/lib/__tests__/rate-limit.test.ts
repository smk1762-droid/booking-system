import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { checkRateLimit, getClientIp, RATE_LIMITS } from "../rate-limit";

describe("checkRateLimit", () => {
  beforeEach(() => {
    // 내부 캐시 초기화를 위해 만료된 키 사용
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("첫 번째 요청은 성공한다", () => {
    const result = checkRateLimit("test-first", 5, 60000);
    expect(result.success).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it("제한 내 요청은 모두 성공한다", () => {
    const key = "test-within-limit";
    for (let i = 0; i < 5; i++) {
      const result = checkRateLimit(key, 5, 60000);
      expect(result.success).toBe(true);
      expect(result.remaining).toBe(4 - i);
    }
  });

  it("제한 초과 시 실패한다", () => {
    const key = "test-exceeded";
    for (let i = 0; i < 5; i++) {
      checkRateLimit(key, 5, 60000);
    }
    const result = checkRateLimit(key, 5, 60000);
    expect(result.success).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("cleanup이 만료된 엔트리를 제거한다", () => {
    const key = "test-cleanup";
    checkRateLimit(key, 5, 500);

    // 윈도우 만료 + cleanup 간격 경과
    vi.advanceTimersByTime(61000);

    // 다음 호출 시 cleanup이 실행되며 새 엔트리 생성
    const result = checkRateLimit(key, 5, 500);
    expect(result.success).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it("윈도우 만료 후 리셋된다", () => {
    const key = "test-reset";
    for (let i = 0; i < 5; i++) {
      checkRateLimit(key, 5, 1000);
    }

    // 제한 초과
    const exceeded = checkRateLimit(key, 5, 1000);
    expect(exceeded.success).toBe(false);

    // 윈도우 만료
    vi.advanceTimersByTime(1001);

    const result = checkRateLimit(key, 5, 1000);
    expect(result.success).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it("resetAt 시간을 올바르게 반환한다", () => {
    const now = Date.now();
    const result = checkRateLimit("test-reset-at", 5, 60000);
    expect(result.resetAt).toBeGreaterThanOrEqual(now + 60000);
  });

  it("서로 다른 키는 독립적으로 동작한다", () => {
    for (let i = 0; i < 5; i++) {
      checkRateLimit("key-a", 5, 60000);
    }
    const resultA = checkRateLimit("key-a", 5, 60000);
    expect(resultA.success).toBe(false);

    const resultB = checkRateLimit("key-b", 5, 60000);
    expect(resultB.success).toBe(true);
  });
});

describe("getClientIp", () => {
  it("x-forwarded-for 헤더에서 IP를 추출한다", () => {
    const request = new Request("http://localhost", {
      headers: { "x-forwarded-for": "1.2.3.4, 5.6.7.8" },
    });
    expect(getClientIp(request)).toBe("1.2.3.4");
  });

  it("x-real-ip 헤더에서 IP를 추출한다", () => {
    const request = new Request("http://localhost", {
      headers: { "x-real-ip": "1.2.3.4" },
    });
    expect(getClientIp(request)).toBe("1.2.3.4");
  });

  it("헤더가 없으면 unknown을 반환한다", () => {
    const request = new Request("http://localhost");
    expect(getClientIp(request)).toBe("unknown");
  });

  it("x-forwarded-for의 첫 번째 IP를 트림한다", () => {
    const request = new Request("http://localhost", {
      headers: { "x-forwarded-for": "  1.2.3.4 , 5.6.7.8" },
    });
    expect(getClientIp(request)).toBe("1.2.3.4");
  });
});

describe("RATE_LIMITS", () => {
  it("올바른 설정값을 가진다", () => {
    expect(RATE_LIMITS.bookingCreate.limit).toBe(10);
    expect(RATE_LIMITS.bookingCreate.windowMs).toBe(60000);
    expect(RATE_LIMITS.slotQuery.limit).toBe(30);
    expect(RATE_LIMITS.tokenAction.limit).toBe(5);
    expect(RATE_LIMITS.publicRead.limit).toBe(60);
  });
});
