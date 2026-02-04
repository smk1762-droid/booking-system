"use client";

import { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/layout";
import { Button, Card, CardContent, Input } from "@/components/ui";
import { Copy, ExternalLink, Check } from "lucide-react";

interface UserProfile {
  businessName: string | null;
  slug: string | null;
}

export default function BookingLinkPage() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchProfile = useCallback(async () => {
    try {
      const response = await fetch("/api/user/profile");
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
      }
    } catch (error) {
      console.error("Failed to fetch profile:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const bookingUrl = profile?.slug
    ? `${process.env.NEXT_PUBLIC_BASE_URL || window.location.origin}/book/${profile.slug}`
    : null;

  const handleCopy = async () => {
    if (!bookingUrl) return;

    try {
      await navigator.clipboard.writeText(bookingUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div>
      <Header title="예약 링크" description="예약 페이지 링크를 공유하세요" />

      <div className="max-w-2xl">
        <Card>
          <CardContent className="py-6">
            {!profile?.slug ? (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">
                  예약 링크를 만들려면 먼저 설정에서 예약 링크 주소를 설정해주세요
                </p>
                <a href="/settings">
                  <Button variant="primary">설정으로 이동</Button>
                </a>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    예약 페이지 링크
                  </label>
                  <div className="flex gap-2">
                    <Input value={bookingUrl || ""} readOnly className="flex-1" />
                    <Button variant="outline" onClick={handleCopy}>
                      {copied ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                    <a href={bookingUrl || "#"} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline">
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </a>
                  </div>
                </div>

                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="font-medium text-blue-900 mb-2">링크 공유 방법</h3>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• 웹사이트, SNS, 명함 등에 링크를 공유하세요</li>
                    <li>• 링크를 클릭하면 누구나 예약할 수 있습니다</li>
                    <li>• 예약 시 알림톡으로 확인 요청이 발송됩니다</li>
                  </ul>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
