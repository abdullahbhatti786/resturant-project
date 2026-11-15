import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import connectToDatabase from "@/lib/db";
import MenuCategory from "@/models/MenuCategory";
import MenuItem from "@/models/MenuItem";
import { getStaffSession, hasStaffRole, getEffectiveRestaurantId } from "@/lib/session";

const UpdateCategorySchema = z.object({
  name: z.string().min(1, "Category name is required").trim().optional(),
  sortOrder: z.number().int().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getStaffSession();
    if (!hasStaffRole(session, ["owner"])) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const restaurantId = getEffectiveRestaurantId(session);
    const body = await req.json();
    const parsed = UpdateCategorySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: parsed.error.issues[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const category = await MenuCategory.findOneAndUpdate(
      { _id: params.id, restaurantId },
      { $set: parsed.data },
      { new: true }
    );

    if (!category) {
      return NextResponse.json({ success: false, message: "Category not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, category });
  } catch (err: unknown) {
    console.error("Category PATCH error:", err);
    return NextResponse.json({ success: false, message: "Failed to update category" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getStaffSession();
    if (!hasStaffRole(session, ["owner"])) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const restaurantId = getEffectiveRestaurantId(session);
    await connectToDatabase();

    // Check if category has items
    const itemCount = await MenuItem.countDocuments({
      restaurantId,
      categoryId: params.id,
    });

    if (itemCount > 0) {
      return NextResponse.json(
        {
          success: false,
          message: `Cannot delete category: it has ${itemCount} items. Move or delete them first.`,
        },
        { status: 400 }
      );
    }

    const deleted = await MenuCategory.findOneAndDelete({
      _id: params.id,
      restaurantId,
    });

    if (!deleted) {
      return NextResponse.json({ success: false, message: "Category not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Category deleted" });
  } catch (err: unknown) {
    console.error("Category DELETE error:", err);
    return NextResponse.json({ success: false, message: "Failed to delete category" }, { status: 500 });
  }
}
