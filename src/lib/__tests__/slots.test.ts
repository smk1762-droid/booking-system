import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { generateAvailableSlots, groupSlotsByDate, getAvailableDates } from "../slots";

function createConfig(overrides = {}) {
  return {
    slotDuration: 30,
    bufferBefore: 0,
    bufferAfter: 0,
    minNotice: 0,
    maxAdvance: 7,
    maxCapacity: 1,
    weeklyHours: [
      {
        dayOfWeek: 1, // 월요일
        isEnabled: true,
        timeSlots: [{ startTime: "09:00", endTime: "17:00" }],
      },
      {
        dayOfWeek: 2, // 화요일
        isEnabled: true,
        timeSlots: [{ startTime: "09:00", endTime: "17:00" }],
      },
      {
        dayOfWeek: 3, // 수요일
        isEnabled: true,
        timeSlots: [{ startTime: "09:00", endTime: "17:00" }],
      },
      {
        dayOfWeek: 4, // 목요일
        isEnabled: true,
        timeSlots: [{ startTime: "09:00", endTime: "17:00" }],
      },
      {
        dayOfWeek: 5, // 금요일
        isEnabled: true,
        timeSlots: [{ startTime: "09:00", endTime: "17:00" }],
      },
    ],
    dateOverrides: [],
    ...overrides,
  };
}

describe("generateAvailableSlots", () => {
  beforeEach(() => {
    // 2025-01-06 월요일 08:00 고정
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-01-06T08:00:00"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("활성화된 요일에 슬롯을 생성한다", () => {
    const config = createConfig({ minNotice: 0, maxAdvance: 1 });
    const slots = generateAvailableSlots(config, [], 30);

    expect(slots.length).toBeGreaterThan(0);
    // 모든 슬롯이 30분 간격
    for (const slot of slots) {
      const durationMs = slot.end.getTime() - slot.start.getTime();
      expect(durationMs).toBe(30 * 60 * 1000);
    }
  });

  it("비활성 요일에는 슬롯을 생성하지 않는다", () => {
    const config = createConfig({
      minNotice: 0,
      maxAdvance: 7,
      weeklyHours: [
        { dayOfWeek: 0, isEnabled: false, timeSlots: [] }, // 일요일 비활성
      ],
    });

    const sunday = new Date("2025-01-12T00:00:00"); // 일요일
    const mondayEnd = new Date("2025-01-12T23:59:59");
    const slots = generateAvailableSlots(config, [], 30, sunday, mondayEnd);
    expect(slots.length).toBe(0);
  });

  it("기존 예약과 겹치는 슬롯을 제외한다", () => {
    const config = createConfig({ minNotice: 0, maxAdvance: 1 });
    const booking = {
      startTime: new Date("2025-01-06T10:00:00"),
      endTime: new Date("2025-01-06T10:30:00"),
      status: "CONFIRMED",
    };

    const slots = generateAvailableSlots(config, [booking], 30);
    const conflicting = slots.filter(
      (s) => s.start.getTime() === new Date("2025-01-06T10:00:00").getTime()
    );
    expect(conflicting.length).toBe(0);
  });

  it("취소된 예약은 무시한다", () => {
    const config = createConfig({ minNotice: 0, maxAdvance: 1 });
    const booking = {
      startTime: new Date("2025-01-06T10:00:00"),
      endTime: new Date("2025-01-06T10:30:00"),
      status: "CANCELLED",
    };

    const slots = generateAvailableSlots(config, [booking], 30);
    const atTen = slots.filter(
      (s) => s.start.getTime() === new Date("2025-01-06T10:00:00").getTime()
    );
    expect(atTen.length).toBe(1);
  });

  it("bufferAfter를 고려하여 슬롯을 생성한다", () => {
    const config = createConfig({
      minNotice: 0,
      maxAdvance: 1,
      bufferAfter: 10,
      weeklyHours: [
        {
          dayOfWeek: 1,
          isEnabled: true,
          timeSlots: [{ startTime: "09:00", endTime: "10:00" }],
        },
      ],
    });

    // 30분 슬롯 + 10분 버퍼 = 40분 필요
    // 09:00~10:00 (60분)에서 가능한 슬롯: 09:00 (끝 09:40)
    const slots = generateAvailableSlots(config, [], 30);
    expect(slots.length).toBe(1);
    expect(slots[0].start.getHours()).toBe(9);
    expect(slots[0].start.getMinutes()).toBe(0);
  });

  it("maxCapacity가 1보다 크면 여러 예약을 허용한다", () => {
    const config = createConfig({ minNotice: 0, maxAdvance: 1, maxCapacity: 3 });
    const bookings = [
      {
        startTime: new Date("2025-01-06T10:00:00"),
        endTime: new Date("2025-01-06T10:30:00"),
        status: "CONFIRMED",
      },
    ];

    const slots = generateAvailableSlots(config, bookings, 30);
    const atTen = slots.filter(
      (s) => s.start.getTime() === new Date("2025-01-06T10:00:00").getTime()
    );
    expect(atTen.length).toBe(1);
    expect(atTen[0].available).toBe(2); // 3 - 1 = 2
    expect(atTen[0].total).toBe(3);
  });

  it("dateOverride로 특정 날짜를 비활성화한다", () => {
    const config = createConfig({
      minNotice: 0,
      maxAdvance: 7,
      dateOverrides: [
        {
          date: new Date("2025-01-07"),
          isAvailable: false,
        },
      ],
    });

    const tuesday = new Date("2025-01-07T00:00:00");
    const tuesdayEnd = new Date("2025-01-07T23:59:59");
    const slots = generateAvailableSlots(config, [], 30, tuesday, tuesdayEnd);
    expect(slots.length).toBe(0);
  });

  it("dateOverride로 특정 날짜의 시간을 변경한다", () => {
    const config = createConfig({
      minNotice: 0,
      maxAdvance: 7,
      dateOverrides: [
        {
          date: new Date("2025-01-07"),
          isAvailable: true,
          startTime: "10:00",
          endTime: "12:00",
        },
      ],
    });

    const tuesday = new Date("2025-01-07T00:00:00");
    const tuesdayEnd = new Date("2025-01-07T23:59:59");
    const slots = generateAvailableSlots(config, [], 30, tuesday, tuesdayEnd);

    // 10:00~12:00, 30분 간격 = 4슬롯 (10:00, 10:30, 11:00, 11:30)
    expect(slots.length).toBe(4);
    expect(slots[0].start.getHours()).toBe(10);
  });

  it("minNotice 이전 시간대의 슬롯을 제외한다", () => {
    // 현재 08:00, minNotice 120분 → 10:00부터 가능
    const config = createConfig({
      minNotice: 120,
      maxAdvance: 1,
      weeklyHours: [
        {
          dayOfWeek: 1,
          isEnabled: true,
          timeSlots: [{ startTime: "09:00", endTime: "12:00" }],
        },
      ],
    });

    const slots = generateAvailableSlots(config, [], 30);
    for (const slot of slots) {
      const slotTime = slot.start.getHours() * 60 + slot.start.getMinutes();
      expect(slotTime).toBeGreaterThanOrEqual(600); // 10:00 = 600분
    }
  });

  it("빈 weeklyHours에는 슬롯을 생성하지 않는다", () => {
    const config = createConfig({
      weeklyHours: [],
      dateOverrides: [],
    });

    const slots = generateAvailableSlots(config, [], 30);
    expect(slots.length).toBe(0);
  });
});

describe("groupSlotsByDate", () => {
  it("슬롯을 날짜별로 그룹핑한다", () => {
    const slots = [
      { start: new Date("2025-01-06T09:00:00"), end: new Date("2025-01-06T09:30:00"), available: 1, total: 1 },
      { start: new Date("2025-01-06T10:00:00"), end: new Date("2025-01-06T10:30:00"), available: 1, total: 1 },
      { start: new Date("2025-01-07T09:00:00"), end: new Date("2025-01-07T09:30:00"), available: 1, total: 1 },
    ];

    const grouped = groupSlotsByDate(slots);
    expect(grouped.size).toBe(2);
    expect(grouped.get("2025-01-06")?.length).toBe(2);
    expect(grouped.get("2025-01-07")?.length).toBe(1);
  });

  it("빈 배열이면 빈 Map을 반환한다", () => {
    const grouped = groupSlotsByDate([]);
    expect(grouped.size).toBe(0);
  });
});

describe("getAvailableDates", () => {
  it("정렬된 날짜 목록을 반환한다", () => {
    const slots = [
      { start: new Date("2025-01-08T09:00:00"), end: new Date("2025-01-08T09:30:00"), available: 1, total: 1 },
      { start: new Date("2025-01-06T09:00:00"), end: new Date("2025-01-06T09:30:00"), available: 1, total: 1 },
      { start: new Date("2025-01-07T09:00:00"), end: new Date("2025-01-07T09:30:00"), available: 1, total: 1 },
    ];

    const dates = getAvailableDates(slots);
    expect(dates).toEqual(["2025-01-06", "2025-01-07", "2025-01-08"]);
  });

  it("중복 날짜를 제거한다", () => {
    const slots = [
      { start: new Date("2025-01-06T09:00:00"), end: new Date("2025-01-06T09:30:00"), available: 1, total: 1 },
      { start: new Date("2025-01-06T10:00:00"), end: new Date("2025-01-06T10:30:00"), available: 1, total: 1 },
    ];

    const dates = getAvailableDates(slots);
    expect(dates).toEqual(["2025-01-06"]);
  });

  it("빈 배열이면 빈 배열을 반환한다", () => {
    expect(getAvailableDates([])).toEqual([]);
  });
});
