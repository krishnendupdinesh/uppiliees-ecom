import { Suspense } from "react";
import CustomersContent from "./CustomersContent";

export default function CustomersPage() {
  return (
    <Suspense fallback={<p className="text-sm text-[#5b6b60]">Loading customers...</p>}>
      <CustomersContent />
    </Suspense>
  );
}
