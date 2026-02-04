import { Sidebar } from "@/components/layout";

// 임시 mock 유저 (개발용)
const mockUser = {
  id: "dev-user-1",
  name: "테스트 사용자",
  email: "test@example.com",
  image: null,
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 개발 모드: 인증 우회
  // const session = await auth();
  // if (!session?.user) {
  //   redirect("/login");
  // }

  return (
    <div className="flex h-screen">
      <Sidebar
        user={mockUser}
        onSignOut={async () => {
          "use server";
          console.log("로그아웃 (개발 모드)");
        }}
      />
      <main className="flex-1 overflow-y-auto p-8">{children}</main>
    </div>
  );
}
