import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  try {
    const booking = await prisma.booking.findFirst({
      where: { confirmToken: token },
      include: {
        user: { select: { id: true } },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (booking.status === "CONFIRMED") {
      return NextResponse.json({ message: "Booking already confirmed" });
    }

    if (booking.status === "CANCELLED") {
      return NextResponse.json({ error: "Booking has been cancelled" }, { status: 400 });
    }

    // Update booking status
    const updatedBooking = await prisma.booking.update({
      where: { id: booking.id },
      data: {
        status: "CONFIRMED",
        confirmedAt: new Date(),
      },
    });

    // TODO: Send notification to business owner via webhook/Kakao/Discord
    // This would trigger the configured notification channels

    return NextResponse.json({
      id: updatedBooking.id,
      status: updatedBooking.status,
      message: "Booking confirmed successfully",
    });
  } catch {
    return NextResponse.json({ error: "예약 확인에 실패했습니다" }, { status: 500 });
  }
}
