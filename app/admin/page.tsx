import { Suspense } from "react";
import DashboardContent from "./DashboardContent";

export const dynamic = "force-dynamic";

export default function Dashboard() {
  return (
    <Suspense fallback={<p className="text-sm text-[#5b6b60]">Loading dashboard...</p>}>
      <DashboardContent />
    </Suspense>
  );
}
