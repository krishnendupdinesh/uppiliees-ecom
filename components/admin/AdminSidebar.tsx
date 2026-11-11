"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, LogOut, Package, ShoppingBag, Users, Store, KeyRound } from "lucide-react";
import { api } from "@/lib/api";

const links = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/settings", label: "Settings", icon: KeyRound },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    try {
      await api("/auth/logout", { method: "POST" });
    } catch (e) {
      // ignore
    }
    router.push("/account");
    router.refresh();
  }

  return (
    <aside className="flex w-full shrink-0 flex-col bg-[#052E1D] text-[#E6EFE3] md:min-h-screen md:w-60">
      <div className="px-5 py-5 text-lg font-semibold tracking-wide">Uppilies Admin</div>
      <nav className="flex gap-1 overflow-x-auto px-3 pb-3 md:flex-1 md:flex-col md:overflow-visible">
        {links.map(({ href, label, icon: Icon }) => {
          const active = href === "/admin" ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 whitespace-nowrap rounded-md px-3 py-2 text-sm transition-colors ${
                active ? "bg-[#07552F] text-white" : "text-[#8BA894] hover:bg-[#07552F]/60 hover:text-white"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="hidden flex-col gap-1 border-t border-[#07552F] p-3 md:flex">
        <Link href="/" target="_blank" className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-[#8BA894] hover:text-white">
          <Store className="h-4 w-4" /> View store
        </Link>
        <button onClick={logout} className="flex items-center gap-3 rounded-md px-3 py-2 text-left text-sm text-[#8BA894] hover:text-white">
          <LogOut className="h-4 w-4" /> Log out
        </button>
      </div>
    </aside>
  );
}
