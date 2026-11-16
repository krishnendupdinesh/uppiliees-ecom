import { NextRequest, NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";
import { requireAdminUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

async function handleDeleteImage(req: NextRequest) {
  try {
    // 1. Protect admin route on the server
    const admin = await requireAdminUser(req);
    if (!admin) {
      return NextResponse.json(
        { error: "Forbidden: Admin access required." },
        { status: 403 }
      );
    }

    // 2. Read the publicId from the JSON request body
    const body = await req.json();
    const { publicId } = body;

    if (!publicId || typeof publicId !== "string") {
      return NextResponse.json(
        { error: "A valid publicId is required." },
        { status: 400 }
      );
    }

    // 3. Delete the image from Cloudinary using uploader.destroy(publicId)
    const result = await cloudinary.uploader.destroy(publicId);

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error: any) {
    console.error("Delete image error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to delete image." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  return handleDeleteImage(req);
}

export async function DELETE(req: NextRequest) {
  return handleDeleteImage(req);
}
