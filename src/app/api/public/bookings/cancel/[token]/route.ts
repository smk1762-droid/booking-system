import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { checkRateLimit, getClientIp, RATE_LIMITS } from "@/lib/rate-limit";

export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const ip = getClientIp(request);
  const { success } = checkRateLimit(`cancel:${ip}`, RATE_LIMITS.tokenAction.limit, RATE_LIMITS.tokenAction.windowMs);
  if (!success) {
    return NextResponse.json({ error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." }, { status: 429 });
  }

  const { token } = await params;

  try {
    const booking = await prisma.booking.findFirst({
      where: { cancelToken: token },
      include: {
        user: {
          select: {
            id: true,
            schedules: {
              where: { isDefault: true },
              select: { reopenOnCancel: true },
            },
          },
        },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "예약을 찾을 수 없습니다" }, { status: 404 });
    }

    if (booking.tokenExpiresAt && booking.tokenExpiresAt < new Date()) {
      return NextResponse.json({ error: "토큰이 만료되었습니다" }, { status: 410 });
    }

    if (booking.status === "CANCELLED") {
      return NextResponse.json({ message: "이미 취소된 예약입니다" });
    }

    if (booking.status === "COMPLETED") {
      return NextResponse.json({ error: "완료된 예약은 취소할 수 없습니다" }, { status: 400 });
    }

    // Check if cancellation is allowed (based on schedule settings)
    // This could be expanded to check cancelNotice time

    // Update booking status
    const updatedBooking = await prisma.booking.update({
      where: { id: booking.id },
      data: {
        status: "CANCELLED",
        cancelledAt: new Date(),
      },
    });

    // TODO: Send notification to business owner via webhook/Kakao/Discord
    // This would trigger the configured notification channels

    // Note: The reopenOnCancel setting determines if the slot becomes available again
    // This is handled automatically since cancelled bookings are excluded from slot calculation

    return NextResponse.json({
      id: updatedBooking.id,
      status: updatedBooking.status,
      message: "Booking cancelled successfully",
    });
  } catch {
    return NextResponse.json({ error: "예약 취소에 실패했습니다" }, { status: 500 });
  }
}
