"use client";

import { Input, Select } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { CustomField } from "@/types";

interface CustomFieldRendererProps {
  fields: CustomField[];
  values: Record<string, string | boolean>;
  onChange: (fieldId: string, value: string | boolean) => void;
  errors?: Record<string, string>;
}

export function CustomFieldRenderer({
  fields,
  values,
  onChange,
  errors = {},
}: CustomFieldRendererProps) {
  if (!fields || fields.length === 0) {
    return null;
  }

  const renderField = (field: CustomField) => {
    const value = values[field.id] ?? "";
    const error = errors[field.id];

    switch (field.type) {
      case "text":
      case "phone":
      case "email":
      case "number":
        return (
          <Input
            key={field.id}
            label={field.label}
            type={field.type === "phone" ? "tel" : field.type}
            placeholder={field.placeholder}
            value={value as string}
            onChange={(e) => onChange(field.id, e.target.value)}
            required={field.required}
            error={error}
            inputMode={
              field.type === "phone"
                ? "tel"
                : field.type === "number"
                ? "numeric"
                : field.type === "email"
                ? "email"
                : "text"
            }
          />
        );

      case "textarea":
        return (
          <div key={field.id} className="w-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <textarea
              className={cn(
                "w-full px-3 py-2 border rounded-lg text-gray-900 placeholder-gray-400",
                "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                "resize-none",
                error ? "border-red-500" : "border-gray-300"
              )}
              rows={3}
              placeholder={field.placeholder}
              value={value as string}
              onChange={(e) => onChange(field.id, e.target.value)}
              required={field.required}
            />
            {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
          </div>
        );

      case "select":
        return (
          <Select
            key={field.id}
            label={field.label}
            placeholder={field.placeholder || "선택해주세요"}
            options={
              field.options?.map((opt) => ({ value: opt, label: opt })) || []
            }
            value={value as string}
            onChange={(e) => onChange(field.id, e.target.value)}
            required={field.required}
            error={error}
          />
        );

      case "checkbox":
        return (
          <div key={field.id} className="w-full">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id={field.id}
                checked={value as boolean}
                onChange={(e) => onChange(field.id, e.target.checked)}
                className="mt-0.5 h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor={field.id} className="text-sm text-gray-700 cursor-pointer">
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </label>
            </div>
            {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {fields.map((field) => renderField(field))}
    </div>
  );
}

// 유효성 검사 함수
export function validateCustomFields(
  fields: CustomField[],
  values: Record<string, string | boolean>
): Record<string, string> {
  const errors: Record<string, string> = {};

  for (const field of fields) {
    const value = values[field.id];

    // 필수 필드 검사
    if (field.required) {
      if (field.type === "checkbox") {
        if (value !== true) {
          errors[field.id] = "필수 항목입니다";
        }
      } else if (!value || (typeof value === "string" && value.trim() === "")) {
        errors[field.id] = "필수 항목입니다";
      }
    }

    // 타입별 추가 검증
    if (value && typeof value === "string" && value.trim() !== "") {
      switch (field.type) {
        case "email":
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            errors[field.id] = "올바른 이메일 형식이 아닙니다";
          }
          break;
        case "phone":
          // 한국 전화번호 형식 (010-0000-0000, 01000000000)
          if (!/^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/.test(value.replace(/-/g, ""))) {
            errors[field.id] = "올바른 전화번호 형식이 아닙니다";
          }
          break;
        case "number":
          if (isNaN(Number(value))) {
            errors[field.id] = "숫자만 입력해주세요";
          } else if (field.validation) {
            const num = Number(value);
            if (field.validation.min !== undefined && num < field.validation.min) {
              errors[field.id] = field.validation.message || `최소 ${field.validation.min} 이상이어야 합니다`;
            }
            if (field.validation.max !== undefined && num > field.validation.max) {
              errors[field.id] = field.validation.message || `최대 ${field.validation.max} 이하여야 합니다`;
            }
          }
          break;
      }

      // 커스텀 패턴 검증
      if (field.validation?.pattern) {
        const regex = new RegExp(field.validation.pattern);
        if (!regex.test(value)) {
          errors[field.id] = field.validation.message || "올바른 형식이 아닙니다";
        }
      }
    }
  }

  return errors;
}
