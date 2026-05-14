import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { validateTokenExpiryHours } from "@/lib/schedule-validation";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const schedule = await prisma.schedule.findFirst({
    where: { id, userId: session.user.id },
    include: {
      weeklyHours: {
        include: { timeSlots: true },
        orderBy: { dayOfWeek: "asc" },
      },
      dateOverrides: true,
    },
  });

  if (!schedule) {
    return NextResponse.json({ error: "Schedule not found" }, { status: 404 });
  }

  return NextResponse.json(schedule);
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();

    // tokenExpiryHours가 명시된 경우에만 검증. undefined면 변경 없음.
    let tokenExpiryHours: number | undefined;
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

    // Verify ownership
    const existing = await prisma.schedule.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Schedule not found" }, { status: 404 });
    }

    // Delete existing weekly hours and recreate
    await prisma.weeklyHours.deleteMany({ where: { scheduleId: id } });

    const schedule = await prisma.schedule.update({
      where: { id },
      data: {
        name: body.name,
        slotDuration: body.slotDuration,
        bufferBefore: body.bufferBefore,
        bufferAfter: body.bufferAfter,
        minNotice: body.minNotice,
        maxAdvance: body.maxAdvance,
        maxCapacity: body.maxCapacity,
        allowCancellation: body.allowCancellation,
        cancelNotice: body.cancelNotice,
        reopenOnCancel: body.reopenOnCancel,
        ...(tokenExpiryHours !== undefined && { tokenExpiryHours }),
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
    return NextResponse.json({ error: "스케줄 수정에 실패했습니다" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const existing = await prisma.schedule.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Schedule not found" }, { status: 404 });
    }

    await prisma.schedule.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "스케줄 삭제에 실패했습니다" }, { status: 500 });
  }
}
