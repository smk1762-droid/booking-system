"use client";

import { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/layout";
import { Button, Card, CardContent, CardHeader, CardTitle, Input } from "@/components/ui";
import { Save } from "lucide-react";

interface UserProfile {
  id: string;
  name: string | null;
  email: string | null;
  businessName: string | null;
  slug: string | null;
  timezone: string;
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);

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

  const handleSave = async () => {
    if (!profile) return;

    setSaving(true);
    try {
      const response = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: profile.businessName,
          slug: profile.slug,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data);
      }
    } catch (error) {
      console.error("Failed to save profile:", error);
    } finally {
      setSaving(false);
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
      <Header
        title="일반 설정"
        description="계정 및 사업장 정보를 관리합니다"
        actions={
          <Button variant="primary" onClick={handleSave} loading={saving}>
            <Save className="w-4 h-4 mr-2" />
            저장
          </Button>
        }
      />

      <div className="max-w-2xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>사업장 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="사업장 이름"
              placeholder="예: 홍길동 학원"
              value={profile?.businessName || ""}
              onChange={(e) =>
                setProfile(profile ? { ...profile, businessName: e.target.value } : null)
              }
              hint="예약 페이지에 표시됩니다"
            />

            <Input
              label="예약 링크 주소"
              placeholder="my-business"
              value={profile?.slug || ""}
              onChange={(e) =>
                setProfile(
                  profile
                    ? { ...profile, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") }
                    : null
                )
              }
              hint={`예약 링크: ${process.env.NEXT_PUBLIC_BASE_URL || "https://..."}/book/${profile?.slug || "your-slug"}`}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>계정 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input label="이름" value={profile?.name || ""} disabled />
            <Input label="이메일" value={profile?.email || ""} disabled />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
