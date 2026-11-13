import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ success: true, message: "Logged out successfully" });
  
  // Explicitly clear the token cookie across root path
  response.cookies.set("token", "", {
    path: "/",
    expires: new Date(0),
    maxAge: 0,
    sameSite: "lax",
    httpOnly: false,
  });

  return response;
}
