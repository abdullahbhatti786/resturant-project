import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import Order from "@/models/Order";
import Restaurant from "@/models/Restaurant";
import { getStaffSession } from "@/lib/session";

export async function GET(
  req: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const orderId = params.orderId;
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    await connectToDatabase();
    const order = await Order.findById(orderId);
    if (!order) {
      return NextResponse.json({ success: false, message: "Order not found" }, { status: 404 });
    }

    // Access authorization:
    // 1. Staff session with matching restaurantId
    // 2. OR matching publicToken for customer tracking
    const staffSession = await getStaffSession();
    const isStaff =
      staffSession.isLoggedIn &&
      staffSession.restaurantId === order.restaurantId.toString();

    const isCustomerTokenMatch = token && token === order.publicToken;

    if (!isStaff && !isCustomerTokenMatch) {
      return NextResponse.json({ success: false, message: "Unauthorized access" }, { status: 403 });
    }

    const restaurant = await Restaurant.findById(order.restaurantId).select(
      "name slug wifiName wifiPassword"
    );

    return NextResponse.json({
      success: true,
      order: {
        id: order._id,
        tableNumber: order.tableNumber,
        items: order.items,
        total: order.total,
        status: order.status,
        paymentStatus: order.paymentStatus || "unpaid",
        paymentMethod: order.paymentMethod || "cash",
        paidAt: order.paidAt,
        billRequestedAt: order.billRequestedAt,
        createdAt: order.createdAt,
        servedAt: order.servedAt,
      },
      restaurant,
    });
  } catch (err: unknown) {
    console.error("Order fetch error:", err);
    return NextResponse.json({ success: false, message: "Failed to fetch order" }, { status: 500 });
  }
}
