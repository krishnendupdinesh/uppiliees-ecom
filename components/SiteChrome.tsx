"use client";

import { usePathname } from "next/navigation";

// Hides the store Navbar/Footer on admin pages.
export default function SiteChrome({ children, show = "store" }: { children: React.ReactNode; show?: "store" }) {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return null;
  return <>{children}</>;
}