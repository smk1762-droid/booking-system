import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Header } from "@/components/layout";
import { Card, CardContent, Badge, Button } from "@/components/ui";
import { Calendar, Phone, Clock } from "lucide-react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

export default async function BookingsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const bookings = await prisma.booking.findMany({
    where: { userId: session.user.id },
    include: {
      appointmentType: {
        select: { name: true, color: true },
      },
    },
    orderBy: { startTime: "desc" },
  });

  const statusColors = {
    PENDING: "warning",
    CONFIRMED: "success",
    CANCELLED: "danger",
    COMPLETED: "secondary",
    NO_SHOW: "danger",
  } as const;

  const statusLabels = {
    PENDING: "확인 대기",
    CONFIRMED: "확정",
    CANCELLED: "취소",
    COMPLETED: "완료",
    NO_SHOW: "노쇼",
  };

  const groupedBookings = bookings.reduce(
    (acc, booking) => {
      const dateKey = format(booking.startTime, "yyyy-MM-dd");
      return {
        ...acc,
        [dateKey]: [...(acc[dateKey] || []), booking],
      };
    },
    {} as Record<string, typeof bookings>
  );

  return (
    <div>
      <Header
        title="예약 관리"
        description="모든 예약을 확인하고 관리합니다"
      />

      {bookings.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full mb-4">
              <Calendar className="w-6 h-6 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">예약이 없습니다</h3>
            <p className="text-gray-500">
              예약 링크를 공유하여 첫 예약을 받아보세요
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {[...Object.entries(groupedBookings)]
            .sort(([a], [b]) => b.localeCompare(a))
            .map(([date, dateBookings]) => (
              <div key={date}>
                <h3 className="text-sm font-medium text-gray-500 mb-3">
                  {format(new Date(date), "yyyy년 M월 d일 (EEE)", { locale: ko })}
                </h3>
                <div className="space-y-3">
                  {dateBookings.map((booking) => (
                    <Card key={booking.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-4">
                            <div
                              className="w-1 h-16 rounded-full flex-shrink-0"
                              style={{ backgroundColor: booking.appointmentType.color }}
                            />
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold text-gray-900">
                                  {booking.guestName}
                                </span>
                                <Badge variant={statusColors[booking.status]} size="sm">
                                  {statusLabels[booking.status]}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600 mb-2">
                                {booking.appointmentType.name}
                              </p>
                              <div className="flex items-center gap-4 text-sm text-gray-500">
                                <div className="flex items-center gap-1">
                                  <Clock className="w-4 h-4" />
                                  {format(booking.startTime, "HH:mm")} ({booking.duration}분)
                                </div>
                                <div className="flex items-center gap-1">
                                  <Phone className="w-4 h-4" />
                                  {booking.guestPhone}
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {booking.status === "PENDING" && (
                              <Button variant="ghost" size="sm">
                                확정
                              </Button>
                            )}
                            {(booking.status === "PENDING" || booking.status === "CONFIRMED") && (
                              <Button variant="ghost" size="sm">
                                취소
                              </Button>
                            )}
                          </div>
                        </div>
                        {booking.guestNote && (
                          <div className="mt-3 pt-3 border-t border-gray-100">
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">메모:</span> {booking.guestNote}
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
