import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      businessName: true,
      slug: true,
      timezone: true,
      licenseStatus: true,
      licenseExpiry: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json(user);
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { businessName, slug } = body;

    if (businessName && (typeof businessName !== "string" || businessName.length > 100)) {
      return NextResponse.json({ error: "사업장 이름은 100자를 초과할 수 없습니다" }, { status: 400 });
    }

    if (slug) {
      if (typeof slug !== "string" || !/^[a-z0-9-]+$/.test(slug) || slug.length > 50) {
        return NextResponse.json({ error: "URL은 영소문자, 숫자, 하이픈만 사용 가능합니다 (50자 이내)" }, { status: 400 });
      }

      const existingUser = await prisma.user.findFirst({
        where: { slug, NOT: { id: session.user.id } },
      });

      if (existingUser) {
        return NextResponse.json(
          { error: "이미 사용 중인 URL입니다" },
          { status: 400 }
        );
      }
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        businessName: businessName?.trim() || null,
        slug: slug || null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        businessName: true,
        slug: true,
        timezone: true,
      },
    });

    return NextResponse.json(user);
  } catch {
    return NextResponse.json({ error: "프로필 업데이트에 실패했습니다" }, { status: 500 });
  }
}
