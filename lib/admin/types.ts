export type ProductSizeVariant = {
  size: string;
  price: number;
  mrp?: number;
  stock?: number;
};

export type Product = {
  id: string;
  name: string;
  slug?: string;
  category: string;
  category_id?: number;
  subcategory?: string;
  price: number;
  mrp: number;
  stock: number;
  in_stock: boolean;
  is_active: boolean;
  display_order?: number;
  tags?: string;
  image: string;
  publicId?: string;
  images?: string[];
  imagePublicIds?: string[];
  description: string;
  featured: boolean;
  createdAt: string;

  // Custom Sizes and Prices
  sizes?: ProductSizeVariant[];

  // Rich Product Sections
  benefits?: string;
  howToUse?: string;
  ingredients?: string;
  returnPolicy?: string;
};

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "packed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

export const ORDER_STATUSES: OrderStatus[] = [
  "pending",
  "confirmed",
  "shipped",
  "delivered",
  "cancelled",
];

export type Order = {
  id: string;
  userId?: number | null;
  isGuest?: boolean;
  customerType?: "Registered" | "Guest" | "Non-registered";
  customerName: string;
  email: string;
  phone: string;
  address: string;
  items: { name: string; qty: number; price: number; selectedSize?: string }[];
  total: number;
  status: OrderStatus;
  paymentStatus?: string;
  createdAt: string;
};

export interface ReviewItem {
  id: number;
  product_id: number;
  product_name: string;
  product_slug: string;
  user_id?: number | null;
  user_name: string;
  user_email?: string;
  rating: number;
  comment: string;
  created_at: string;
}

export interface RegisteredUser {
  id: number | string;
  name: string;
  email: string;
  phone: string;
  role: string;
  is_blocked: boolean;
  orders: number;
  spent: number;
  created_at: string;
}

export interface VisitorAnalytics {
  totalVisitors: number;
  guestVisitors: number;
  registeredVisitors: number;
  visitorsToday: number;
  registeredUsers: number;
  guestOrders: number;
  registeredOrders: number;
  totalOrders: number;
  history: Array<{
    date: string;
    count: number;
    guestCount: number;
    registeredCount: number;
  }>;
}

export interface Coupon {
  id: number;
  code: string;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  min_order_amount: number;
  max_discount?: number | null;
  usage_limit?: number | null;
  used_count: number;
  expires_at?: string | null;
  is_active: boolean;
  created_at: string;
}

export interface ContactMessage {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  topic?: string | null;
  message: string;
  status: "unread" | "read" | "replied";
  created_at: string;
}
