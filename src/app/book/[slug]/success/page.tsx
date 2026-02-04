import Link from "next/link";
import { Card, CardContent, Button } from "@/components/ui";
import { CheckCircle, MessageCircle } from "lucide-react";

export default async function BookingSuccessPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4">
      <Card className="max-w-md w-full">
        <CardContent className="py-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-6">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">예약 신청 완료!</h1>

          <p className="text-gray-600 mb-6">
            입력하신 연락처로 확인 알림톡이 발송됩니다.
          </p>

          <div className="bg-blue-50 rounded-lg p-4 mb-6 text-left">
            <div className="flex items-start gap-3">
              <MessageCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">다음 단계</p>
                <ol className="list-decimal list-inside space-y-1 text-blue-700">
                  <li>카카오톡 알림톡을 확인해주세요</li>
                  <li>&quot;예약 확정하기&quot; 버튼을 눌러주세요</li>
                  <li>예약이 최종 확정됩니다</li>
                </ol>
              </div>
            </div>
          </div>

          <p className="text-sm text-gray-500 mb-6">
            24시간 내 확정하지 않으면 예약이 자동 취소됩니다
          </p>

          <Link href={`/book/${slug}`}>
            <Button variant="outline" className="w-full">
              다른 예약하기
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
