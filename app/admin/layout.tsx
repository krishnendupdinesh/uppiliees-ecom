import AdminSidebar from "@/components/admin/AdminSidebar";

export const dynamic = "force-dynamic";
export const metadata = { title: "Uppilies Admin" };

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F5F8F4] md:flex">
      {/* Fixed sidebar for desktop & slide-over for mobile */}
      <AdminSidebar />
      {/* Main content scrollable with left margin matching sidebar width */}
      <main className="flex-1 overflow-x-hidden p-4 sm:p-8 min-w-0">{children}</main>
    </div>
  );
}