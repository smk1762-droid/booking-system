import { Header } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle, Badge } from "@/components/ui";
import { Calendar, CalendarCheck, Clock, Users } from "lucide-react";
import { formatDate, formatTime } from "@/lib/utils";

// Mock 데이터 (개발용)
const mockStats = {
  todayBookings: 3,
  pendingBookings: 2,
  totalBookings: 15,
  appointmentTypes: 4,
};

const mockUpcomingBookings = [
  {
    id: "1",
    guestName: "김철수",
    startTime: new Date(Date.now() + 1000 * 60 * 60 * 2), // 2시간 후
    status: "CONFIRMED" as const,
    appointmentType: { name: "신규 입학 상담", color: "#3B82F6" },
  },
  {
    id: "2",
    guestName: "이영희",
    startTime: new Date(Date.now() + 1000 * 60 * 60 * 5), // 5시간 후
    status: "PENDING" as const,
    appointmentType: { name: "사전 테스트 (고등)", color: "#10B981" },
  },
  {
    id: "3",
    guestName: "박민수",
    startTime: new Date(Date.now() + 1000 * 60 * 60 * 24), // 내일
    status: "CONFIRMED" as const,
    appointmentType: { name: "학부모 상담", color: "#F59E0B" },
  },
];

export default async function DashboardPage() {
  const stats = mockStats;
  const upcomingBookings = mockUpcomingBookings;

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

  return (
    <div>
      <Header
        title="안녕하세요, 테스트 사용자님"
        description="오늘의 예약 현황을 확인하세요"
      />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="flex items-center gap-4 py-6">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">오늘 예약</p>
              <p className="text-2xl font-bold text-gray-900">{stats.todayBookings}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 py-6">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">확인 대기</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pendingBookings}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 py-6">
            <div className="p-3 bg-green-100 rounded-lg">
              <CalendarCheck className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">총 예약</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalBookings}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 py-6">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">일정 유형</p>
              <p className="text-2xl font-bold text-gray-900">{stats.appointmentTypes}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Bookings */}
      <Card>
        <CardHeader>
          <CardTitle>다가오는 예약</CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingBookings.length === 0 ? (
            <p className="text-gray-500 text-center py-8">예정된 예약이 없습니다</p>
          ) : (
            <div className="space-y-4">
              {upcomingBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="w-1 h-12 rounded-full"
                      style={{ backgroundColor: booking.appointmentType.color }}
                    />
                    <div>
                      <p className="font-medium text-gray-900">{booking.guestName}</p>
                      <p className="text-sm text-gray-500">
                        {booking.appointmentType.name} · {formatDate(booking.startTime)}{" "}
                        {formatTime(booking.startTime)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={statusColors[booking.status]}>
                      {statusLabels[booking.status]}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
