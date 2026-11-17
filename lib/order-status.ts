export const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "packed",
  "shipped",
  "delivered",
  "cancelled",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  packed: "Packed",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export const ORDER_STATUS_COLORS: Record<
  OrderStatus,
  {
    badge: string;
    border: string;
    bg: string;
    text: string;
    select: string;
  }
> = {
  pending: {
    badge: "bg-amber-100 text-amber-900 border-amber-300",
    border: "border-amber-300",
    bg: "bg-amber-50",
    text: "text-amber-900",
    select: "border-amber-300 bg-amber-50 text-amber-900",
  },
  confirmed: {
    badge: "bg-blue-100 text-blue-900 border-blue-300",
    border: "border-blue-300",
    bg: "bg-blue-50",
    text: "text-blue-900",
    select: "border-blue-300 bg-blue-50 text-blue-900",
  },
  packed: {
    badge: "bg-indigo-100 text-indigo-900 border-indigo-300",
    border: "border-indigo-300",
    bg: "bg-indigo-50",
    text: "text-indigo-900",
    select: "border-indigo-300 bg-indigo-50 text-indigo-900",
  },
  shipped: {
    badge: "bg-purple-100 text-purple-900 border-purple-300",
    border: "border-purple-300",
    bg: "bg-purple-50",
    text: "text-purple-900",
    select: "border-purple-300 bg-purple-50 text-purple-900",
  },
  delivered: {
    badge: "bg-emerald-100 text-emerald-900 border-emerald-300",
    border: "border-emerald-300",
    bg: "bg-emerald-50",
    text: "text-emerald-900",
    select: "border-emerald-300 bg-emerald-50 text-emerald-900",
  },
  cancelled: {
    badge: "bg-red-100 text-red-900 border-red-300",
    border: "border-red-300",
    bg: "bg-red-50",
    text: "text-red-900",
    select: "border-red-300 bg-red-50 text-red-900",
  },
};

export function isValidOrderStatus(val: unknown): val is OrderStatus {
  if (typeof val !== "string") return false;
  const clean = val.trim().toLowerCase();
  return (ORDER_STATUSES as readonly string[]).includes(clean);
}

export function formatOrderStatus(status: unknown): string {
  const s = String(status || "").toLowerCase().trim();
  if (isValidOrderStatus(s)) {
    return ORDER_STATUS_LABELS[s];
  }
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : "Pending";
}

export function getOrderStatusColor(status: unknown): string {
  const s = String(status || "").toLowerCase().trim();
  if (isValidOrderStatus(s)) {
    return ORDER_STATUS_COLORS[s].select;
  }
  return "border-slate-300 bg-slate-50 text-slate-900";
}

export function getOrderStatusBadgeColor(status: unknown): string {
  const s = String(status || "").toLowerCase().trim();
  if (isValidOrderStatus(s)) {
    return ORDER_STATUS_COLORS[s].badge;
  }
  return "bg-slate-100 text-slate-800 border-slate-200";
}
