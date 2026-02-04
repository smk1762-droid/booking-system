// Re-export Prisma types
export type {
  User,
  Schedule,
  WeeklyHours,
  TimeSlot,
  DateOverride,
  AppointmentType,
  Booking,
  BookingNotification,
  NotificationSetting,
  Webhook,
  WebhookLog,
} from "@prisma/client";

export type {
  BookingStatus,
  LicenseStatus,
  NotificationType,
  NotificationChannel,
  NotificationStatus,
  WebhookEvent,
} from "@prisma/client";

// Extended types with relations
export interface ScheduleWithRelations {
  id: string;
  userId: string;
  name: string;
  isDefault: boolean;
  slotDuration: number;
  bufferBefore: number;
  bufferAfter: number;
  minNotice: number;
  maxAdvance: number;
  maxCapacity: number;
  allowCancellation: boolean;
  cancelNotice: number;
  reopenOnCancel: boolean;
  weeklyHours: WeeklyHoursWithSlots[];
  dateOverrides: DateOverrideData[];
  createdAt: Date;
  updatedAt: Date;
}

export interface WeeklyHoursWithSlots {
  id: string;
  scheduleId: string;
  dayOfWeek: number;
  isEnabled: boolean;
  timeSlots: TimeSlotData[];
}

export interface TimeSlotData {
  id: string;
  weeklyHoursId: string;
  startTime: string;
  endTime: string;
}

export interface DateOverrideData {
  id: string;
  scheduleId: string;
  date: Date;
  isAvailable: boolean;
  startTime: string | null;
  endTime: string | null;
}

export interface AppointmentTypeWithBookings {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  duration: number;
  minDuration: number | null;
  maxDuration: number | null;
  maxCapacity: number | null;
  color: string;
  requirePhone: boolean;
  requireEmail: boolean;
  customFields: CustomField[] | null;
  isActive: boolean;
  bookings: BookingData[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomField {
  id: string;
  label: string;
  type: "text" | "textarea" | "select" | "checkbox" | "phone" | "email" | "number";
  required: boolean;
  placeholder?: string;
  options?: string[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
}

export interface BookingData {
  id: string;
  userId: string;
  appointmentTypeId: string;
  guestName: string;
  guestPhone: string;
  guestEmail: string | null;
  customData: Record<string, unknown> | null;
  startTime: Date;
  endTime: Date;
  duration: number;
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED" | "NO_SHOW";
  confirmToken: string;
  cancelToken: string;
  internalNote: string | null;
  guestNote: string | null;
  createdAt: Date;
  updatedAt: Date;
  confirmedAt: Date | null;
  cancelledAt: Date | null;
}

export interface BookingWithRelations extends BookingData {
  appointmentType: {
    id: string;
    name: string;
    color: string;
    duration: number;
  };
  user: {
    id: string;
    businessName: string | null;
    slug: string | null;
  };
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Webhook payload types
export interface WebhookPayload<T = unknown> {
  id: string;
  event: "booking.created" | "booking.confirmed" | "booking.cancelled" | "booking.completed";
  timestamp: string;
  data: T;
  signature: string;
}

export interface BookingEventPayload {
  booking: {
    id: string;
    status: string;
    guestName: string;
    guestPhone: string;
    guestEmail?: string;
    startTime: string;
    endTime: string;
    duration: number;
    appointmentType: {
      id: string;
      name: string;
    };
    confirmUrl?: string;
    cancelUrl?: string;
    createdAt: string;
    confirmedAt?: string;
    cancelledAt?: string;
  };
}

// Public booking types
export interface PublicBusinessInfo {
  name: string;
  slug: string;
  timezone: string;
}

export interface PublicAppointmentType {
  id: string;
  name: string;
  description: string | null;
  duration: number;
  minDuration: number | null;
  maxDuration: number | null;
  color: string;
  requirePhone: boolean;
  requireEmail: boolean;
  customFields: CustomField[] | null;
}

export interface AvailableSlot {
  start: string;
  end: string;
  available: number;
  total: number;
}

export interface CreateBookingRequest {
  appointmentTypeId: string;
  startTime: string;
  duration: number;
  guestName: string;
  guestPhone: string;
  guestEmail?: string;
  guestNote?: string;
  customData?: Record<string, unknown>;
}
