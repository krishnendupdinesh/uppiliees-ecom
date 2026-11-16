import { connection } from "next/server";
import UsersClient from "./UsersClient";
import { getRegisteredUsers } from "@/lib/admin/db";

export const dynamic = "force-dynamic";
export const metadata = { title: "Registered Users | Uppilies Admin" };

export default async function AdminUsersPage() {
  await connection();
  const users = await getRegisteredUsers();

  return <UsersClient initialUsers={users} />;
}
