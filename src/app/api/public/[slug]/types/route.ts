import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const user = await prisma.user.findUnique({
    where: { slug },
    select: { id: true },
  });

  if (!user) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 });
  }

  const appointmentTypes = await prisma.appointmentType.findMany({
    where: { userId: user.id, isActive: true },
    select: {
      id: true,
      name: true,
      description: true,
      duration: true,
      minDuration: true,
      maxDuration: true,
      color: true,
      requirePhone: true,
      requireEmail: true,
      customFields: true,
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(appointmentTypes);
}
