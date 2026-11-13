import AdminSidebar from "@/components/admin/AdminSidebar";

export const instant = false;
export const metadata = { title: "Uppilies Admin" };

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-[#F5F8F4] md:flex-row">
      <AdminSidebar />
      <main className="flex-1 overflow-x-hidden p-4 sm:p-8">{children}</main>
    </div>
  );
}