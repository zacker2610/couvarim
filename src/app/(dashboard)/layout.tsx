import Sidebar from "@/components/Sidebar";
import BottomNav from "@/components/BottomNav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-[#F8F5F2] pt-[env(safe-area-inset-top)]">
      <Sidebar />
      <main className="flex-1 md:ml-64 p-0 sm:p-6 md:p-8 pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-8">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
