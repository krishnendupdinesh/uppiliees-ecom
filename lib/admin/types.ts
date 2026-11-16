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

export type OrderStatus = "pending" | "packed" | "shipped" | "delivered" | "cancelled";
export const ORDER_STATUSES: OrderStatus[] = ["pending", "packed", "shipped", "delivered", "cancelled"];

export type Order = {
  id: string;
  userId?: number | null;
  isGuest?: boolean;
  customerType?: "Registered" | "Non-registered";
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
