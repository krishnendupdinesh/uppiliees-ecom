import { NextRequest } from "next/server";
import {
  PUT as updateProductHandler,
  DELETE as deleteProductHandler,
  GET as getProductHandler,
} from "@/app/api/products/[id]/route";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;

// GET /api/admin/products/:id
export async function GET(req: NextRequest, { params }: { params: Params }) {
  return getProductHandler(req, { params });
}

// PUT /api/admin/products/:id
export async function PUT(req: NextRequest, { params }: { params: Params }) {
  return updateProductHandler(req, { params });
}

// DELETE /api/admin/products/:id
export async function DELETE(req: NextRequest, { params }: { params: Params }) {
  return deleteProductHandler(req, { params });
}
