"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Calendar,
  CalendarClock,
  Clock,
  Settings,
  Bell,
  Webhook,
  LayoutDashboard,
  Link as LinkIcon,
  LogOut,
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const mainNav: NavItem[] = [
  { href: "/", label: "대시보드", icon: LayoutDashboard },
  { href: "/bookings", label: "예약 관리", icon: Calendar },
  { href: "/appointment-types", label: "일정 유형", icon: CalendarClock },
  { href: "/schedules", label: "스케줄 설정", icon: Clock },
];

const settingsNav: NavItem[] = [
  { href: "/settings", label: "일반 설정", icon: Settings },
  { href: "/settings/notifications", label: "알림 설정", icon: Bell },
  { href: "/settings/webhooks", label: "웹훅", icon: Webhook },
  { href: "/settings/link", label: "예약 링크", icon: LinkIcon },
];

interface SidebarProps {
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  onSignOut?: () => void;
}

export function Sidebar({ user, onSignOut }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="w-64 h-screen bg-white border-r border-gray-200 flex flex-col">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-gray-200">
        <Link href="/" className="flex items-center gap-2">
          <CalendarClock className="w-8 h-8 text-blue-600" />
          <span className="text-xl font-bold text-gray-900">예약 시스템</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-8 overflow-y-auto">
        <div>
          <h3 className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">메인</h3>
          <ul className="mt-3 space-y-1">
            {mainNav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                    pathname === item.href
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-700 hover:bg-gray-100"
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">설정</h3>
          <ul className="mt-3 space-y-1">
            {settingsNav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                    pathname === item.href || pathname.startsWith(item.href + "/")
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-700 hover:bg-gray-100"
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      {/* User */}
      {user && (
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3">
            {user.image ? (
              <img src={user.image} alt={user.name || ""} className="w-10 h-10 rounded-full" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                <span className="text-gray-600 font-medium">
                  {user.name?.charAt(0) || user.email?.charAt(0) || "?"}
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user.name || "사용자"}</p>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
            </div>
            {onSignOut && (
              <button
                onClick={onSignOut}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                title="로그아웃"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}
    </aside>
  );
}
