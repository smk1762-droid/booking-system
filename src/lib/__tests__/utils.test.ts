import { describe, it, expect } from "vitest";
import {
  cn,
  formatDate,
  formatTime,
  formatDateTime,
  formatDuration,
  generateSlug,
  parseTimeString,
  timeStringToMinutes,
  minutesToTimeString,
  getDayOfWeekName,
  getKoreanDayName,
} from "../utils";

describe("cn", () => {
  it("단일 클래스를 반환한다", () => {
    expect(cn("text-red-500")).toBe("text-red-500");
  });

  it("여러 클래스를 병합한다", () => {
    expect(cn("px-2", "py-1")).toBe("px-2 py-1");
  });

  it("충돌하는 Tailwind 클래스를 올바르게 병합한다", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
  });

  it("falsy 값을 무시한다", () => {
    expect(cn("px-2", false && "hidden", undefined, null)).toBe("px-2");
  });

  it("조건부 클래스를 처리한다", () => {
    const isActive = true;
    expect(cn("base", isActive && "active")).toBe("base active");
  });
});

describe("formatDate", () => {
  it("Date 객체를 한국어 날짜로 포맷한다", () => {
    const date = new Date("2025-01-15T00:00:00");
    const result = formatDate(date);
    expect(result).toContain("2025");
    expect(result).toContain("1");
    expect(result).toContain("15");
  });

  it("문자열 날짜를 처리한다", () => {
    const result = formatDate("2025-03-20T00:00:00");
    expect(result).toContain("2025");
    expect(result).toContain("3");
    expect(result).toContain("20");
  });

  it("커스텀 옵션을 적용한다", () => {
    const result = formatDate(new Date("2025-01-15"), { weekday: "long" });
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });
});

describe("formatTime", () => {
  it("Date 객체를 한국어 시간으로 포맷한다", () => {
    const date = new Date("2025-01-15T14:30:00");
    const result = formatTime(date);
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });

  it("문자열 날짜를 처리한다", () => {
    const result = formatTime("2025-01-15T09:00:00");
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });
});

describe("formatDateTime", () => {
  it("날짜와 시간을 결합한다", () => {
    const date = new Date("2025-01-15T14:30:00");
    const result = formatDateTime(date);
    expect(result).toContain(formatDate(date));
    expect(result).toContain(formatTime(date));
  });

  it("문자열 입력을 처리한다", () => {
    const result = formatDateTime("2025-01-15T14:30:00");
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });
});

describe("formatDuration", () => {
  it("60분 미만은 분으로 표시한다", () => {
    expect(formatDuration(30)).toBe("30분");
    expect(formatDuration(1)).toBe("1분");
    expect(formatDuration(59)).toBe("59분");
  });

  it("정확히 60분은 시간으로 표시한다", () => {
    expect(formatDuration(60)).toBe("1시간");
  });

  it("시간 단위로 나누어 떨어지면 시간만 표시한다", () => {
    expect(formatDuration(120)).toBe("2시간");
    expect(formatDuration(180)).toBe("3시간");
  });

  it("시간+분 조합을 올바르게 표시한다", () => {
    expect(formatDuration(90)).toBe("1시간 30분");
    expect(formatDuration(150)).toBe("2시간 30분");
    expect(formatDuration(75)).toBe("1시간 15분");
  });
});

describe("generateSlug", () => {
  it("영문을 소문자로 변환한다", () => {
    expect(generateSlug("Hello World")).toBe("hello-world");
  });

  it("공백을 하이픈으로 변환한다", () => {
    expect(generateSlug("my business")).toBe("my-business");
  });

  it("연속 하이픈을 하나로 줄인다", () => {
    expect(generateSlug("hello   world")).toBe("hello-world");
  });

  it("특수문자를 제거한다", () => {
    expect(generateSlug("hello@world!")).toBe("helloworld");
  });

  it("한글을 유지한다", () => {
    expect(generateSlug("미용실")).toBe("미용실");
  });

  it("한글과 영문 혼합을 처리한다", () => {
    expect(generateSlug("서울 hair salon")).toBe("서울-hair-salon");
  });
});

describe("parseTimeString", () => {
  it("시간 문자열을 파싱한다", () => {
    expect(parseTimeString("09:30")).toEqual({ hours: 9, minutes: 30 });
  });

  it("자정을 파싱한다", () => {
    expect(parseTimeString("00:00")).toEqual({ hours: 0, minutes: 0 });
  });

  it("23:59를 파싱한다", () => {
    expect(parseTimeString("23:59")).toEqual({ hours: 23, minutes: 59 });
  });
});

describe("timeStringToMinutes", () => {
  it("시간 문자열을 분으로 변환한다", () => {
    expect(timeStringToMinutes("09:30")).toBe(570);
    expect(timeStringToMinutes("00:00")).toBe(0);
    expect(timeStringToMinutes("23:59")).toBe(1439);
    expect(timeStringToMinutes("12:00")).toBe(720);
  });
});

describe("minutesToTimeString", () => {
  it("분을 시간 문자열로 변환한다", () => {
    expect(minutesToTimeString(570)).toBe("09:30");
    expect(minutesToTimeString(0)).toBe("00:00");
    expect(minutesToTimeString(1439)).toBe("23:59");
    expect(minutesToTimeString(720)).toBe("12:00");
  });

  it("한 자리 시간/분에 패딩을 추가한다", () => {
    expect(minutesToTimeString(65)).toBe("01:05");
  });
});

describe("getDayOfWeekName", () => {
  it("요일 약어를 반환한다", () => {
    expect(getDayOfWeekName(0)).toBe("일");
    expect(getDayOfWeekName(1)).toBe("월");
    expect(getDayOfWeekName(2)).toBe("화");
    expect(getDayOfWeekName(3)).toBe("수");
    expect(getDayOfWeekName(4)).toBe("목");
    expect(getDayOfWeekName(5)).toBe("금");
    expect(getDayOfWeekName(6)).toBe("토");
  });
});

describe("getKoreanDayName", () => {
  it("요일 전체 이름을 반환한다", () => {
    expect(getKoreanDayName(0)).toBe("일요일");
    expect(getKoreanDayName(1)).toBe("월요일");
    expect(getKoreanDayName(2)).toBe("화요일");
    expect(getKoreanDayName(3)).toBe("수요일");
    expect(getKoreanDayName(4)).toBe("목요일");
    expect(getKoreanDayName(5)).toBe("금요일");
    expect(getKoreanDayName(6)).toBe("토요일");
  });
});
