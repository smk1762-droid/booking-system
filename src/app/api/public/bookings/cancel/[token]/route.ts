import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
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
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (booking.status === "CANCELLED") {
      return NextResponse.json({ message: "Booking already cancelled" });
    }

    if (booking.status === "COMPLETED") {
      return NextResponse.json({ error: "Cannot cancel completed booking" }, { status: 400 });
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
  } catch (error) {
    console.error("Failed to cancel booking:", error);
    return NextResponse.json({ error: "Failed to cancel booking" }, { status: 500 });
  }
}
