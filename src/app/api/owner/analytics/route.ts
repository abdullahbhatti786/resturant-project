import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import Order from "@/models/Order";
import ServiceRequest from "@/models/ServiceRequest";
import Customer from "@/models/Customer";
import { getStaffSession, hasStaffRole, getEffectiveRestaurantId } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getStaffSession();
    if (!hasStaffRole(session, ["owner"])) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    const restaurantId = getEffectiveRestaurantId(session);

    // All served orders
    const servedOrders = await Order.find({ restaurantId, status: "served" });
    const allOrders = await Order.find({ restaurantId });
    const totalRevenue = servedOrders.reduce((sum, ord) => sum + (ord.total || 0), 0);

    const totalRequests = await ServiceRequest.countDocuments({ restaurantId });
    const totalCustomers = await Customer.countDocuments({ restaurantId });

    // Peak hours aggregation (group by hour 0 - 23)
    const hoursCount: Record<number, number> = {};
    for (let h = 12; h <= 23; h++) hoursCount[h] = 0; // Default dinner peak range in PKT

    for (const ord of allOrders) {
      const hour = new Date(ord.createdAt).getHours();
      hoursCount[hour] = (hoursCount[hour] || 0) + 1;
    }

    const peakHours = Object.entries(hoursCount).map(([hour, count]) => ({
      hour: `${hour}:00`,
      orders: count,
    }));

    return NextResponse.json({
      success: true,
      kpis: {
        totalRevenue,
        servedOrdersCount: servedOrders.length,
        totalOrdersCount: allOrders.length,
        totalRequests,
        totalCustomers,
      },
      peakHours,
    });
  } catch (err: unknown) {
    console.error("Owner analytics error:", err);
    return NextResponse.json({ success: false, message: "Failed to load analytics" }, { status: 500 });
  }
}
