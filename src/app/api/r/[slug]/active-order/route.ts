import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import Restaurant from "@/models/Restaurant";
import Order from "@/models/Order";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;
    const { searchParams } = new URL(req.url);
    const tableParam = searchParams.get("table");

    if (!tableParam || isNaN(Number(tableParam))) {
      return NextResponse.json(
        { success: false, message: "Valid table number required" },
        { status: 400 }
      );
    }

    const tableNumber = Number(tableParam);

    await connectToDatabase();
    const restaurant = await Restaurant.findOne({ slug });
    if (!restaurant) {
      return NextResponse.json(
        { success: false, message: "Restaurant not found" },
        { status: 404 }
      );
    }

    // Look for an active, non-paid order on THIS specific table
    const activeOrder = await Order.findOne({
      restaurantId: restaurant._id,
      tableNumber,
      paymentStatus: { $ne: "paid" },
    }).sort({ createdAt: -1 });

    if (!activeOrder) {
      return NextResponse.json({
        success: true,
        hasActiveOrder: false,
        order: null,
      });
    }

    return NextResponse.json({
      success: true,
      hasActiveOrder: true,
      order: {
        id: activeOrder._id.toString(),
        tableNumber: activeOrder.tableNumber,
        total: activeOrder.total,
        status: activeOrder.status,
        paymentStatus: activeOrder.paymentStatus || "unpaid",
        itemCount: Array.isArray(activeOrder.items)
          ? activeOrder.items.reduce((acc: number, i: { quantity?: number }) => acc + (i.quantity || 1), 0)
          : 0,
        publicToken: activeOrder.publicToken,
        createdAt: activeOrder.createdAt,
      },
    });
  } catch (err: unknown) {
    console.error("Active order check error:", err);
    return NextResponse.json(
      { success: false, message: "Failed to check active order" },
      { status: 500 }
    );
  }
}
