import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { Card, CardContent } from "@/components/ui";
import { CalendarClock, Clock, ArrowRight } from "lucide-react";
import { formatDuration } from "@/lib/utils";

async function getBusinessInfo(slug: string) {
  const user = await prisma.user.findUnique({
    where: { slug },
    select: {
      id: true,
      businessName: true,
      slug: true,
      appointmentTypes: {
        where: { isActive: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  return user;
}

export default async function PublicBookingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const business = await getBusinessInfo(slug);

  if (!business) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full shadow-sm mb-4">
            <CalendarClock className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            {business.businessName || "예약하기"}
          </h1>
          <p className="mt-2 text-gray-600">원하시는 일정 유형을 선택해주세요</p>
        </div>

        {/* Appointment Types */}
        {business.appointmentTypes.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-500">현재 예약 가능한 일정이 없습니다</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {business.appointmentTypes.map((type) => (
              <Link key={type.id} href={`/book/${slug}/${type.id}`}>
                <Card className="hover:shadow-md transition-all cursor-pointer group">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-start gap-4">
                        <div
                          className="w-2 h-12 rounded-full flex-shrink-0"
                          style={{ backgroundColor: type.color }}
                        />
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                            {type.name}
                          </h3>
                          {type.description && (
                            <p className="mt-1 text-sm text-gray-500">{type.description}</p>
                          )}
                          <div className="flex items-center gap-1 mt-2 text-sm text-gray-500">
                            <Clock className="w-4 h-4" />
                            {type.minDuration && type.maxDuration
                              ? `${formatDuration(type.minDuration)} - ${formatDuration(type.maxDuration)}`
                              : formatDuration(type.duration)}
                          </div>
                        </div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-sm text-gray-500 mt-8">
          예약 시스템 powered by 예약 시스템
        </p>
      </div>
    </div>
  );
}
