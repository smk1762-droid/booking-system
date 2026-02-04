"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout";
import { Button, Card, CardContent, CardFooter, Input, Select, Switch } from "@/components/ui";
import { CustomFieldBuilder } from "@/components/booking";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { CustomField } from "@/types";

const durationOptions = [
  { value: "15", label: "15분" },
  { value: "30", label: "30분" },
  { value: "45", label: "45분" },
  { value: "60", label: "1시간" },
  { value: "90", label: "1시간 30분" },
  { value: "120", label: "2시간" },
];

const colorOptions = [
  "#3B82F6", // blue
  "#10B981", // green
  "#F59E0B", // amber
  "#EF4444", // red
  "#8B5CF6", // violet
  "#EC4899", // pink
  "#06B6D4", // cyan
  "#84CC16", // lime
];

export default function NewAppointmentTypePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    duration: "30",
    useVariableDuration: false,
    minDuration: "30",
    maxDuration: "60",
    maxCapacity: "1",
    color: colorOptions[0],
    requirePhone: true,
    requireEmail: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/appointment-types", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description || null,
          duration: parseInt(formData.duration),
          minDuration: formData.useVariableDuration ? parseInt(formData.minDuration) : null,
          maxDuration: formData.useVariableDuration ? parseInt(formData.maxDuration) : null,
          maxCapacity: parseInt(formData.maxCapacity) > 1 ? parseInt(formData.maxCapacity) : null,
          color: formData.color,
          requirePhone: formData.requirePhone,
          requireEmail: formData.requireEmail,
          customFields: customFields.length > 0 ? customFields : null,
        }),
      });

      if (response.ok) {
        router.push("/appointment-types");
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to create appointment type:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Link
        href="/appointment-types"
        className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        돌아가기
      </Link>

      <Header title="새 일정 유형" description="예약 가능한 새로운 일정 유형을 만듭니다" />

      <form onSubmit={handleSubmit}>
        <Card className="max-w-2xl">
          <CardContent className="space-y-6 pt-6">
            {/* 기본 정보 */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-900">기본 정보</h3>

              <Input
                label="일정 이름"
                placeholder="예: 신규 입학 상담"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="일정에 대한 간단한 설명"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
            </div>

            {/* 시간 설정 */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-900">시간 설정</h3>

              <Switch
                label="가변 시간 사용"
                description="예약자가 시간을 선택할 수 있습니다"
                checked={formData.useVariableDuration}
                onChange={(e) =>
                  setFormData({ ...formData, useVariableDuration: e.target.checked })
                }
              />

              {formData.useVariableDuration ? (
                <div className="grid grid-cols-2 gap-4">
                  <Select
                    label="최소 시간"
                    options={durationOptions}
                    value={formData.minDuration}
                    onChange={(e) => setFormData({ ...formData, minDuration: e.target.value })}
                  />
                  <Select
                    label="최대 시간"
                    options={durationOptions}
                    value={formData.maxDuration}
                    onChange={(e) => setFormData({ ...formData, maxDuration: e.target.value })}
                  />
                </div>
              ) : (
                <Select
                  label="소요 시간"
                  options={durationOptions}
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                />
              )}
            </div>

            {/* 정원 설정 */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-900">정원 설정</h3>

              <Input
                label="최대 인원"
                type="number"
                min="1"
                max="100"
                value={formData.maxCapacity}
                onChange={(e) => setFormData({ ...formData, maxCapacity: e.target.value })}
                hint="같은 시간대에 예약 가능한 최대 인원"
              />
            </div>

            {/* 색상 선택 */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-900">색상</h3>
              <div className="flex gap-2">
                {colorOptions.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      formData.color === color
                        ? "border-gray-900 scale-110"
                        : "border-transparent hover:scale-105"
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setFormData({ ...formData, color })}
                  />
                ))}
              </div>
            </div>

            {/* 필수 입력 필드 */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-900">필수 입력 필드</h3>

              <Switch
                label="연락처 필수"
                description="예약자의 연락처를 필수로 받습니다"
                checked={formData.requirePhone}
                onChange={(e) => setFormData({ ...formData, requirePhone: e.target.checked })}
              />

              <Switch
                label="이메일 필수"
                description="예약자의 이메일을 필수로 받습니다"
                checked={formData.requireEmail}
                onChange={(e) => setFormData({ ...formData, requireEmail: e.target.checked })}
              />
            </div>

            {/* 커스텀 필드 빌더 */}
            <div className="pt-4 border-t border-gray-200">
              <CustomFieldBuilder
                fields={customFields}
                onChange={setCustomFields}
              />
            </div>
          </CardContent>

          <CardFooter className="flex justify-end gap-3">
            <Link href="/appointment-types">
              <Button variant="outline" type="button">
                취소
              </Button>
            </Link>
            <Button variant="primary" type="submit" loading={loading}>
              만들기
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
