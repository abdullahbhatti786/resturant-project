import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import MenuItem from "@/models/MenuItem";
import { getStaffSession, hasStaffRole, getEffectiveRestaurantId } from "@/lib/session";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { itemId: string } }
) {
  try {
    const session = await getStaffSession();
    // Rule: toggle availability is allowed for OWNER and KITCHEN
    if (!hasStaffRole(session, ["owner", "kitchen"])) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const restaurantId = getEffectiveRestaurantId(session);
    await connectToDatabase();
    const item = await MenuItem.findOne({
      _id: params.itemId,
      restaurantId,
    });

    if (!item) {
      return NextResponse.json({ success: false, message: "Item not found" }, { status: 404 });
    }

    item.available = !item.available;
    await item.save();

    return NextResponse.json({
      success: true,
      available: item.available,
      item,
    });
  } catch (err: unknown) {
    console.error("Item toggle error:", err);
    return NextResponse.json({ success: false, message: "Failed to toggle availability" }, { status: 500 });
  }
}
