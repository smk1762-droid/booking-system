import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  DEFAULT_TOKEN_EXPIRY_HOURS,
  validateTokenExpiryHours,
} from "@/lib/schedule-validation";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const schedules = await prisma.schedule.findMany({
    where: { userId: session.user.id },
    include: {
      weeklyHours: {
        include: { timeSlots: true },
        orderBy: { dayOfWeek: "asc" },
      },
      dateOverrides: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(schedules);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();

    // tokenExpiryHours: 누락 시 기본값, 명시되면 0~720만 허용
    let tokenExpiryHours = DEFAULT_TOKEN_EXPIRY_HOURS;
    if (body.tokenExpiryHours !== undefined && body.tokenExpiryHours !== null) {
      const v = validateTokenExpiryHours(body.tokenExpiryHours);
      if (v === null) {
        return NextResponse.json(
          { error: "링크 유효 시간은 0~720 사이의 정수여야 합니다 (0=만료 없음)" },
          { status: 400 },
        );
      }
      tokenExpiryHours = v;
    }

    const schedule = await prisma.schedule.create({
      data: {
        userId: session.user.id,
        name: body.name || "기본 스케줄",
        isDefault: true,
        slotDuration: body.slotDuration || 30,
        bufferBefore: body.bufferBefore || 0,
        bufferAfter: body.bufferAfter || 0,
        minNotice: body.minNotice || 60,
        maxAdvance: body.maxAdvance || 30,
        maxCapacity: body.maxCapacity || 1,
        allowCancellation: body.allowCancellation ?? true,
        cancelNotice: body.cancelNotice || 1440,
        reopenOnCancel: body.reopenOnCancel ?? true,
        tokenExpiryHours,
        weeklyHours: {
          create: body.weeklyHours?.map((wh: { dayOfWeek: number; isEnabled: boolean; timeSlots: { startTime: string; endTime: string }[] }) => ({
            dayOfWeek: wh.dayOfWeek,
            isEnabled: wh.isEnabled,
            timeSlots: {
              create: wh.timeSlots?.map((ts: { startTime: string; endTime: string }) => ({
                startTime: ts.startTime,
                endTime: ts.endTime,
              })) || [],
            },
          })) || [],
        },
      },
      include: {
        weeklyHours: {
          include: { timeSlots: true },
          orderBy: { dayOfWeek: "asc" },
        },
        dateOverrides: true,
      },
    });

    return NextResponse.json(schedule);
  } catch {
    return NextResponse.json({ error: "스케줄 생성에 실패했습니다" }, { status: 500 });
  }
}
