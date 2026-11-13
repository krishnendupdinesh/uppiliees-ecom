export default function StatCard({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="rounded-lg border border-[#E6EFE3] bg-white p-5">
      <p className="text-sm text-[#5b6b60]">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-[#052E1D]">{value}</p>
      {hint && <p className="mt-1 text-xs text-[#8BA894]">{hint}</p>}
    </div>
  );
}