"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, Button, Input } from "@/components/ui";
import { CustomFieldRenderer, validateCustomFields, DatePickerNaver, DatePickerCalendly } from "@/components/booking";
import { ArrowLeft, Clock, Check, Loader2, Calendar, List } from "lucide-react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import type { CustomField } from "@/types";

interface AppointmentType {
  id: string;
  name: string;
  description: string | null;
  duration: number;
  minDuration: number | null;
  maxDuration: number | null;
  color: string;
  requirePhone: boolean;
  requireEmail: boolean;
  customFields: CustomField[] | null;
}

interface AvailableSlot {
  start: string;
  end: string;
  available: number;
  total: number;
}

interface BusinessInfo {
  businessName: string;
  slug: string;
}

export default function BookingSlotPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;
  const typeId = params.typeId as string;

  const [step, setStep] = useState<"date" | "time" | "info">("date");
  const [loading, setLoading] = useState(true);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [business, setBusiness] = useState<BusinessInfo | null>(null);
  const [appointmentType, setAppointmentType] = useState<AppointmentType | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [slots, setSlots] = useState<AvailableSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);
  const [duration, setDuration] = useState<number>(30);
  const [datePickerStyle, setDatePickerStyle] = useState<"naver" | "calendly">("naver");

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    note: "",
  });
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, string | boolean>>({});
  const [customFieldErrors, setCustomFieldErrors] = useState<Record<string, string>>({});
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const fetchData = useCallback(async () => {
    try {
      const [infoRes, typesRes] = await Promise.all([
        fetch(`/api/public/${slug}/info`),
        fetch(`/api/public/${slug}/types`),
      ]);

      if (infoRes.ok && typesRes.ok) {
        const info = await infoRes.json();
        const types = await typesRes.json();

        setBusiness(info);
        const type = types.find((t: AppointmentType) => t.id === typeId);
        if (type) {
          setAppointmentType(type);
          setDuration(type.duration);
        }
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  }, [slug, typeId]);

  const fetchSlots = useCallback(async (date: string) => {
    setSlotsLoading(true);
    try {
      const res = await fetch(
        `/api/public/${slug}/slots?typeId=${typeId}&date=${date}&duration=${duration}`
      );
      if (res.ok) {
        const data = await res.json();
        setSlots(data);
      }
    } catch (error) {
      console.error("Failed to fetch slots:", error);
    } finally {
      setSlotsLoading(false);
    }
  }, [slug, typeId, duration]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (selectedDate) {
      fetchSlots(selectedDate);
    }
  }, [selectedDate, fetchSlots]);

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setStep("time");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot || !appointmentType) return;

    // 기본 필드 유효성 검사
    const newFormErrors: Record<string, string> = {};
    if (!formData.name.trim()) {
      newFormErrors.name = "이름을 입력해주세요";
    }
    if (appointmentType.requirePhone) {
      const phone = formData.phone.trim().replace(/-/g, "");
      if (!phone) {
        newFormErrors.phone = "연락처를 입력해주세요";
      } else if (!/^01[0-9][0-9]{7,8}$/.test(phone)) {
        newFormErrors.phone = "올바른 전화번호 형식이 아닙니다";
      }
    }
    if (appointmentType.requireEmail && formData.email) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
        newFormErrors.email = "올바른 이메일 형식이 아닙니다";
      }
    }
    if (Object.keys(newFormErrors).length > 0) {
      setFormErrors(newFormErrors);
      return;
    }
    setFormErrors({});

    // 커스텀 필드 유효성 검사
    if (appointmentType.customFields && appointmentType.customFields.length > 0) {
      const errors = validateCustomFields(appointmentType.customFields, customFieldValues);
      if (Object.keys(errors).length > 0) {
        setCustomFieldErrors(errors);
        return;
      }
    }
    setCustomFieldErrors({});
    setSubmitError(null);
    setSubmitting(true);

    try {
      const response = await fetch(`/api/public/${slug}/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointmentTypeId: typeId,
          startTime: selectedSlot.start,
          duration,
          guestName: formData.name.trim(),
          guestPhone: formData.phone.trim(),
          guestEmail: formData.email.trim() || undefined,
          guestNote: formData.note.trim() || undefined,
          customData: Object.keys(customFieldValues).length > 0 ? customFieldValues : undefined,
        }),
      });

      if (response.ok) {
        router.push(`/book/${slug}/success`);
      } else {
        const errorData = await response.json().catch(() => ({}));
        setSubmitError(errorData.error || "예약 신청에 실패했습니다. 다시 시도해주세요.");
      }
    } catch (error) {
      console.error("Failed to create booking:", error);
      setSubmitError("네트워크 오류가 발생했습니다. 인터넷 연결을 확인해주세요.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!appointmentType || !business) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="max-w-md mx-4">
          <CardContent className="py-12 text-center">
            <p className="text-gray-500">일정을 찾을 수 없습니다</p>
            <Link href={`/book/${slug}`}>
              <Button variant="primary" className="mt-4">
                돌아가기
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            href={`/book/${slug}`}
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            다른 일정 선택
          </Link>
          <div className="flex items-center gap-3">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: appointmentType.color }}
            />
            <h1 className="text-xl font-bold text-gray-900">{appointmentType.name}</h1>
          </div>
          <div className="flex items-center gap-1 mt-1 text-sm text-gray-500">
            <Clock className="w-4 h-4" />
            {duration}분
          </div>
        </div>

        {/* Steps */}
        <div className="flex items-center gap-4 mb-8">
          {[
            { key: "date", label: "날짜 선택" },
            { key: "time", label: "시간 선택" },
            { key: "info", label: "정보 입력" },
          ].map((s, i) => (
            <div key={s.key} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step === s.key
                    ? "bg-blue-600 text-white"
                    : ["date", "time", "info"].indexOf(step) > i
                    ? "bg-green-500 text-white"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                {["date", "time", "info"].indexOf(step) > i ? (
                  <Check className="w-4 h-4" />
                ) : (
                  i + 1
                )}
              </div>
              <span className={`text-sm ${step === s.key ? "font-medium text-gray-900" : "text-gray-500"}`}>
                {s.label}
              </span>
            </div>
          ))}
        </div>

        {/* Content */}
        {step === "date" && (
          <Card>
            <CardContent className="p-6">
              {/* 스타일 선택 토글 */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">날짜를 선택해주세요</h2>
                <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                  <button
                    type="button"
                    onClick={() => setDatePickerStyle("naver")}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      datePickerStyle === "naver"
                        ? "bg-white text-blue-600 shadow-sm"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    <List className="w-4 h-4" />
                    <span className="hidden sm:inline">리스트</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDatePickerStyle("calendly")}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      datePickerStyle === "calendly"
                        ? "bg-white text-blue-600 shadow-sm"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    <Calendar className="w-4 h-4" />
                    <span className="hidden sm:inline">달력</span>
                  </button>
                </div>
              </div>

              {/* 날짜 선택 UI */}
              {datePickerStyle === "naver" ? (
                <DatePickerNaver
                  selectedDate={selectedDate}
                  onSelectDate={handleDateSelect}
                />
              ) : (
                <DatePickerCalendly
                  selectedDate={selectedDate}
                  onSelectDate={handleDateSelect}
                />
              )}
            </CardContent>
          </Card>
        )}

        {step === "time" && (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  {selectedDate && format(new Date(selectedDate), "M월 d일 (EEE)", { locale: ko })}
                </h2>
                <button
                  onClick={() => setStep("date")}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  날짜 변경
                </button>
              </div>

              {slotsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                  <span className="ml-2 text-gray-500">시간을 불러오는 중...</span>
                </div>
              ) : slots.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  이 날짜에는 예약 가능한 시간이 없습니다
                </p>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                  {slots.map((slot) => (
                    <button
                      key={slot.start}
                      onClick={() => {
                        setSelectedSlot(slot);
                        setStep("info");
                      }}
                      className={`p-3 rounded-lg text-center transition-all ${
                        selectedSlot?.start === slot.start
                          ? "bg-blue-600 text-white"
                          : "bg-white hover:bg-blue-50 text-gray-900 border border-gray-200"
                      }`}
                    >
                      <div className="font-medium">
                        {format(new Date(slot.start), "HH:mm")}
                      </div>
                      {slot.total > 1 && (
                        <div className="text-xs mt-1 opacity-70">
                          {slot.available}자리
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {step === "info" && (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">예약 정보 입력</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {selectedDate && format(new Date(selectedDate), "M월 d일 (EEE)", { locale: ko })}{" "}
                    {selectedSlot && format(new Date(selectedSlot.start), "HH:mm")}
                  </p>
                </div>
                <button
                  onClick={() => setStep("time")}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  시간 변경
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="이름"
                  placeholder="홍길동"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value });
                    if (formErrors.name) setFormErrors((prev) => ({ ...prev, name: "" }));
                  }}
                  error={formErrors.name}
                  required
                />

                <Input
                  label="연락처"
                  type="tel"
                  inputMode="tel"
                  placeholder="010-0000-0000"
                  value={formData.phone}
                  onChange={(e) => {
                    setFormData({ ...formData, phone: e.target.value });
                    if (formErrors.phone) setFormErrors((prev) => ({ ...prev, phone: "" }));
                  }}
                  error={formErrors.phone}
                  required={appointmentType.requirePhone}
                />

                {appointmentType.requireEmail && (
                  <Input
                    label="이메일"
                    type="email"
                    inputMode="email"
                    placeholder="example@email.com"
                    value={formData.email}
                    onChange={(e) => {
                      setFormData({ ...formData, email: e.target.value });
                      if (formErrors.email) setFormErrors((prev) => ({ ...prev, email: "" }));
                    }}
                    error={formErrors.email}
                    required
                  />
                )}

                {/* 커스텀 필드 */}
                {appointmentType.customFields && appointmentType.customFields.length > 0 && (
                  <CustomFieldRenderer
                    fields={appointmentType.customFields}
                    values={customFieldValues}
                    onChange={(fieldId, value) => {
                      setCustomFieldValues((prev) => ({ ...prev, [fieldId]: value }));
                      // 에러 지우기
                      if (customFieldErrors[fieldId]) {
                        setCustomFieldErrors((prev) => {
                          const next = { ...prev };
                          delete next[fieldId];
                          return next;
                        });
                      }
                    }}
                    errors={customFieldErrors}
                  />
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">메모</label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="추가로 전달할 내용이 있으면 적어주세요"
                    value={formData.note}
                    onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  />
                </div>

                {/* 안내 문구 */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
                  <p className="font-medium mb-1">예약 확정 안내</p>
                  <p>
                    예약 신청 후 입력하신 연락처로 확인 알림톡이 발송됩니다.
                    알림톡의 &quot;예약 확정하기&quot; 버튼을 눌러야 예약이 최종 확정됩니다.
                    24시간 내 확정하지 않으면 예약이 자동 취소됩니다.
                  </p>
                </div>

                {/* 에러 메시지 */}
                {submitError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-800">
                    {submitError}
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setStep("time")}
                  >
                    이전
                  </Button>
                  <Button type="submit" variant="primary" className="flex-1" loading={submitting}>
                    예약 신청
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
