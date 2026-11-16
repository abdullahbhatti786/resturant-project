import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import Restaurant from "@/models/Restaurant";
import Order from "@/models/Order";
import ServiceRequest from "@/models/ServiceRequest";
import { getStaffSession, hasStaffRole, getEffectiveRestaurantId } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getStaffSession();
    if (!hasStaffRole(session, ["owner", "waiter", "kitchen"])) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const restaurantId = getEffectiveRestaurantId(session);
    await connectToDatabase();
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return NextResponse.json({ success: false, message: "Restaurant not found" }, { status: 404 });
    }

    // Active orders: any order on this table where payment is NOT paid
    const activeOrders = await Order.find({
      restaurantId,
      paymentStatus: { $ne: "paid" },
    }).sort({ createdAt: -1 });

    // Active requests (not resolved)
    const activeRequests = await ServiceRequest.find({
      restaurantId,
      status: { $in: ["submitted", "acknowledged", "in_progress"] },
    }).sort({ createdAt: -1 });

    // Build matrix for 1 .. tableCount
    const tables = [];
    for (let t = 1; t <= restaurant.tableCount; t++) {
      const tableOrder = activeOrders.find((o) => o.tableNumber === t);
      const tableReqs = activeRequests.filter((r) => r.tableNumber === t);

      let status = "vacant";
      const hasBillRequest =
        tableReqs.some((r) => r.type === "bill") ||
        tableOrder?.paymentStatus === "bill_requested";

      if (hasBillRequest) {
        status = "bill_pending";
      } else if (tableReqs.length > 0) {
        status = "request_pending";
      } else if (tableOrder?.status === "ready") {
        status = "food_ready";
      } else if (tableOrder) {
        status = "occupied";
      }

      tables.push({
        tableNumber: t,
        status,
        order: tableOrder
          ? {
              id: tableOrder._id,
              status: tableOrder.status,
              paymentStatus: tableOrder.paymentStatus || "unpaid",
              total: tableOrder.total,
              itemCount: tableOrder.items.reduce((s, i) => s + i.quantity, 0),
              createdAt: tableOrder.createdAt,
            }
          : null,
        requests: tableReqs.map((r) => ({
          id: r._id,
          type: r.type,
          note: r.note,
          status: r.status,
          createdAt: r.createdAt,
        })),
      });
    }

    return NextResponse.json({ success: true, tableCount: restaurant.tableCount, tables });
  } catch (err: unknown) {
    console.error("Floor matrix fetch error:", err);
    return NextResponse.json({ success: false, message: "Failed to fetch floor status" }, { status: 500 });
  }
}
