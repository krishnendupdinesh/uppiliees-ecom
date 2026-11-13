import fs from "fs";
import path from "path";
import crypto from "crypto";

export interface StoredUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  passwordHash: string; // "salt:hash"
  role: "customer";
  createdAt: string;
}

export interface StoredOrder {
  id: string;
  customerName: string;
  email: string;
  phone: string;
  address: string;
  items: { name: string; qty: number; price: number }[];
  total: number;
  status: "pending" | "packed" | "processing" | "shipped" | "delivered" | "cancelled";
  createdAt: string;
  isGuest?: boolean;
}

const DATA_DIR = path.join(process.cwd(), "data");
const USERS_FILE = path.join(DATA_DIR, "users.json");
const ORDERS_FILE = path.join(DATA_DIR, "orders.json");

function ensureFile(file: string, initialContent: string = "[]") {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, initialContent, "utf-8");
  }
}

// Password hashing using Node's standard crypto.scrypt
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, combinedHash: string): boolean {
  try {
    const [salt, storedHash] = combinedHash.split(":");
    if (!salt || !storedHash) return false;
    const hash = crypto.scryptSync(password, salt, 64).toString("hex");
    return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(storedHash, "hex"));
  } catch {
    return false;
  }
}

// User CRUD
export function getUsers(): StoredUser[] {
  ensureFile(USERS_FILE, "[]");
  try {
    const raw = fs.readFileSync(USERS_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function findUserByEmail(email: string): StoredUser | null {
  const users = getUsers();
  return users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase()) || null;
}

export function saveUser(userData: Omit<StoredUser, "id" | "role" | "createdAt">): StoredUser {
  const users = getUsers();
  const newUser: StoredUser = {
    id: "usr_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    name: userData.name.trim(),
    email: userData.email.trim().toLowerCase(),
    phone: userData.phone?.trim() || undefined,
    passwordHash: userData.passwordHash,
    role: "customer", // Enforce role always customer
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf-8");
  return newUser;
}

// Order CRUD
export function getStoredOrders(): StoredOrder[] {
  ensureFile(ORDERS_FILE, "[]");
  try {
    const raw = fs.readFileSync(ORDERS_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveStoredOrder(order: Omit<StoredOrder, "id" | "status" | "createdAt"> & { id?: string }): StoredOrder {
  const orders = getStoredOrders();
  const newOrder: StoredOrder = {
    id: order.id || "UPP-" + Date.now().toString().slice(-6),
    customerName: order.customerName,
    email: order.email.trim().toLowerCase(),
    phone: order.phone,
    address: order.address,
    items: order.items,
    total: order.total,
    status: "pending",
    createdAt: new Date().toISOString(),
    isGuest: order.isGuest ?? false,
  };

  orders.push(newOrder);
  fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2), "utf-8");
  return newOrder;
}

export function updateStoredOrderStatus(orderId: string, status: StoredOrder["status"]): boolean {
  const orders = getStoredOrders();
  const idx = orders.findIndex((o) => String(o.id) === String(orderId));
  if (idx === -1) return false;
  orders[idx].status = status;
  fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2), "utf-8");
  return true;
}

