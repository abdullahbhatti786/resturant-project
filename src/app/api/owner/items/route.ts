import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import connectToDatabase from "@/lib/db";
import MenuItem from "@/models/MenuItem";
import MenuCategory from "@/models/MenuCategory";
import { getStaffSession, hasStaffRole, getEffectiveRestaurantId } from "@/lib/session";

const CreateItemSchema = z.object({
  categoryId: z.string().min(1, "Category is required"),
  name: z.string().min(1, "Item name is required").trim(),
  description: z.string().optional().default(""),
  price: z.number().min(0, "Price must be non-negative"),
  image: z.string().optional().default("/images/placeholder-food.svg"),
  available: z.boolean().optional().default(true),
  tags: z.array(z.string()).optional().default([]),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getStaffSession();
    if (!hasStaffRole(session, ["owner"])) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const restaurantId = getEffectiveRestaurantId(session);

    const body = await req.json();
    const parsed = CreateItemSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: parsed.error.issues[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Verify category belongs to this restaurant
    const category = await MenuCategory.findOne({
      _id: parsed.data.categoryId,
      restaurantId,
    });
    if (!category) {
      return NextResponse.json({ success: false, message: "Invalid category" }, { status: 400 });
    }

    const item = await MenuItem.create({
      restaurantId,
      ...parsed.data,
    });

    return NextResponse.json({ success: true, item }, { status: 201 });
  } catch (err: unknown) {
    console.error("Item POST error:", err);
    return NextResponse.json({ success: false, message: "Failed to create item" }, { status: 500 });
  }
}
