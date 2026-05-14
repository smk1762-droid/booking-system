import "server-only";

import { prisma } from "./db";
import { getMessaging } from "./messaging";
import { env } from "./env";
import type {
  AlimtalkMessage,
  SmsMessage,
  SendResult,
} from "./messaging/types";
import type { NotificationType } from "@prisma/client";

/**
 * 알림톡 템플릿 ID 매핑.
 * 실제 값은 Solapi 콘솔에서 검수 통과한 템플릿 ID로 교체할 것.
 *
 * 환경변수 `KAKAO_TEMPLATE_PREFIX`가 있으면 앞에 자동으로 붙음.
 */
const ALIMTALK_TEMPLATE_IDS: Record<NotificationType, string> = {
  BOOKING_CREATED: "BOOKING_CREATED",
  BOOKING_CONFIRMED: "BOOKING_CONFIRMED",
  BOOKING_CANCELLED: "BOOKING_CANCELLED",
  BOOKING_REMINDER: "BOOKING_REMINDER",
};

interface BookingForNotification {
  id: string;
  guestName: string;
  guestPhone: string;
  startTime: Date;
  endTime: Date;
  confirmToken: string;
  cancelToken: string;
  appointmentType: {
    name: string;
  };
  user: {
    businessName: string | null;
    slug: string | null;
    timezone: string;
  };
}

/**
 * 예약 알림을 전송한다 (손님 대상).
 *
 * - 환경변수 미설정(`env.messagingEnabled === false`) → 조용히 skip
 * - `BookingNotification` 행을 PENDING으로 INSERT한 뒤 발송하고, 결과로 SENT/FAILED 업데이트
 * - 발송 실패는 호출자(예약 생성/확정/취소 라우트)를 깨뜨리지 않는다 — 반드시 fire-and-forget으로 호출할 것
 *
 * @param bookingId 알림을 보낼 예약 ID
 * @param type 알림 타입 (BOOKING_CREATED 등)
 */
export async function sendBookingNotification(
  bookingId: string,
  type: NotificationType,
): Promise<void> {
  const messaging = getMessaging();
  if (!messaging) return;

  const booking = await loadBookingForNotification(bookingId);
  if (!booking) return;

  const notificationId = await insertPendingNotification(booking.id, type);
  const result = await safeDispatch(messaging, booking, type);
  await updateNotificationResult(notificationId, result);
}

/**
 * 알림 발송에 필요한 최소 필드만 조회.
 */
async function loadBookingForNotification(
  bookingId: string,
): Promise<BookingForNotification | null> {
  return prisma.booking.findUnique({
    where: { id: bookingId },
    select: {
      id: true,
      guestName: true,
      guestPhone: true,
      startTime: true,
      endTime: true,
      confirmToken: true,
      cancelToken: true,
      appointmentType: { select: { name: true } },
      user: {
        select: { businessName: true, slug: true, timezone: true },
      },
    },
  });
}

/**
 * 감사 추적용 PENDING 행을 INSERT하고 id 반환.
 */
async function insertPendingNotification(
  bookingId: string,
  type: NotificationType,
): Promise<string> {
  const row = await prisma.bookingNotification.create({
    data: {
      bookingId,
      type,
      channel: "KAKAO_ALIMTALK",
      status: "PENDING",
    },
    select: { id: true },
  });
  return row.id;
}

/**
 * 발송 단계의 throw를 잡아 SendResult로 정규화 (호출자가 깨지지 않도록).
 */
async function safeDispatch(
  messaging: NonNullable<ReturnType<typeof getMessaging>>,
  booking: BookingForNotification,
  type: NotificationType,
): Promise<SendResult> {
  try {
    return await dispatchSend(messaging, booking, type);
  } catch (error) {
    return {
      success: false,
      to: booking.guestPhone,
      statusCode: "ERROR",
      statusMessage: (error instanceof Error ? error.message : String(error)).slice(0, 200),
    };
  }
}

/**
 * SendResult를 BookingNotification 행에 반영.
 */
async function updateNotificationResult(
  notificationId: string,
  result: SendResult,
): Promise<void> {
  await prisma.bookingNotification.update({
    where: { id: notificationId },
    data: {
      status: result.success ? "SENT" : "FAILED",
      sentAt: result.success ? new Date() : null,
      error: result.success
        ? null
        : `[${result.statusCode ?? "?"}] ${result.statusMessage ?? "unknown"}`.slice(0, 1000),
    },
  });
}

/**
 * 알림 타입별로 적절한 채널/템플릿/변수를 골라 발송한다.
 *
 * 알림톡 활성 시: 알림톡 (disableSms=false → 실패 시 Solapi가 SMS 폴백)
 * 알림톡 비활성 시: SMS 직접 발송
 */
async function dispatchSend(
  messaging: NonNullable<ReturnType<typeof getMessaging>>,
  booking: BookingForNotification,
  type: NotificationType,
): Promise<SendResult> {
  const variables = buildTemplateVariables(booking, type);
  const smsText = buildSmsFallbackText(booking, type, variables);

  if (env.alimtalkEnabled) {
    const message: AlimtalkMessage = {
      to: booking.guestPhone,
      templateId: ALIMTALK_TEMPLATE_IDS[type],
      variables,
      disableSms: false,
    };
    return messaging.sendAlimtalk(message);
  }

  const sms: SmsMessage = {
    to: booking.guestPhone,
    text: smsText,
  };
  return messaging.sendSms(sms);
}

/**
 * 알림톡 템플릿 변수 매핑.
 * 새 템플릿 / 변수 추가 시 여기를 업데이트하고 Solapi 콘솔의 본문과 일치시켜야 함.
 */
function buildTemplateVariables(
  booking: BookingForNotification,
  type: NotificationType,
): Record<string, string> {
  const businessName = booking.user.businessName ?? "예약 안내";
  const timeText = formatBookingTime(booking.startTime, booking.user.timezone);
  const baseUrl = env.baseUrl.replace(/\/$/, "");

  const common = {
    "#{매장명}": businessName,
    "#{이름}": booking.guestName,
    "#{예약종류}": booking.appointmentType.name,
    "#{일시}": timeText,
  };

  switch (type) {
    case "BOOKING_CREATED":
      return {
        ...common,
        "#{확정링크}": `${baseUrl}/confirm/${booking.confirmToken}`,
        "#{취소링크}": `${baseUrl}/cancel/${booking.cancelToken}`,
      };
    case "BOOKING_CONFIRMED":
    case "BOOKING_REMINDER":
      return {
        ...common,
        "#{취소링크}": `${baseUrl}/cancel/${booking.cancelToken}`,
      };
    case "BOOKING_CANCELLED":
      return common;
  }
}

/**
 * 알림톡 없을 때 사용할 SMS 본문. 한국어 + 1000자 이내.
 */
function buildSmsFallbackText(
  booking: BookingForNotification,
  type: NotificationType,
  vars: Record<string, string>,
): string {
  switch (type) {
    case "BOOKING_CREATED":
      return [
        `[${vars["#{매장명}"]}] ${vars["#{이름}"]}님의 예약이 접수되었습니다.`,
        `일시: ${vars["#{일시}"]}`,
        `종류: ${vars["#{예약종류}"]}`,
        `확정: ${vars["#{확정링크}"]}`,
        `취소: ${vars["#{취소링크}"]}`,
      ].join("\n");
    case "BOOKING_CONFIRMED":
      return [
        `[${vars["#{매장명}"]}] ${vars["#{이름}"]}님의 예약이 확정되었습니다.`,
        `일시: ${vars["#{일시}"]}`,
        `취소: ${vars["#{취소링크}"]}`,
      ].join("\n");
    case "BOOKING_CANCELLED":
      return [
        `[${vars["#{매장명}"]}] ${vars["#{이름}"]}님의 예약이 취소되었습니다.`,
        `일시: ${vars["#{일시}"]}`,
      ].join("\n");
    case "BOOKING_REMINDER":
      return [
        `[${vars["#{매장명}"]}] ${vars["#{이름}"]}님, 예약 시간이 다가옵니다.`,
        `일시: ${vars["#{일시}"]}`,
        `취소: ${vars["#{취소링크}"]}`,
      ].join("\n");
    default:
      return `[${vars["#{매장명}"]}] 예약 안내 — ${booking.guestName}님`;
  }
}

/**
 * `Date`를 사장님 타임존 기준으로 표시 (예: "2026-05-14 14:00").
 * 무효 타임존 입력 시 Asia/Seoul로 폴백.
 */
function formatBookingTime(date: Date, timezone: string): string {
  const tz = timezone || "Asia/Seoul";
  try {
    return new Intl.DateTimeFormat("ko-KR", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(date);
  } catch {
    return new Intl.DateTimeFormat("ko-KR", {
      timeZone: "Asia/Seoul",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(date);
  }
}
