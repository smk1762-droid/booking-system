import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { checkRateLimit, getClientIp, RATE_LIMITS } from "@/lib/rate-limit";
import { sendBookingNotification } from "@/lib/notifications";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const ip = getClientIp(request);
  const { success } = checkRateLimit(
    `cancel:${ip}`,
    RATE_LIMITS.tokenAction.limit,
    RATE_LIMITS.tokenAction.windowMs,
  );
  if (!success) {
    return NextResponse.json(
      { error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." },
      { status: 429 },
    );
  }

  const { token } = await params;

  try {
    const now = new Date();

    // 낙관적 잠금: PENDING 또는 CONFIRMED + 만료되지 않은 토큰만 통과.
    // COMPLETED / CANCELLED / NO_SHOW에서는 전이 불가.
    // 참고: cancelNotice 정책(시간 제한) 적용은 별도 이슈로 분리.
    // Schedule.reopenOnCancel 처리는 슬롯 계산에서 CANCELLED를 제외하는 방식으로 자동 처리됨.
    const result = await prisma.booking.updateMany({
      where: {
        cancelToken: token,
        status: { in: ["PENDING", "CONFIRMED"] },
        tokenExpiresAt: { gt: now },
      },
      data: {
        status: "CANCELLED",
        cancelledAt: now,
      },
    });

    if (result.count === 0) {
      const existing = await prisma.booking.findFirst({
        where: { cancelToken: token },
        select: { id: true, status: true, tokenExpiresAt: true },
      });

      if (!existing) {
        return NextResponse.json(
          { error: "예약을 찾을 수 없습니다" },
          { status: 404 },
        );
      }
      if (existing.tokenExpiresAt === null) {
        return NextResponse.json(
          { error: "예약 데이터에 만료 시각이 없습니다. 관리자에게 문의하세요." },
          { status: 500 },
        );
      }
      if (existing.tokenExpiresAt < now) {
        return NextResponse.json(
          { error: "토큰이 만료되었습니다" },
          { status: 410 },
        );
      }
      if (existing.status === "CANCELLED") {
        return NextResponse.json({
          id: existing.id,
          status: "CANCELLED",
          message: "이미 취소된 예약입니다",
        });
      }
      if (existing.status === "COMPLETED") {
        return NextResponse.json(
          { error: "완료된 예약은 취소할 수 없습니다" },
          { status: 400 },
        );
      }
      // NO_SHOW 등 — 또는 동시 처리로 막 상태가 바뀐 경우
      return NextResponse.json(
        { error: "이미 처리된 예약입니다" },
        { status: 409 },
      );
    }

    // 정상 취소. 알림 발송용 id 조회.
    const updated = await prisma.booking.findFirst({
      where: { cancelToken: token },
      select: { id: true },
    });

    if (!updated) {
      // updateMany 성공 직후 조회 실패한 극단적 경우. 상태는 이미 CANCELLED로 굳음.
      return NextResponse.json({
        status: "CANCELLED",
        message: "예약이 취소되었습니다",
      });
    }

    void sendBookingNotification(updated.id, "BOOKING_CANCELLED").catch(() => {
      // BookingNotification.FAILED 행으로 추적됨
    });

    return NextResponse.json({
      id: updated.id,
      status: "CANCELLED",
      message: "예약이 취소되었습니다",
    });
  } catch (error) {
    console.error("[cancel] 예약 취소 실패:", error);
    return NextResponse.json(
      { error: "예약 취소에 실패했습니다" },
      { status: 500 },
    );
  }
}
