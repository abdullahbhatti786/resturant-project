import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import MenuCategory from "@/models/MenuCategory";
import MenuItem from "@/models/MenuItem";
import { getStaffSession, hasStaffRole, getEffectiveRestaurantId } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getStaffSession();
    if (!hasStaffRole(session, ["owner", "kitchen"])) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const restaurantId = getEffectiveRestaurantId(session);
    await connectToDatabase();
    const categories = await MenuCategory.find({ restaurantId }).sort({
      sortOrder: 1,
      createdAt: 1,
    });

    const items = await MenuItem.find({ restaurantId }).sort({
      createdAt: -1,
    });

    return NextResponse.json({
      success: true,
      categories,
      items,
    });
  } catch (err: unknown) {
    console.error("Owner menu GET error:", err);
    return NextResponse.json({ success: false, message: "Failed to fetch menu" }, { status: 500 });
  }
}
