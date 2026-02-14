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

    if (!body.name || typeof body.name !== "string" || body.name.trim().length === 0) {
      return NextResponse.json({ error: "이름은 필수 항목입니다" }, { status: 400 });
    }

    if (!body.duration || typeof body.duration !== "number" || body.duration < 5) {
      return NextResponse.json({ error: "유효한 시간(5분 이상)을 입력하세요" }, { status: 400 });
    }

    if (body.name.length > 100) {
      return NextResponse.json({ error: "이름은 100자를 초과할 수 없습니다" }, { status: 400 });
    }

    if (body.description && body.description.length > 500) {
      return NextResponse.json({ error: "설명은 500자를 초과할 수 없습니다" }, { status: 400 });
    }

    const appointmentType = await prisma.appointmentType.create({
      data: {
        userId: session.user.id,
        name: body.name.trim(),
        description: body.description?.trim() || null,
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
  } catch {
    return NextResponse.json({ error: "일정 유형 생성에 실패했습니다" }, { status: 500 });
  }
}
