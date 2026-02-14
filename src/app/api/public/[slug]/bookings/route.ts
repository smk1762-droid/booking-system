import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { addMinutes } from "date-fns";
import { checkRateLimit, getClientIp, RATE_LIMITS } from "@/lib/rate-limit";
import type { CustomField } from "@/types";

// XSS 방지를 위한 문자열 sanitize
function sanitizeString(str: string): string {
  return str
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

// customData 유효성 검사
function validateCustomData(
  customFields: CustomField[] | null,
  customData: Record<string, unknown> | null
): { valid: boolean; error?: string; sanitized?: Record<string, string | boolean> } {
  if (!customFields || customFields.length === 0) {
    return { valid: true, sanitized: {} };
  }

  if (!customData) {
    // 필수 필드가 있는지 확인
    const requiredField = customFields.find((f) => f.required);
    if (requiredField) {
      return { valid: false, error: `${requiredField.label}은(는) 필수 항목입니다` };
    }
    return { valid: true, sanitized: {} };
  }

  const sanitized: Record<string, string | boolean> = {};

  for (const field of customFields) {
    const value = customData[field.id];

    // 필수 필드 검사
    if (field.required) {
      if (field.type === "checkbox") {
        if (value !== true) {
          return { valid: false, error: `${field.label}은(는) 필수 항목입니다` };
        }
      } else if (!value || (typeof value === "string" && value.trim() === "")) {
        return { valid: false, error: `${field.label}은(는) 필수 항목입니다` };
      }
    }

    // 값이 있으면 타입 검사 및 sanitize
    if (value !== undefined && value !== null && value !== "") {
      if (field.type === "checkbox") {
        if (typeof value !== "boolean") {
          return { valid: false, error: `${field.label}의 값이 올바르지 않습니다` };
        }
        sanitized[field.id] = value;
      } else {
        if (typeof value !== "string") {
          return { valid: false, error: `${field.label}의 값이 올바르지 않습니다` };
        }
        // 문자열 길이 제한 (최대 1000자)
        if (value.length > 1000) {
          return { valid: false, error: `${field.label}은(는) 1000자를 초과할 수 없습니다` };
        }
        sanitized[field.id] = sanitizeString(value.trim());
      }
    }
  }

  return { valid: true, sanitized };
}

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const ip = getClientIp(request);
  const { success } = checkRateLimit(`booking:${ip}`, RATE_LIMITS.bookingCreate.limit, RATE_LIMITS.bookingCreate.windowMs);
  if (!success) {
    return NextResponse.json({ error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." }, { status: 429 });
  }

  const { slug } = await params;

  try {
    const body = await request.json();
    const {
      appointmentTypeId,
      startTime,
      duration,
      guestName,
      guestPhone,
      guestEmail,
      guestNote,
      customData,
    } = body;

    // Validate required fields
    if (!appointmentTypeId || !startTime || !guestName || !guestPhone) {
      return NextResponse.json(
        { error: "필수 항목이 누락되었습니다" },
        { status: 400 }
      );
    }

    // 입력 길이 제한
    if (typeof guestName !== "string" || guestName.length > 100) {
      return NextResponse.json({ error: "이름은 100자를 초과할 수 없습니다" }, { status: 400 });
    }
    if (typeof guestPhone !== "string" || guestPhone.length > 20) {
      return NextResponse.json({ error: "연락처가 올바르지 않습니다" }, { status: 400 });
    }
    if (guestEmail && (typeof guestEmail !== "string" || guestEmail.length > 255)) {
      return NextResponse.json({ error: "이메일은 255자를 초과할 수 없습니다" }, { status: 400 });
    }
    if (guestNote && (typeof guestNote !== "string" || guestNote.length > 1000)) {
      return NextResponse.json({ error: "메모는 1000자를 초과할 수 없습니다" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    // Get appointment type
    const appointmentType = await prisma.appointmentType.findFirst({
      where: { id: appointmentTypeId, userId: user.id, isActive: true },
    });

    if (!appointmentType) {
      return NextResponse.json({ error: "Appointment type not found" }, { status: 404 });
    }

    // customData 유효성 검사
    const customFieldsValidation = validateCustomData(
      appointmentType.customFields as CustomField[] | null,
      customData
    );
    if (!customFieldsValidation.valid) {
      return NextResponse.json({ error: customFieldsValidation.error }, { status: 400 });
    }

    // Calculate end time
    const bookingDuration = duration || appointmentType.duration;
    const startDateTime = new Date(startTime);
    const endDateTime = addMinutes(startDateTime, bookingDuration);

    // Check for conflicts (optional - can be more strict)
    const existingBooking = await prisma.booking.findFirst({
      where: {
        userId: user.id,
        status: { in: ["PENDING", "CONFIRMED"] },
        OR: [
          {
            startTime: { lte: startDateTime },
            endTime: { gt: startDateTime },
          },
          {
            startTime: { lt: endDateTime },
            endTime: { gte: endDateTime },
          },
        ],
      },
    });

    // Get schedule to check capacity
    const schedule = await prisma.schedule.findFirst({
      where: { userId: user.id, isDefault: true },
    });

    const maxCapacity = appointmentType.maxCapacity || schedule?.maxCapacity || 1;

    if (existingBooking && maxCapacity === 1) {
      return NextResponse.json(
        { error: "This time slot is no longer available" },
        { status: 409 }
      );
    }

    // Create booking
    const booking = await prisma.booking.create({
      data: {
        userId: user.id,
        appointmentTypeId,
        guestName: sanitizeString(guestName.trim()),
        guestPhone: guestPhone.trim().replace(/[^0-9-]/g, ""),
        guestEmail: guestEmail ? sanitizeString(guestEmail.trim()) : null,
        guestNote: guestNote ? sanitizeString(guestNote.trim()) : null,
        customData: customFieldsValidation.sanitized && Object.keys(customFieldsValidation.sanitized).length > 0
          ? customFieldsValidation.sanitized
          : undefined,
        startTime: startDateTime,
        endTime: endDateTime,
        tokenExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        duration: bookingDuration,
        status: "PENDING",
      },
      include: {
        appointmentType: { select: { name: true } },
      },
    });

    // TODO: Send confirmation request via Kakao Alimtalk
    // This would be implemented with the Kakao Business Message API

    return NextResponse.json({
      id: booking.id,
      status: booking.status,
      message: "예약이 생성되었습니다. 연락처로 발송된 알림을 통해 예약을 확정해주세요.",
    });
  } catch {
    return NextResponse.json({ error: "예약 생성에 실패했습니다" }, { status: 500 });
  }
}
