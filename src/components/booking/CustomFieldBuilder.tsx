"use client";

import { useState } from "react";
import { Button, Input, Select, Switch } from "@/components/ui";
import { Plus, Trash2, GripVertical } from "lucide-react";
import type { CustomField } from "@/types";

interface CustomFieldBuilderProps {
  fields: CustomField[];
  onChange: (fields: CustomField[]) => void;
}

const fieldTypeOptions = [
  { value: "text", label: "텍스트" },
  { value: "phone", label: "전화번호" },
  { value: "email", label: "이메일" },
  { value: "number", label: "숫자" },
  { value: "textarea", label: "긴 텍스트" },
  { value: "select", label: "선택 (드롭다운)" },
  { value: "checkbox", label: "체크박스" },
];

export function CustomFieldBuilder({ fields, onChange }: CustomFieldBuilderProps) {
  const [editingOptions, setEditingOptions] = useState<Record<string, string>>({});

  const addField = () => {
    const newField: CustomField = {
      id: `field-${Date.now()}`,
      label: "",
      type: "text",
      required: false,
      placeholder: "",
    };
    onChange([...fields, newField]);
  };

  const updateField = (id: string, updates: Partial<CustomField>) => {
    onChange(
      fields.map((field) =>
        field.id === id ? { ...field, ...updates } : field
      )
    );
  };

  const removeField = (id: string) => {
    onChange(fields.filter((field) => field.id !== id));
  };

  const handleOptionsChange = (id: string, value: string) => {
    setEditingOptions((prev) => ({ ...prev, [id]: value }));
    // 쉼표로 구분된 옵션 파싱
    const options = value
      .split(",")
      .map((opt) => opt.trim())
      .filter((opt) => opt !== "");
    updateField(id, { options });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-900">추가 입력 필드</h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addField}
          className="flex items-center gap-1"
        >
          <Plus className="w-4 h-4" />
          필드 추가
        </Button>
      </div>

      {fields.length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
          <p className="text-sm text-gray-500">
            추가 입력 필드가 없습니다.
            <br />
            학교, 학년 등 예약자에게 받을 정보를 추가하세요.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {fields.map((field) => (
            <div
              key={field.id}
              className="border border-gray-200 rounded-lg p-4 bg-gray-50"
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 pt-2 text-gray-400 cursor-move">
                  <GripVertical className="w-5 h-5" />
                </div>

                <div className="flex-1 space-y-3">
                  {/* 필드 라벨과 타입 */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Input
                      label="필드 이름"
                      placeholder="예: 학교"
                      value={field.label}
                      onChange={(e) => updateField(field.id, { label: e.target.value })}
                      required
                    />
                    <Select
                      label="입력 타입"
                      options={fieldTypeOptions}
                      value={field.type}
                      onChange={(e) =>
                        updateField(field.id, {
                          type: e.target.value as CustomField["type"],
                          options: e.target.value === "select" ? [] : undefined,
                        })
                      }
                    />
                  </div>

                  {/* Placeholder */}
                  <Input
                    label="안내 문구 (선택)"
                    placeholder="예: 재학 중인 학교명을 입력해주세요"
                    value={field.placeholder || ""}
                    onChange={(e) => updateField(field.id, { placeholder: e.target.value })}
                  />

                  {/* Select 옵션 */}
                  {field.type === "select" && (
                    <Input
                      label="선택 항목"
                      placeholder="쉼표로 구분 (예: 1학년, 2학년, 3학년)"
                      value={editingOptions[field.id] ?? field.options?.join(", ") ?? ""}
                      onChange={(e) => handleOptionsChange(field.id, e.target.value)}
                      hint="쉼표(,)로 항목을 구분해주세요"
                    />
                  )}

                  {/* 필수 여부 */}
                  <div className="flex items-center justify-between pt-2">
                    <Switch
                      label="필수 입력"
                      checked={field.required}
                      onChange={(e) => updateField(field.id, { required: e.target.checked })}
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => removeField(field.id)}
                  className="flex-shrink-0 p-2 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 미리보기 */}
      {fields.length > 0 && (
        <div className="mt-6 p-4 border border-blue-200 rounded-lg bg-blue-50">
          <h4 className="text-sm font-medium text-blue-900 mb-3">미리보기</h4>
          <div className="space-y-2">
            {fields.map((field) => (
              <div key={field.id} className="text-sm text-blue-800">
                <span className="font-medium">{field.label || "(이름 없음)"}</span>
                {field.required && <span className="text-red-500 ml-1">*</span>}
                <span className="text-blue-600 ml-2">
                  ({fieldTypeOptions.find((opt) => opt.value === field.type)?.label})
                </span>
                {field.type === "select" && field.options && field.options.length > 0 && (
                  <span className="text-blue-500 ml-1">
                    [{field.options.join(", ")}]
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
