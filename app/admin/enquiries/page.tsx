import { connection } from "next/server";
import EnquiriesClient from "./EnquiriesClient";
import { getContactMessages } from "@/lib/admin/db";

export const dynamic = "force-dynamic";
export const metadata = { title: "Customer Enquiries | Uppilies Admin" };

export default async function AdminEnquiriesPage() {
  await connection();
  const messages = await getContactMessages();

  return <EnquiriesClient initialMessages={messages} />;
}
