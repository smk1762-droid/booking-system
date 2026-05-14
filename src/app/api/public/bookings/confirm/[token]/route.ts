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
    `confirm:${ip}`,
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

    // 낙관적 잠금: PENDING + 만료되지 않은 토큰만 통과.
    // 동시 요청이 들어와도 updateMany는 한 트랜잭션에서 처리되므로 count가 1을 넘지 않는다.
    const result = await prisma.booking.updateMany({
      where: {
        confirmToken: token,
        status: "PENDING",
        tokenExpiresAt: { gt: now },
      },
      data: {
        status: "CONFIRMED",
        confirmedAt: now,
      },
    });

    if (result.count === 0) {
      // count===0 사유를 분기하기 위해 한 번 더 조회 (드문 경로)
      const existing = await prisma.booking.findFirst({
        where: { confirmToken: token },
        select: { id: true, status: true, tokenExpiresAt: true },
      });

      if (!existing) {
        return NextResponse.json(
          { error: "예약을 찾을 수 없습니다" },
          { status: 404 },
        );
      }
      // tokenExpiresAt 정책: 예약 생성 시 24h 후로 항상 설정됨. null이면 데이터 이상.
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
      if (existing.status === "CONFIRMED") {
        return NextResponse.json({
          id: existing.id,
          status: "CONFIRMED",
          message: "이미 확정된 예약입니다",
        });
      }
      if (existing.status === "CANCELLED") {
        return NextResponse.json(
          { error: "취소된 예약입니다" },
          { status: 400 },
        );
      }
      // COMPLETED / NO_SHOW 등 — 또는 동시 처리에 의해 막 상태가 바뀐 경우
      return NextResponse.json(
        { error: "이미 처리된 예약입니다" },
        { status: 409 },
      );
    }

    // 정상 확정. 알림 발송용으로 id를 한 번 조회한다 (confirmToken은 unique).
    const updated = await prisma.booking.findFirst({
      where: { confirmToken: token },
      select: { id: true },
    });

    if (!updated) {
      // updateMany는 성공했는데 직후 조회가 실패한 극단적 경우.
      // 상태는 이미 CONFIRMED로 굳었으므로 성공 응답.
      return NextResponse.json({
        status: "CONFIRMED",
        message: "예약이 확정되었습니다",
      });
    }

    // 알림은 부수적이므로 fire-and-forget. 결과는 BookingNotification 행으로 추적.
    void sendBookingNotification(updated.id, "BOOKING_CONFIRMED").catch(() => {
      // BookingNotification.FAILED 행으로 추적됨
    });

    return NextResponse.json({
      id: updated.id,
      status: "CONFIRMED",
      message: "예약이 확정되었습니다",
    });
  } catch (error) {
    console.error("[confirm] 예약 확정 실패:", error);
    return NextResponse.json(
      { error: "예약 확정에 실패했습니다" },
      { status: 500 },
    );
  }
}
