"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, Button } from "@/components/ui";
import { CheckCircle, Calendar, Clock, User, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

interface BookingInfo {
  id: string;
  status: string;
  guestName: string;
  startTime: string;
  endTime: string;
  duration: number;
  appointmentType: {
    name: string;
    color: string;
  };
  user: {
    businessName: string;
  };
}

export default function ConfirmBookingPage() {
  const params = useParams();
  const token = params.token as string;

  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [booking, setBooking] = useState<BookingInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  const fetchBooking = useCallback(async () => {
    try {
      const response = await fetch(`/api/public/bookings/${token}?type=confirm`);
      if (response.ok) {
        const data = await response.json();
        setBooking(data);
        if (data.status === "CONFIRMED") {
          setConfirmed(true);
        }
      } else {
        const data = await response.json();
        setError(data.error || "예약을 찾을 수 없습니다");
      }
    } catch {
      setError("예약 정보를 불러오는데 실패했습니다");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchBooking();
  }, [fetchBooking]);

  const handleConfirm = async () => {
    setConfirming(true);
    try {
      const response = await fetch(`/api/public/bookings/confirm/${token}`, {
        method: "POST",
      });

      if (response.ok) {
        setConfirmed(true);
      } else {
        const data = await response.json();
        setError(data.error || "예약 확정에 실패했습니다");
      }
    } catch {
      setError("예약 확정에 실패했습니다");
    } finally {
      setConfirming(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4">
        <Card className="max-w-md w-full">
          <CardContent className="py-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-6">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">오류</h1>
            <p className="text-gray-600">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (confirmed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4">
        <Card className="max-w-md w-full">
          <CardContent className="py-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-6">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">예약이 확정되었습니다!</h1>
            <p className="text-gray-600 mb-6">
              예약하신 시간에 방문해주세요
            </p>

            {booking && (
              <div className="bg-gray-50 rounded-lg p-4 text-left space-y-3">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-700">
                    {format(new Date(booking.startTime), "yyyy년 M월 d일 (EEE)", { locale: ko })}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-700">
                    {format(new Date(booking.startTime), "HH:mm")} ({booking.duration}분)
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div
                    className="w-5 h-5 rounded-full"
                    style={{ backgroundColor: booking.appointmentType.color }}
                  />
                  <span className="text-gray-700">{booking.appointmentType.name}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4">
      <Card className="max-w-md w-full">
        <CardContent className="py-8">
          <h1 className="text-xl font-bold text-gray-900 text-center mb-6">예약 확정</h1>

          {booking && (
            <>
              <div className="bg-gray-50 rounded-lg p-4 space-y-3 mb-6">
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-700">{booking.guestName}님</span>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-700">
                    {format(new Date(booking.startTime), "yyyy년 M월 d일 (EEE)", { locale: ko })}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-700">
                    {format(new Date(booking.startTime), "HH:mm")} ({booking.duration}분)
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div
                    className="w-5 h-5 rounded-full"
                    style={{ backgroundColor: booking.appointmentType.color }}
                  />
                  <span className="text-gray-700">{booking.appointmentType.name}</span>
                </div>
              </div>

              <p className="text-sm text-gray-500 text-center mb-6">
                위 예약 내용이 맞으시면 아래 버튼을 눌러 확정해주세요
              </p>

              <Button
                variant="primary"
                size="lg"
                className="w-full"
                onClick={handleConfirm}
                loading={confirming}
              >
                예약 확정하기
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
