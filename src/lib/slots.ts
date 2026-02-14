import { addDays, addMinutes, format, isBefore, isAfter, startOfDay, setHours, setMinutes } from "date-fns";

interface TimeSlot {
  startTime: string;
  endTime: string;
}

interface WeeklyHours {
  dayOfWeek: number;
  isEnabled: boolean;
  timeSlots: TimeSlot[];
}

interface DateOverride {
  date: Date;
  isAvailable: boolean;
  startTime?: string | null;
  endTime?: string | null;
}

interface ScheduleConfig {
  slotDuration: number;
  bufferBefore: number;
  bufferAfter: number;
  minNotice: number;
  maxAdvance: number;
  maxCapacity: number;
  weeklyHours: WeeklyHours[];
  dateOverrides: DateOverride[];
}

interface ExistingBooking {
  startTime: Date;
  endTime: Date;
  status: string;
}

export interface AvailableSlot {
  start: Date;
  end: Date;
  available: number;
  total: number;
}

function parseTime(timeStr: string): { hours: number; minutes: number } {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return { hours, minutes };
}

function setTimeOnDate(date: Date, timeStr: string): Date {
  const { hours, minutes } = parseTime(timeStr);
  return setMinutes(setHours(date, hours), minutes);
}

function getDateOverride(date: Date, overrides: DateOverride[]): DateOverride | undefined {
  const dateStr = format(date, "yyyy-MM-dd");
  return overrides.find((o) => format(o.date, "yyyy-MM-dd") === dateStr);
}

function getWeeklyHoursForDay(dayOfWeek: number, weeklyHours: WeeklyHours[]): WeeklyHours | undefined {
  return weeklyHours.find((wh) => wh.dayOfWeek === dayOfWeek);
}

export function generateAvailableSlots(
  config: ScheduleConfig,
  existingBookings: ExistingBooking[],
  duration: number,
  startDate?: Date,
  endDate?: Date
): AvailableSlot[] {
  const now = new Date();
  const minBookingTime = addMinutes(now, config.minNotice);
  const maxBookingDate = addDays(startOfDay(now), config.maxAdvance);

  const rangeStart = startDate ? (isBefore(startDate, minBookingTime) ? minBookingTime : startDate) : minBookingTime;
  const rangeEnd = endDate ? (isAfter(endDate, maxBookingDate) ? maxBookingDate : endDate) : maxBookingDate;

  const slots: AvailableSlot[] = [];
  let currentDate = startOfDay(rangeStart);

  while (isBefore(currentDate, rangeEnd)) {
    const dayOfWeek = currentDate.getDay();
    const override = getDateOverride(currentDate, config.dateOverrides);

    let timeRanges: { start: string; end: string }[] = [];

    if (override) {
      if (override.isAvailable && override.startTime && override.endTime) {
        timeRanges = [{ start: override.startTime, end: override.endTime }];
      }
    } else {
      const weeklyHour = getWeeklyHoursForDay(dayOfWeek, config.weeklyHours);
      if (weeklyHour?.isEnabled) {
        timeRanges = weeklyHour.timeSlots.map((ts) => ({
          start: ts.startTime,
          end: ts.endTime,
        }));
      }
    }

    for (const range of timeRanges) {
      let slotStart = setTimeOnDate(currentDate, range.start);
      const rangeEndTime = setTimeOnDate(currentDate, range.end);

      while (true) {
        const slotEnd = addMinutes(slotStart, duration);
        const slotEndWithBuffer = addMinutes(slotEnd, config.bufferAfter);

        if (isAfter(slotEndWithBuffer, rangeEndTime)) break;
        if (isBefore(slotStart, minBookingTime)) {
          slotStart = addMinutes(slotStart, config.slotDuration);
          continue;
        }

        // Count existing bookings in this slot
        const overlappingBookings = existingBookings.filter((booking) => {
          if (booking.status === "CANCELLED") return false;
          const bookingStart = new Date(booking.startTime);
          const bookingEnd = new Date(booking.endTime);
          return (
            (isBefore(bookingStart, slotEnd) && isAfter(bookingEnd, slotStart)) ||
            (isBefore(slotStart, bookingEnd) && isAfter(slotEnd, bookingStart))
          );
        });

        const booked = overlappingBookings.length;
        const available = config.maxCapacity - booked;

        if (available > 0) {
          slots.push({
            start: slotStart,
            end: slotEnd,
            available,
            total: config.maxCapacity,
          });
        }

        slotStart = addMinutes(slotStart, config.slotDuration);
      }
    }

    currentDate = addDays(currentDate, 1);
  }

  return slots;
}

export function groupSlotsByDate(slots: AvailableSlot[]): Map<string, AvailableSlot[]> {
  const grouped = new Map<string, AvailableSlot[]>();

  for (const slot of slots) {
    const dateKey = format(slot.start, "yyyy-MM-dd");
    const existing = grouped.get(dateKey) || [];
    grouped.set(dateKey, [...existing, slot]);
  }

  return grouped;
}

export function getAvailableDates(slots: AvailableSlot[]): string[] {
  const grouped = groupSlotsByDate(slots);
  return Array.from(grouped.keys()).sort();
}
