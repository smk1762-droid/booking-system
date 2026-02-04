import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const appointmentTypes = await prisma.appointmentType.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(appointmentTypes);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();

    const appointmentType = await prisma.appointmentType.create({
      data: {
        userId: session.user.id,
        name: body.name,
        description: body.description,
        duration: body.duration,
        minDuration: body.minDuration,
        maxDuration: body.maxDuration,
        maxCapacity: body.maxCapacity,
        color: body.color || "#3B82F6",
        requirePhone: body.requirePhone ?? true,
        requireEmail: body.requireEmail ?? false,
        customFields: body.customFields,
      },
    });

    return NextResponse.json(appointmentType);
  } catch (error) {
    console.error("Failed to create appointment type:", error);
    return NextResponse.json({ error: "Failed to create appointment type" }, { status: 500 });
  }
}
