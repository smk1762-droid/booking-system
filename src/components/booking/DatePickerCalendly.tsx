"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format, addDays, startOfDay, isSameDay, startOfMonth, endOfMonth, addMonths, eachDayOfInterval, getDay } from "date-fns";
import { ko } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface DatePickerCalendlyProps {
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
  // 날짜별 예약 가능 여부 (optional)
  availabilityMap?: Record<string, { available: boolean; slots?: number }>;
  // 최소 예약 가능일 (오늘로부터 n일 후)
  minDaysAhead?: number;
  // 최대 예약 가능일 (오늘로부터 n일 후)
  maxDaysAhead?: number;
}

export function DatePickerCalendly({
  selectedDate,
  onSelectDate,
  availabilityMap = {},
  minDaysAhead = 0,
  maxDaysAhead = 60,
}: DatePickerCalendlyProps) {
  const today = startOfDay(new Date());
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(today));

  const minDate = addDays(today, minDaysAhead);
  const maxDate = addDays(today, maxDaysAhead);

  // 현재 월의 날짜들
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

    // 앞에 빈 칸 추가 (일요일 시작)
    const startDay = getDay(monthStart);
    const blanks = Array(startDay).fill(null);

    return [...blanks, ...days];
  }, [currentMonth]);

  const handlePrevMonth = () => {
    setCurrentMonth((prev) => addMonths(prev, -1));
  };

  const handleNextMonth = () => {
    setCurrentMonth((prev) => addMonths(prev, 1));
  };

  const canGoPrev = currentMonth > startOfMonth(minDate);
  const canGoNext = currentMonth < startOfMonth(maxDate);

  const isDateSelectable = (date: Date) => {
    if (date < minDate || date > maxDate) return false;

    const dateStr = format(date, "yyyy-MM-dd");
    const availability = availabilityMap[dateStr];
    if (availability && !availability.available) return false;

    return true;
  };

  return (
    <div className="w-full">
      {/* 월 네비게이션 */}
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={handlePrevMonth}
          disabled={!canGoPrev}
          className={cn(
            "p-2 rounded-full transition-colors",
            canGoPrev
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
          disabled={!canGoNext}
          className={cn(
            "p-2 rounded-full transition-colors",
            canGoNext
              ? "hover:bg-gray-100 text-gray-700"
              : "text-gray-300 cursor-not-allowed"
          )}
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {["일", "월", "화", "수", "목", "금", "토"].map((day, i) => (
          <div
            key={day}
            className={cn(
              "text-center text-sm font-medium py-2",
              i === 0 ? "text-red-500" : i === 6 ? "text-blue-500" : "text-gray-500"
            )}
          >
            {day}
          </div>
        ))}
      </div>

      {/* 날짜 그리드 */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((date, index) => {
          if (!date) {
            return <div key={`blank-${index}`} className="aspect-square" />;
          }

          const dateStr = format(date, "yyyy-MM-dd");
          const isSelected = selectedDate === dateStr;
          const isToday = isSameDay(date, today);
          const selectable = isDateSelectable(date);
          const dayOfWeek = date.getDay();
          const isSunday = dayOfWeek === 0;
          const isSaturday = dayOfWeek === 6;

          return (
            <button
              key={dateStr}
              type="button"
              onClick={() => selectable && onSelectDate(dateStr)}
              disabled={!selectable}
              className={cn(
                "aspect-square flex flex-col items-center justify-center rounded-lg transition-all text-sm",
                "min-h-[44px]", // 터치 영역 확보
                isSelected
                  ? "bg-blue-600 text-white font-bold shadow-md"
                  : selectable
                  ? cn(
                      "hover:bg-blue-50 hover:border-blue-400",
                      isToday ? "border-2 border-blue-500" : "border border-gray-200",
                      isSunday ? "text-red-500" : isSaturday ? "text-blue-500" : "text-gray-900"
                    )
                  : "text-gray-300 cursor-not-allowed"
              )}
            >
              <span className="font-medium">{format(date, "d")}</span>
              {isToday && !isSelected && (
                <span className="text-[10px] text-blue-600">오늘</span>
              )}
            </button>
          );
        })}
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
