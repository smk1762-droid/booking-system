import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

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
  } catch (error) {
    console.error("Failed to update schedule:", error);
    return NextResponse.json({ error: "Failed to update schedule" }, { status: 500 });
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
  } catch (error) {
    console.error("Failed to delete schedule:", error);
    return NextResponse.json({ error: "Failed to delete schedule" }, { status: 500 });
  }
}
