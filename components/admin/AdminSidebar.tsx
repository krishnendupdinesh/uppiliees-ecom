"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  LogOut,
  Package,
  ShoppingBag,
  Users,
  Store,
  KeyRound,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
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
  // Mobile drawer open/close
  const [mobileOpen, setMobileOpen] = useState(false);
  // Desktop collapsed (icon-only 64px) vs expanded (240px)
  const [collapsed, setCollapsed] = useState(false);

  async function logout() {
    try {
      await api("/api/auth/logout", { method: "POST" });
    } catch {
      // ignore
    }
    if (typeof document !== "undefined") {
      document.cookie = "token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT; Max-Age=0;";
    }
    router.push("/account");
    router.refresh();
  }

  return (
    <>
      {/* ── MOBILE TOP BAR ────────────────────────────────────── */}
      <header className="flex h-14 w-full items-center justify-between border-b border-[#07552F] bg-[#052E1D] px-4 text-[#E6EFE3] md:hidden">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-[#8BA894] hover:bg-[#07552F]/70 hover:text-white"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <span className="text-base font-semibold tracking-wide">Uppilies Admin</span>
        </div>

        <div className="flex items-center gap-1.5">
          <Link
            href="/"
            target="_blank"
            className="flex h-8 w-8 items-center justify-center rounded-md text-[#8BA894] hover:bg-[#07552F]/60 hover:text-white"
            title="View store"
          >
            <Store className="h-4 w-4" />
          </Link>
          <button
            type="button"
            onClick={logout}
            className="flex h-8 w-8 items-center justify-center rounded-md text-[#8BA894] hover:bg-[#07552F]/60 hover:text-white"
            title="Log out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* ── MOBILE BACKDROP OVERLAY ───────────────────────────── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs md:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── SIDEBAR DRAWER (Mobile Slide-over & Desktop Sidebar) ─ */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-[#052E1D] text-[#E6EFE3] shadow-2xl transition-all duration-300 ease-in-out md:static md:z-auto md:min-h-screen md:shadow-none ${
          /* Mobile open/close transition */
          mobileOpen ? "translate-x-0 w-64" : "-translate-x-full md:translate-x-0"
        } ${
          /* Desktop collapsed vs expanded width */
          collapsed ? "md:w-16" : "md:w-60"
        }`}
      >
        {/* Header inside sidebar */}
        <div className="flex h-14 md:h-16 items-center justify-between border-b border-[#07552F]/60 px-3 md:px-4">
          <div className="flex items-center gap-2 overflow-hidden">
            {!collapsed && (
              <span className="whitespace-nowrap text-base md:text-lg font-semibold tracking-wide text-white">
                Uppilies Admin
              </span>
            )}
            {collapsed && (
              <span className="hidden md:inline-block font-bold text-lg text-emerald-400 pl-1">
                U
              </span>
            )}
          </div>

          {/* Desktop collapse/expand toggle button */}
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            className="hidden md:flex h-8 w-8 items-center justify-center rounded-lg text-[#8BA894] hover:bg-[#07552F] hover:text-white transition-colors"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>

          {/* Mobile close button */}
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="flex md:hidden h-8 w-8 items-center justify-center rounded-lg text-[#8BA894] hover:bg-[#07552F] hover:text-white"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 space-y-1.5 p-2 md:p-3 overflow-y-auto">
          {links.map(({ href, label, icon: Icon }) => {
            const active = href === "/admin" ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                title={collapsed ? label : undefined}
                className={`group flex items-center rounded-lg py-2.5 transition-colors ${
                  collapsed ? "justify-center px-2" : "gap-3 px-3"
                } ${
                  active
                    ? "bg-[#07552F] font-medium text-white shadow-xs"
                    : "text-[#8BA894] hover:bg-[#07552F]/60 hover:text-white"
                }`}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {!collapsed && <span className="text-sm">{label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Footer actions */}
        <div className="border-t border-[#07552F]/60 p-2 md:p-3 space-y-1">
          <Link
            href="/"
            target="_blank"
            title={collapsed ? "View store" : undefined}
            className={`flex items-center rounded-lg py-2 text-sm text-[#8BA894] hover:bg-[#07552F]/60 hover:text-white transition-colors ${
              collapsed ? "justify-center px-2" : "gap-3 px-3"
            }`}
          >
            <Store className="h-5 w-5 shrink-0" />
            {!collapsed && <span>View store</span>}
          </Link>
          <button
            type="button"
            onClick={logout}
            title={collapsed ? "Log out" : undefined}
            className={`flex w-full items-center rounded-lg py-2 text-left text-sm text-[#8BA894] hover:bg-[#07552F]/60 hover:text-white transition-colors cursor-pointer border-0 bg-transparent ${
              collapsed ? "justify-center px-2" : "gap-3 px-3"
            }`}
          >
            <LogOut className="h-5 w-5 shrink-0" />
            {!collapsed && <span>Log out</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
