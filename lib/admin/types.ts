export type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
  mrp: number;
  stock: number;
  image: string;
  images?: string[];
  description: string;
  featured: boolean;
  createdAt: string;

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
  customerName: string;
  email: string;
  phone: string;
  address: string;
  items: { name: string; qty: number; price: number }[];
  total: number;
  status: OrderStatus;
  createdAt: string;
};
