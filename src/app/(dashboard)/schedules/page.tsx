"use client";

import { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/layout";
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Switch, Select } from "@/components/ui";
import { Save, Plus, X } from "lucide-react";
import { getDayOfWeekName } from "@/lib/utils";

interface TimeSlot {
  id?: string;
  startTime: string;
  endTime: string;
}

interface WeeklyHours {
  dayOfWeek: number;
  isEnabled: boolean;
  timeSlots: TimeSlot[];
}

interface Schedule {
  id?: string;
  name: string;
  slotDuration: number;
  bufferBefore: number;
  bufferAfter: number;
  minNotice: number;
  maxAdvance: number;
  maxCapacity: number;
  allowCancellation: boolean;
  cancelNotice: number;
  reopenOnCancel: boolean;
  weeklyHours: WeeklyHours[];
}

const defaultWeeklyHours: WeeklyHours[] = [
  { dayOfWeek: 0, isEnabled: false, timeSlots: [] },
  { dayOfWeek: 1, isEnabled: true, timeSlots: [{ startTime: "09:00", endTime: "18:00" }] },
  { dayOfWeek: 2, isEnabled: true, timeSlots: [{ startTime: "09:00", endTime: "18:00" }] },
  { dayOfWeek: 3, isEnabled: true, timeSlots: [{ startTime: "09:00", endTime: "18:00" }] },
  { dayOfWeek: 4, isEnabled: true, timeSlots: [{ startTime: "09:00", endTime: "18:00" }] },
  { dayOfWeek: 5, isEnabled: true, timeSlots: [{ startTime: "09:00", endTime: "18:00" }] },
  { dayOfWeek: 6, isEnabled: false, timeSlots: [] },
];

const slotDurationOptions = [
  { value: "15", label: "15분" },
  { value: "30", label: "30분" },
  { value: "45", label: "45분" },
  { value: "60", label: "1시간" },
];

export default function SchedulesPage() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [schedule, setSchedule] = useState<Schedule>({
    name: "기본 스케줄",
    slotDuration: 30,
    bufferBefore: 0,
    bufferAfter: 0,
    minNotice: 60,
    maxAdvance: 30,
    maxCapacity: 1,
    allowCancellation: true,
    cancelNotice: 1440,
    reopenOnCancel: true,
    weeklyHours: defaultWeeklyHours,
  });

  const fetchSchedule = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/schedules");
      if (response.ok) {
        const data = await response.json();
        if (data.length > 0) {
          setSchedule(data[0]);
        }
      }
    } catch {
      // 조회 실패 시 로딩 해제
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSchedule();
  }, [fetchSchedule]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const method = schedule.id ? "PUT" : "POST";
      const url = schedule.id ? `/api/schedules/${schedule.id}` : "/api/schedules";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(schedule),
      });

      if (response.ok) {
        const data = await response.json();
        setSchedule(data);
      }
    } catch {
      // 저장 실패 시 로딩 해제
    } finally {
      setSaving(false);
    }
  };

  const updateWeeklyHours = (dayOfWeek: number, updates: Partial<WeeklyHours>) => {
    setSchedule((prev) => ({
      ...prev,
      weeklyHours: prev.weeklyHours.map((wh) =>
        wh.dayOfWeek === dayOfWeek ? { ...wh, ...updates } : wh
      ),
    }));
  };

  const addTimeSlot = (dayOfWeek: number) => {
    updateWeeklyHours(dayOfWeek, {
      timeSlots: [
        ...schedule.weeklyHours.find((wh) => wh.dayOfWeek === dayOfWeek)!.timeSlots,
        { startTime: "09:00", endTime: "18:00" },
      ],
    });
  };

  const removeTimeSlot = (dayOfWeek: number, index: number) => {
    const wh = schedule.weeklyHours.find((w) => w.dayOfWeek === dayOfWeek)!;
    updateWeeklyHours(dayOfWeek, {
      timeSlots: wh.timeSlots.filter((_, i) => i !== index),
    });
  };

  const updateTimeSlot = (dayOfWeek: number, index: number, updates: Partial<TimeSlot>) => {
    const wh = schedule.weeklyHours.find((w) => w.dayOfWeek === dayOfWeek)!;
    updateWeeklyHours(dayOfWeek, {
      timeSlots: wh.timeSlots.map((ts, i) => (i === index ? { ...ts, ...updates } : ts)),
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div>
      <Header
        title="스케줄 설정"
        description="예약 가능한 시간을 설정합니다"
        actions={
          <Button variant="primary" onClick={handleSave} loading={saving}>
            <Save className="w-4 h-4 mr-2" />
            저장
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 기본 설정 */}
        <Card>
          <CardHeader>
            <CardTitle>기본 설정</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select
              label="예약 시간 단위"
              options={slotDurationOptions}
              value={schedule.slotDuration.toString()}
              onChange={(e) =>
                setSchedule({ ...schedule, slotDuration: parseInt(e.target.value) })
              }
              hint="예약 가능한 시간 간격"
            />

            <Input
              label="최대 정원"
              type="number"
              min="1"
              max="100"
              value={schedule.maxCapacity.toString()}
              onChange={(e) =>
                setSchedule({ ...schedule, maxCapacity: parseInt(e.target.value) || 1 })
              }
              hint="같은 시간대에 예약 가능한 최대 인원"
            />

            <Input
              label="최소 예약 시간 (분)"
              type="number"
              min="0"
              value={schedule.minNotice.toString()}
              onChange={(e) =>
                setSchedule({ ...schedule, minNotice: parseInt(e.target.value) || 0 })
              }
              hint="예약 시작 전 최소 필요 시간"
            />

            <Input
              label="최대 예약 가능 일수"
              type="number"
              min="1"
              max="365"
              value={schedule.maxAdvance.toString()}
              onChange={(e) =>
                setSchedule({ ...schedule, maxAdvance: parseInt(e.target.value) || 30 })
              }
              hint="오늘부터 며칠 후까지 예약 가능"
            />
          </CardContent>
        </Card>

        {/* 취소 설정 */}
        <Card>
          <CardHeader>
            <CardTitle>취소 설정</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Switch
              label="예약 취소 허용"
              description="예약자가 예약을 취소할 수 있습니다"
              checked={schedule.allowCancellation}
              onChange={(e) =>
                setSchedule({ ...schedule, allowCancellation: e.target.checked })
              }
            />

            {schedule.allowCancellation && (
              <>
                <Input
                  label="취소 가능 시간 (분)"
                  type="number"
                  min="0"
                  value={schedule.cancelNotice.toString()}
                  onChange={(e) =>
                    setSchedule({ ...schedule, cancelNotice: parseInt(e.target.value) || 0 })
                  }
                  hint="예약 시작 전 취소 가능한 최소 시간"
                />

                <Switch
                  label="취소 시 슬롯 재오픈"
                  description="취소된 시간대를 다시 예약 받습니다"
                  checked={schedule.reopenOnCancel}
                  onChange={(e) =>
                    setSchedule({ ...schedule, reopenOnCancel: e.target.checked })
                  }
                />
              </>
            )}
          </CardContent>
        </Card>

        {/* 요일별 시간 설정 */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>요일별 운영 시간</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {schedule.weeklyHours
                .sort((a, b) => {
                  // 월요일부터 시작
                  const order = [1, 2, 3, 4, 5, 6, 0];
                  return order.indexOf(a.dayOfWeek) - order.indexOf(b.dayOfWeek);
                })
                .map((wh) => (
                  <div
                    key={wh.dayOfWeek}
                    className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="w-20">
                      <Switch
                        checked={wh.isEnabled}
                        onChange={(e) =>
                          updateWeeklyHours(wh.dayOfWeek, {
                            isEnabled: e.target.checked,
                            timeSlots: e.target.checked && wh.timeSlots.length === 0
                              ? [{ startTime: "09:00", endTime: "18:00" }]
                              : wh.timeSlots,
                          })
                        }
                      />
                      <span className="text-sm font-medium text-gray-700 ml-2">
                        {getDayOfWeekName(wh.dayOfWeek)}
                      </span>
                    </div>

                    <div className="flex-1">
                      {wh.isEnabled ? (
                        <div className="space-y-2">
                          {wh.timeSlots.map((slot, index) => (
                            <div key={index} className="flex items-center gap-2">
                              <input
                                type="time"
                                value={slot.startTime}
                                onChange={(e) =>
                                  updateTimeSlot(wh.dayOfWeek, index, {
                                    startTime: e.target.value,
                                  })
                                }
                                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
                              />
                              <span className="text-gray-500">~</span>
                              <input
                                type="time"
                                value={slot.endTime}
                                onChange={(e) =>
                                  updateTimeSlot(wh.dayOfWeek, index, {
                                    endTime: e.target.value,
                                  })
                                }
                                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
                              />
                              {wh.timeSlots.length > 1 && (
                                <button
                                  onClick={() => removeTimeSlot(wh.dayOfWeek, index)}
                                  className="p-1 text-gray-400 hover:text-red-500"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          ))}
                          <button
                            onClick={() => addTimeSlot(wh.dayOfWeek)}
                            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                          >
                            <Plus className="w-4 h-4" />
                            시간 추가
                          </button>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">휴무</span>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
