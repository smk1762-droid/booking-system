"use client";

import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format, addDays, startOfDay, isSameDay, isSameMonth, startOfMonth, addMonths } from "date-fns";
import { ko } from "date-fns/locale";
import { useHorizontalScroll } from "@/hooks";
import { cn } from "@/lib/utils";

interface DatePickerNaverProps {
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
  // 날짜별 예약 가능 여부 (optional)
  availabilityMap?: Record<string, { available: boolean; slots?: number }>;
  // 표시할 일수 (기본 60일)
  daysToShow?: number;
  // 최소 예약 가능일 (오늘로부터 n일 후)
  minDaysAhead?: number;
}

export function DatePickerNaver({
  selectedDate,
  onSelectDate,
  availabilityMap = {},
  daysToShow = 60,
  minDaysAhead = 0,
}: DatePickerNaverProps) {
  const today = startOfDay(new Date());
  const [currentMonth, setCurrentMonth] = useState(today);

  const { containerRef, canScrollLeft, canScrollRight, scrollBy } = useHorizontalScroll({
    sensitivity: 1.2,
    momentum: true,
  });

  // 날짜 목록 생성
  const dates = useMemo(() => {
    const result: Date[] = [];
    const startDate = addDays(today, minDaysAhead);
    for (let i = 0; i < daysToShow; i++) {
      result.push(addDays(startDate, i));
    }
    return result;
  }, [today, daysToShow, minDaysAhead]);

  // 월별 그룹화
  const monthGroups = useMemo(() => {
    const groups: { month: Date; dates: Date[] }[] = [];
    let currentGroup: { month: Date; dates: Date[] } | null = null;

    for (const date of dates) {
      const monthStart = startOfMonth(date);
      if (!currentGroup || !isSameMonth(currentGroup.month, monthStart)) {
        currentGroup = { month: monthStart, dates: [] };
        groups.push(currentGroup);
      }
      currentGroup.dates.push(date);
    }

    return groups;
  }, [dates]);

  const handlePrevMonth = () => {
    setCurrentMonth((prev) => addMonths(prev, -1));
    scrollBy(-200);
  };

  const handleNextMonth = () => {
    setCurrentMonth((prev) => addMonths(prev, 1));
    scrollBy(200);
  };

  const getDateStatus = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    const availability = availabilityMap[dateStr];

    if (availability) {
      return availability.available ? "available" : "unavailable";
    }
    // 기본적으로 예약 가능으로 표시 (실제로는 API에서 확인)
    return "available";
  };

  return (
    <div className="w-full">
      {/* 월 네비게이션 */}
      <div className="flex items-center justify-between mb-4 px-1">
        <button
          type="button"
          onClick={handlePrevMonth}
          disabled={!canScrollLeft}
          className={cn(
            "p-2 rounded-full transition-colors",
            canScrollLeft
              ? "hover:bg-gray-100 text-gray-700"
              : "text-gray-300 cursor-not-allowed"
          )}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <h3 className="text-lg font-semibold text-gray-900">
          {format(currentMonth, "yyyy년 M월", { locale: ko })}
        </h3>

        <button
          type="button"
          onClick={handleNextMonth}
          disabled={!canScrollRight}
          className={cn(
            "p-2 rounded-full transition-colors",
            canScrollRight
              ? "hover:bg-gray-100 text-gray-700"
              : "text-gray-300 cursor-not-allowed"
          )}
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* 날짜 카드 스크롤 영역 */}
      <div
        ref={containerRef}
        className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 cursor-grab active:cursor-grabbing"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {monthGroups.map((group) => (
          <div key={group.month.toISOString()} className="flex gap-2">
            {/* 월 구분선 (첫 번째 그룹 제외) */}
            {!isSameMonth(group.month, monthGroups[0].month) && (
              <div className="flex flex-col items-center justify-center px-2 min-w-[40px]">
                <div className="text-xs text-gray-400 font-medium">
                  {format(group.month, "M월", { locale: ko })}
                </div>
                <div className="w-px h-8 bg-gray-200 mt-1" />
              </div>
            )}

            {group.dates.map((date) => {
              const dateStr = format(date, "yyyy-MM-dd");
              const isSelected = selectedDate === dateStr;
              const isToday = isSameDay(date, today);
              const dayOfWeek = date.getDay();
              const isSunday = dayOfWeek === 0;
              const isSaturday = dayOfWeek === 6;
              const status = getDateStatus(date);
              const isUnavailable = status === "unavailable";

              return (
                <button
                  key={dateStr}
                  type="button"
                  onClick={() => !isUnavailable && onSelectDate(dateStr)}
                  disabled={isUnavailable}
                  className={cn(
                    "flex flex-col items-center justify-center min-w-[56px] h-[72px] rounded-xl transition-all",
                    "border-2",
                    isSelected
                      ? "bg-blue-600 border-blue-600 text-white shadow-lg scale-105"
                      : isUnavailable
                      ? "bg-gray-50 border-gray-100 cursor-not-allowed"
                      : "bg-white border-gray-200 hover:border-blue-400 hover:bg-blue-50",
                    isToday && !isSelected && "border-blue-400"
                  )}
                >
                  {/* 요일 */}
                  <span
                    className={cn(
                      "text-xs font-medium",
                      isSelected
                        ? "text-blue-100"
                        : isSunday
                        ? "text-red-500"
                        : isSaturday
                        ? "text-blue-500"
                        : "text-gray-500"
                    )}
                  >
                    {format(date, "EEE", { locale: ko })}
                  </span>

                  {/* 날짜 */}
                  <span
                    className={cn(
                      "text-lg font-bold",
                      isSelected
                        ? "text-white"
                        : isUnavailable
                        ? "text-gray-300"
                        : "text-gray-900"
                    )}
                  >
                    {format(date, "d")}
                  </span>

                  {/* 상태 표시 */}
                  <span
                    className={cn(
                      "text-[10px]",
                      isSelected
                        ? "text-blue-100"
                        : isUnavailable
                        ? "text-gray-400"
                        : "text-green-600"
                    )}
                  >
                    {isUnavailable ? "마감" : "예약가능"}
                  </span>
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* 선택된 날짜 표시 */}
      {selectedDate && (
        <div className="mt-4 text-center">
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
            {format(new Date(selectedDate), "M월 d일 (EEEE)", { locale: ko })}
          </span>
        </div>
      )}
    </div>
  );
}
