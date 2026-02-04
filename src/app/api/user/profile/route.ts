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

    // Validate slug
    if (slug) {
      const existingUser = await prisma.user.findFirst({
        where: { slug, NOT: { id: session.user.id } },
      });

      if (existingUser) {
        return NextResponse.json(
          { error: "This URL is already taken" },
          { status: 400 }
        );
      }
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        businessName: businessName || null,
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
  } catch (error) {
    console.error("Failed to update profile:", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
