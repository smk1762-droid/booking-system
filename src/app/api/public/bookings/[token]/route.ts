import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type"); // 'confirm' or 'cancel'

  const whereClause = type === "cancel" ? { cancelToken: token } : { confirmToken: token };

  const booking = await prisma.booking.findFirst({
    where: whereClause,
    select: {
      id: true,
      status: true,
      guestName: true,
      guestPhone: true,
      startTime: true,
      endTime: true,
      duration: true,
      appointmentType: {
        select: {
          name: true,
          color: true,
        },
      },
      user: {
        select: {
          businessName: true,
        },
      },
    },
  });

  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  return NextResponse.json(booking);
}
