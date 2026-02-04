import Link from "next/link";
import { Header } from "@/components/layout";
import { Button, Card, CardContent, Badge } from "@/components/ui";
import { Plus, Clock, Users, Edit2 } from "lucide-react";
import { formatDuration } from "@/lib/utils";

// Mock 데이터 (개발용)
const mockAppointmentTypes = [
  {
    id: "1",
    name: "신규 입학 상담",
    description: "신규 학생 및 학부모 대상 입학 상담입니다.",
    duration: 30,
    minDuration: 30,
    maxDuration: 60,
    maxCapacity: 1,
    color: "#3B82F6",
    isActive: true,
    _count: { bookings: 12 },
  },
  {
    id: "2",
    name: "사전 테스트 (고등)",
    description: "고등학생 대상 레벨 테스트",
    duration: 60,
    minDuration: null,
    maxDuration: null,
    maxCapacity: 5,
    color: "#10B981",
    isActive: true,
    _count: { bookings: 8 },
  },
  {
    id: "3",
    name: "학부모 상담",
    description: "재원생 학부모 상담",
    duration: 30,
    minDuration: null,
    maxDuration: null,
    maxCapacity: 1,
    color: "#F59E0B",
    isActive: true,
    _count: { bookings: 5 },
  },
  {
    id: "4",
    name: "사전 테스트 (중등)",
    description: null,
    duration: 60,
    minDuration: null,
    maxDuration: null,
    maxCapacity: 5,
    color: "#8B5CF6",
    isActive: false,
    _count: { bookings: 3 },
  },
];

export default async function AppointmentTypesPage() {
  const appointmentTypes = mockAppointmentTypes;

  return (
    <div>
      <Header
        title="일정 유형"
        description="예약 가능한 일정 유형을 관리합니다"
        actions={
          <Link href="/appointment-types/new">
            <Button variant="primary">
              <Plus className="w-4 h-4 mr-2" />새 일정 유형
            </Button>
          </Link>
        }
      />

      {appointmentTypes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full mb-4">
              <Clock className="w-6 h-6 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">일정 유형이 없습니다</h3>
            <p className="text-gray-500 mb-4">
              예약을 받으려면 먼저 일정 유형을 만들어야 합니다
            </p>
            <Link href="/appointment-types/new">
              <Button variant="primary">
                <Plus className="w-4 h-4 mr-2" />첫 번째 일정 유형 만들기
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {appointmentTypes.map((type) => (
            <Card key={type.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: type.color }}
                    />
                    <h3 className="text-lg font-semibold text-gray-900">{type.name}</h3>
                  </div>
                  <Badge variant={type.isActive ? "success" : "secondary"}>
                    {type.isActive ? "활성" : "비활성"}
                  </Badge>
                </div>

                {type.description && (
                  <p className="text-sm text-gray-500 mb-4 line-clamp-2">{type.description}</p>
                )}

                <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {type.minDuration && type.maxDuration
                      ? `${formatDuration(type.minDuration)} - ${formatDuration(type.maxDuration)}`
                      : formatDuration(type.duration)}
                  </div>
                  {type.maxCapacity && (
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      최대 {type.maxCapacity}명
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <span className="text-sm text-gray-500">
                    예약 {type._count.bookings}건
                  </span>
                  <Link href={`/appointment-types/${type.id}`}>
                    <Button variant="ghost" size="sm">
                      <Edit2 className="w-4 h-4 mr-1" />
                      수정
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
