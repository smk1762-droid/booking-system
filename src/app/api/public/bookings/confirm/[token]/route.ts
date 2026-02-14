import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { checkRateLimit, getClientIp, RATE_LIMITS } from "@/lib/rate-limit";

export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const ip = getClientIp(request);
  const { success } = checkRateLimit(`confirm:${ip}`, RATE_LIMITS.tokenAction.limit, RATE_LIMITS.tokenAction.windowMs);
  if (!success) {
    return NextResponse.json({ error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." }, { status: 429 });
  }

  const { token } = await params;

  try {
    const booking = await prisma.booking.findFirst({
      where: { confirmToken: token },
      include: {
        user: { select: { id: true } },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "예약을 찾을 수 없습니다" }, { status: 404 });
    }

    if (booking.tokenExpiresAt && booking.tokenExpiresAt < new Date()) {
      return NextResponse.json({ error: "토큰이 만료되었습니다. 예약이 자동 취소됩니다." }, { status: 410 });
    }

    if (booking.status === "CONFIRMED") {
      return NextResponse.json({ message: "이미 확정된 예약입니다" });
    }

    if (booking.status === "CANCELLED") {
      return NextResponse.json({ error: "취소된 예약입니다" }, { status: 400 });
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
