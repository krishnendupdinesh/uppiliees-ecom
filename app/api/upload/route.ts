import { NextRequest, NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";
import { requireAdminUser } from "@/lib/auth";

// Maximum allowed file size: 5 MB in bytes
const MAX_FILE_SIZE = 5 * 1024 * 1024;

export async function POST(req: NextRequest) {
  try {
    // 1. Protect admin route on the server
    const admin = await requireAdminUser(req);
    if (!admin) {
      return NextResponse.json(
        { error: "Forbidden: Admin access required." },
        { status: 403 }
      );
    }

    // 2. Read the file from the incoming multipart FormData
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "No image file provided." },
        { status: 400 }
      );
    }

    // 3. Validate that the uploaded file is an image
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Invalid file type. Only image files are allowed." },
        { status: 400 }
      );
    }

    // 4. Validate that the file size is under 5 MB
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File is too large. Maximum allowed size is 5 MB." },
        { status: 400 }
      );
    }

    // 5. Convert the File object into a Node.js Buffer for streaming
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 6. Upload the buffer to Cloudinary in folder "uppiliees/products"
    const uploadResult = await new Promise<{ secure_url: string; public_id: string }>(
      (resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: "uppiliees/products",
            resource_type: "image",
          },
          (error, result) => {
            if (error || !result) {
              reject(error || new Error("Cloudinary upload failed"));
              return;
            }
            resolve(result);
          }
        );

        stream.end(buffer);
      }
    );

    // 7. Return the secure URL and public ID
    return NextResponse.json({
      url: uploadResult.secure_url,
      publicId: uploadResult.public_id,
    });
  } catch (error: any) {
    console.error("Image upload error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to upload image." },
      { status: 500 }
    );
  }
}
