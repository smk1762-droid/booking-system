"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, Button } from "@/components/ui";
import { XCircle, Calendar, Clock, User, AlertCircle, CheckCircle } from "lucide-react";
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

export default function CancelBookingPage() {
  const params = useParams();
  const token = params.token as string;

  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [booking, setBooking] = useState<BookingInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cancelled, setCancelled] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const fetchBooking = useCallback(async () => {
    try {
      const response = await fetch(`/api/public/bookings/${token}?type=cancel`);
      if (response.ok) {
        const data = await response.json();
        setBooking(data);
        if (data.status === "CANCELLED") {
          setCancelled(true);
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

  const handleCancel = async () => {
    setCancelling(true);
    try {
      const response = await fetch(`/api/public/bookings/cancel/${token}`, {
        method: "POST",
      });

      if (response.ok) {
        setCancelled(true);
        setShowConfirm(false);
      } else {
        const data = await response.json();
        setError(data.error || "예약 취소에 실패했습니다");
      }
    } catch {
      setError("예약 취소에 실패했습니다");
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center py-12 px-4">
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

  if (cancelled) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center py-12 px-4">
        <Card className="max-w-md w-full">
          <CardContent className="py-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-6">
              <CheckCircle className="w-8 h-8 text-gray-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">예약이 취소되었습니다</h1>
            <p className="text-gray-600">
              예약이 정상적으로 취소되었습니다
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center py-12 px-4">
      <Card className="max-w-md w-full">
        <CardContent className="py-8">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mb-4">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">예약 취소</h1>
          </div>

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

              {!showConfirm ? (
                <>
                  <p className="text-sm text-gray-500 text-center mb-6">
                    위 예약을 취소하시겠습니까?
                  </p>

                  <Button
                    variant="danger"
                    size="lg"
                    className="w-full"
                    onClick={() => setShowConfirm(true)}
                  >
                    예약 취소하기
                  </Button>
                </>
              ) : (
                <>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                    <p className="text-sm text-yellow-800 font-medium text-center">
                      정말 예약을 취소하시겠습니까?
                    </p>
                    <p className="text-sm text-yellow-700 text-center mt-1">
                      취소 후에는 되돌릴 수 없습니다
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      size="lg"
                      className="flex-1"
                      onClick={() => setShowConfirm(false)}
                      disabled={cancelling}
                    >
                      돌아가기
                    </Button>
                    <Button
                      variant="danger"
                      size="lg"
                      className="flex-1"
                      onClick={handleCancel}
                      loading={cancelling}
                    >
                      취소 확정
                    </Button>
                  </div>
                </>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
