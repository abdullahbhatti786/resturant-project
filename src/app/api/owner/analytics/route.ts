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

    // Orders and Payments
    const allOrders = await Order.find({ restaurantId });
    const paidOrders = allOrders.filter((ord) => ord.paymentStatus === "paid");
    const pendingOrders = allOrders.filter((ord) => ord.paymentStatus !== "paid");
    const servedOrders = allOrders.filter((ord) => ord.status === "served");

    // Total revenue is collected from paid orders (or fallback to served if legacy)
    const totalRevenue = paidOrders.length > 0
      ? paidOrders.reduce((sum, ord) => sum + (ord.total || 0), 0)
      : servedOrders.reduce((sum, ord) => sum + (ord.total || 0), 0);

    const pendingRevenue = pendingOrders.reduce((sum, ord) => sum + (ord.total || 0), 0);

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
        pendingRevenue,
        pendingPaymentsCount: pendingOrders.length,
        paidOrdersCount: paidOrders.length,
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
