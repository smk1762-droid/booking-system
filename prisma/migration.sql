-- Booking System 전체 마이그레이션 (초기 생성)
-- Supabase SQL Editor에서 실행하세요

-- =============================================
-- Enums
-- =============================================

CREATE TYPE "LicenseStatus" AS ENUM ('TRIAL', 'ACTIVE', 'EXPIRED', 'SUSPENDED');
CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW');
CREATE TYPE "NotificationType" AS ENUM ('BOOKING_CREATED', 'BOOKING_CONFIRMED', 'BOOKING_CANCELLED', 'BOOKING_REMINDER');
CREATE TYPE "NotificationChannel" AS ENUM ('KAKAO_ALIMTALK', 'DISCORD', 'WEBHOOK', 'EMAIL');
CREATE TYPE "NotificationStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');
CREATE TYPE "WebhookEvent" AS ENUM ('BOOKING_CREATED', 'BOOKING_CONFIRMED', 'BOOKING_CANCELLED', 'BOOKING_COMPLETED');

-- =============================================
-- Auth.js v5 Tables
-- =============================================

CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- =============================================
-- User (Business Owner)
-- =============================================

CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "businessName" TEXT,
    "slug" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Seoul',
    "licenseKey" TEXT,
    "licenseStatus" "LicenseStatus" NOT NULL DEFAULT 'TRIAL',
    "licenseExpiry" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- =============================================
-- Schedule Presets
-- =============================================

CREATE TABLE "SchedulePreset" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "weeklyHours" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SchedulePreset_pkey" PRIMARY KEY ("id")
);

-- =============================================
-- Schedule Settings
-- =============================================

CREATE TABLE "Schedule" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT '기본 스케줄',
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "slotDuration" INTEGER NOT NULL DEFAULT 30,
    "bufferBefore" INTEGER NOT NULL DEFAULT 0,
    "bufferAfter" INTEGER NOT NULL DEFAULT 0,
    "minNotice" INTEGER NOT NULL DEFAULT 60,
    "maxAdvance" INTEGER NOT NULL DEFAULT 30,
    "maxCapacity" INTEGER NOT NULL DEFAULT 1,
    "allowCancellation" BOOLEAN NOT NULL DEFAULT true,
    "cancelNotice" INTEGER NOT NULL DEFAULT 1440,
    "reopenOnCancel" BOOLEAN NOT NULL DEFAULT true,
    "autoConfirm" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Schedule_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WeeklyHours" (
    "id" TEXT NOT NULL,
    "scheduleId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "WeeklyHours_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TimeSlot" (
    "id" TEXT NOT NULL,
    "weeklyHoursId" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    CONSTRAINT "TimeSlot_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DateOverride" (
    "id" TEXT NOT NULL,
    "scheduleId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "isAvailable" BOOLEAN NOT NULL DEFAULT false,
    "startTime" TEXT,
    "endTime" TEXT,
    CONSTRAINT "DateOverride_pkey" PRIMARY KEY ("id")
);

-- =============================================
-- Appointment Types
-- =============================================

CREATE TABLE "AppointmentType" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "duration" INTEGER NOT NULL,
    "minDuration" INTEGER,
    "maxDuration" INTEGER,
    "maxCapacity" INTEGER,
    "color" TEXT NOT NULL DEFAULT '#3B82F6',
    "requirePhone" BOOLEAN NOT NULL DEFAULT true,
    "requireEmail" BOOLEAN NOT NULL DEFAULT false,
    "customFields" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AppointmentType_pkey" PRIMARY KEY ("id")
);

-- =============================================
-- Bookings
-- =============================================

CREATE TABLE "Booking" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "appointmentTypeId" TEXT NOT NULL,
    "guestName" TEXT NOT NULL,
    "guestPhone" TEXT NOT NULL,
    "guestEmail" TEXT,
    "customData" JSONB,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "duration" INTEGER NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'PENDING',
    "confirmToken" TEXT NOT NULL,
    "cancelToken" TEXT NOT NULL,
    "tokenExpiresAt" TIMESTAMP(3),
    "internalNote" TEXT,
    "guestNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "confirmedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- =============================================
-- Notifications
-- =============================================

CREATE TABLE "BookingNotification" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "status" "NotificationStatus" NOT NULL,
    "sentAt" TIMESTAMP(3),
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BookingNotification_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "NotificationSetting" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "config" JSONB NOT NULL,
    "events" "NotificationType"[],
    CONSTRAINT "NotificationSetting_pkey" PRIMARY KEY ("id")
);

-- =============================================
-- Webhooks
-- =============================================

CREATE TABLE "Webhook" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "secret" TEXT NOT NULL,
    "events" "WebhookEvent"[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Webhook_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WebhookLog" (
    "id" TEXT NOT NULL,
    "webhookId" TEXT NOT NULL,
    "event" "WebhookEvent" NOT NULL,
    "payload" JSONB NOT NULL,
    "statusCode" INTEGER,
    "response" TEXT,
    "error" TEXT,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WebhookLog_pkey" PRIMARY KEY ("id")
);

-- =============================================
-- Unique Indexes
-- =============================================

CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_slug_key" ON "User"("slug");
CREATE UNIQUE INDEX "User_licenseKey_key" ON "User"("licenseKey");
CREATE UNIQUE INDEX "WeeklyHours_scheduleId_dayOfWeek_key" ON "WeeklyHours"("scheduleId", "dayOfWeek");
CREATE UNIQUE INDEX "DateOverride_scheduleId_date_key" ON "DateOverride"("scheduleId", "date");
CREATE UNIQUE INDEX "Booking_confirmToken_key" ON "Booking"("confirmToken");
CREATE UNIQUE INDEX "Booking_cancelToken_key" ON "Booking"("cancelToken");
CREATE UNIQUE INDEX "NotificationSetting_userId_channel_key" ON "NotificationSetting"("userId", "channel");

-- =============================================
-- Performance Indexes
-- =============================================

CREATE INDEX "Account_userId_idx" ON "Account"("userId");
CREATE INDEX "Session_userId_idx" ON "Session"("userId");
CREATE INDEX "SchedulePreset_userId_idx" ON "SchedulePreset"("userId");
CREATE INDEX "Schedule_userId_idx" ON "Schedule"("userId");
CREATE INDEX "WeeklyHours_scheduleId_idx" ON "WeeklyHours"("scheduleId");
CREATE INDEX "TimeSlot_weeklyHoursId_idx" ON "TimeSlot"("weeklyHoursId");
CREATE INDEX "DateOverride_scheduleId_idx" ON "DateOverride"("scheduleId");
CREATE INDEX "AppointmentType_userId_idx" ON "AppointmentType"("userId");
CREATE INDEX "AppointmentType_isActive_idx" ON "AppointmentType"("isActive");
CREATE INDEX "AppointmentType_userId_isActive_idx" ON "AppointmentType"("userId", "isActive");
CREATE INDEX "Booking_userId_idx" ON "Booking"("userId");
CREATE INDEX "Booking_appointmentTypeId_idx" ON "Booking"("appointmentTypeId");
CREATE INDEX "Booking_status_idx" ON "Booking"("status");
CREATE INDEX "Booking_startTime_idx" ON "Booking"("startTime");
CREATE INDEX "Booking_confirmToken_idx" ON "Booking"("confirmToken");
CREATE INDEX "Booking_cancelToken_idx" ON "Booking"("cancelToken");
CREATE INDEX "Booking_userId_status_startTime_idx" ON "Booking"("userId", "status", "startTime");
CREATE INDEX "BookingNotification_bookingId_idx" ON "BookingNotification"("bookingId");
CREATE INDEX "NotificationSetting_userId_idx" ON "NotificationSetting"("userId");
CREATE INDEX "Webhook_userId_idx" ON "Webhook"("userId");
CREATE INDEX "WebhookLog_webhookId_idx" ON "WebhookLog"("webhookId");
CREATE INDEX "WebhookLog_sentAt_idx" ON "WebhookLog"("sentAt");

-- =============================================
-- Foreign Keys
-- =============================================

ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SchedulePreset" ADD CONSTRAINT "SchedulePreset_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Schedule" ADD CONSTRAINT "Schedule_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WeeklyHours" ADD CONSTRAINT "WeeklyHours_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "Schedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TimeSlot" ADD CONSTRAINT "TimeSlot_weeklyHoursId_fkey" FOREIGN KEY ("weeklyHoursId") REFERENCES "WeeklyHours"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DateOverride" ADD CONSTRAINT "DateOverride_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "Schedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AppointmentType" ADD CONSTRAINT "AppointmentType_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_appointmentTypeId_fkey" FOREIGN KEY ("appointmentTypeId") REFERENCES "AppointmentType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "BookingNotification" ADD CONSTRAINT "BookingNotification_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "NotificationSetting" ADD CONSTRAINT "NotificationSetting_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Webhook" ADD CONSTRAINT "Webhook_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WebhookLog" ADD CONSTRAINT "WebhookLog_webhookId_fkey" FOREIGN KEY ("webhookId") REFERENCES "Webhook"("id") ON DELETE CASCADE ON UPDATE CASCADE;
