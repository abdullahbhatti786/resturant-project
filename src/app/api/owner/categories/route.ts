import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import connectToDatabase from "@/lib/db";
import MenuCategory from "@/models/MenuCategory";
import { getStaffSession, hasStaffRole, getEffectiveRestaurantId } from "@/lib/session";

const CreateCategorySchema = z.object({
  name: z.string().min(1, "Category name is required").trim(),
  sortOrder: z.number().int().optional().default(0),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getStaffSession();
    if (!hasStaffRole(session, ["owner"])) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const restaurantId = getEffectiveRestaurantId(session);
    const body = await req.json();
    const parsed = CreateCategorySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: parsed.error.issues[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const category = await MenuCategory.create({
      restaurantId,
      name: parsed.data.name,
      sortOrder: parsed.data.sortOrder,
    });

    return NextResponse.json({ success: true, category }, { status: 201 });
  } catch (err: unknown) {
    console.error("Category POST error:", err);
    return NextResponse.json({ success: false, message: "Failed to create category" }, { status: 500 });
  }
}
