import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateAvailableSlots } from "@/lib/slots";

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(request.url);
    const typeId = searchParams.get("typeId");
    const date = searchParams.get("date");
    const durationParam = searchParams.get("duration");

    if (!typeId) {
      return NextResponse.json({ error: "typeId is required" }, { status: 400 });
    }

    if (durationParam && (isNaN(Number(durationParam)) || Number(durationParam) < 5)) {
      return NextResponse.json({ error: "유효한 시간(5분 이상)을 입력하세요" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    const appointmentType = await prisma.appointmentType.findFirst({
      where: { id: typeId, userId: user.id, isActive: true },
    });

    if (!appointmentType) {
      return NextResponse.json({ error: "Appointment type not found" }, { status: 404 });
    }

    const schedule = await prisma.schedule.findFirst({
      where: { userId: user.id, isDefault: true },
      include: {
        weeklyHours: {
          include: { timeSlots: true },
        },
        dateOverrides: true,
      },
    });

    if (!schedule) {
      return NextResponse.json({ error: "Schedule not found" }, { status: 404 });
    }

    const startDate = date ? new Date(date) : new Date();
    const endDate = date ? new Date(new Date(date).getTime() + 86400000) : undefined;

    const existingBookings = await prisma.booking.findMany({
      where: {
        userId: user.id,
        status: { in: ["PENDING", "CONFIRMED"] },
        startTime: { gte: startDate },
        ...(endDate && { startTime: { lt: endDate } }),
      },
      select: {
        startTime: true,
        endTime: true,
        status: true,
      },
    });

    const duration = durationParam ? parseInt(durationParam) : appointmentType.duration;

    const slots = generateAvailableSlots(
      {
        slotDuration: schedule.slotDuration,
        bufferBefore: schedule.bufferBefore,
        bufferAfter: schedule.bufferAfter,
        minNotice: schedule.minNotice,
        maxAdvance: schedule.maxAdvance,
        maxCapacity: appointmentType.maxCapacity || schedule.maxCapacity,
        weeklyHours: schedule.weeklyHours.map((wh) => ({
          dayOfWeek: wh.dayOfWeek,
          isEnabled: wh.isEnabled,
          timeSlots: wh.timeSlots.map((ts) => ({
            startTime: ts.startTime,
            endTime: ts.endTime,
          })),
        })),
        dateOverrides: schedule.dateOverrides.map((d) => ({
          date: d.date,
          isAvailable: d.isAvailable,
          startTime: d.startTime,
          endTime: d.endTime,
        })),
      },
      existingBookings,
      duration,
      date ? new Date(date) : undefined,
      endDate
    );

    return NextResponse.json(
      slots.map((slot) => ({
        start: slot.start.toISOString(),
        end: slot.end.toISOString(),
        available: slot.available,
        total: slot.total,
      }))
    );
  } catch {
    return NextResponse.json({ error: "슬롯 조회에 실패했습니다" }, { status: 500 });
  }
}
