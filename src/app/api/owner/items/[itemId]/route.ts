import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import connectToDatabase from "@/lib/db";
import MenuItem from "@/models/MenuItem";
import MenuCategory from "@/models/MenuCategory";
import { getStaffSession, hasStaffRole, getEffectiveRestaurantId } from "@/lib/session";

const UpdateItemSchema = z.object({
  categoryId: z.string().optional(),
  name: z.string().min(1).trim().optional(),
  description: z.string().optional(),
  price: z.number().min(0).optional(),
  image: z.string().optional(),
  available: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { itemId: string } }
) {
  try {
    const session = await getStaffSession();
    if (!hasStaffRole(session, ["owner"])) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const restaurantId = getEffectiveRestaurantId(session);

    const body = await req.json();
    const parsed = UpdateItemSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: parsed.error.issues[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    if (parsed.data.categoryId) {
      const category = await MenuCategory.findOne({
        _id: parsed.data.categoryId,
        restaurantId,
      });
      if (!category) {
        return NextResponse.json({ success: false, message: "Invalid category" }, { status: 400 });
      }
    }

    const item = await MenuItem.findOneAndUpdate(
      { _id: params.itemId, restaurantId },
      { $set: parsed.data },
      { new: true }
    );

    if (!item) {
      return NextResponse.json({ success: false, message: "Item not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, item });
  } catch (err: unknown) {
    console.error("Item PATCH error:", err);
    return NextResponse.json({ success: false, message: "Failed to update item" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { itemId: string } }
) {
  try {
    const session = await getStaffSession();
    if (!hasStaffRole(session, ["owner"])) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const restaurantId = getEffectiveRestaurantId(session);

    await connectToDatabase();
    const deleted = await MenuItem.findOneAndDelete({
      _id: params.itemId,
      restaurantId,
    });

    if (!deleted) {
      return NextResponse.json({ success: false, message: "Item not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Item deleted" });
  } catch (err: unknown) {
    console.error("Item DELETE error:", err);
    return NextResponse.json({ success: false, message: "Failed to delete item" }, { status: 500 });
  }
}
