import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import Restaurant from "@/models/Restaurant";
import Customer from "@/models/Customer";
import Order from "@/models/Order";
import Visit from "@/models/Visit";
import Reward from "@/models/Reward";
import { getCustomerSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getCustomerSession();
    if (!session.customerId && !session.isLoggedIn) {
      return NextResponse.json({ success: false, message: "Not logged in" }, { status: 401 });
    }

    await connectToDatabase();
    const customer = await Customer.findById(session.customerId);
    if (!customer) {
      return NextResponse.json({ success: false, message: "Customer not found" }, { status: 404 });
    }

    const restaurant = await Restaurant.findById(customer.restaurantId);
    if (!restaurant) {
      return NextResponse.json({ success: false, message: "Restaurant not found" }, { status: 404 });
    }

    // Active rewards
    const activeRewards = await Reward.find({
      restaurantId: customer.restaurantId,
      customerId: customer._id,
      status: "active",
      expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 });

    // Latest reward to establish streak boundary
    const latestReward = await Reward.findOne({
      restaurantId: customer.restaurantId,
      customerId: customer._id,
    }).sort({ createdAt: -1 });

    const daysWindow = restaurant.loyaltyRules.withinDays || 30;
    const windowStart = new Date(Date.now() - daysWindow * 24 * 60 * 60 * 1000);

    const visitQuery: Record<string, unknown> = {
      restaurantId: customer.restaurantId,
      customerId: customer._id,
      createdAt: { $gte: windowStart },
    };

    if (latestReward) {
      visitQuery.createdAt = {
        $gt: latestReward.createdAt,
        $gte: windowStart,
      };
    }

    const qualifyingVisits = await Visit.countDocuments(visitQuery);
    const requiredVisits = restaurant.loyaltyRules.requiredVisits || 2;

    // Order history
    const orders = await Order.find({
      restaurantId: customer.restaurantId,
      customerId: customer._id,
    })
      .sort({ createdAt: -1 })
      .limit(10);

    return NextResponse.json({
      success: true,
      customer: {
        id: customer._id,
        name: customer.name,
        email: customer.email,
        createdAt: customer.createdAt,
      },
      streak: {
        qualifyingVisits,
        requiredVisits,
        withinDays: daysWindow,
        giftDescription: restaurant.loyaltyRules.giftDescription,
      },
      activeRewards,
      orders,
    });
  } catch (err: unknown) {
    console.error("Customer me error:", err);
    return NextResponse.json({ success: false, message: "Failed to fetch profile" }, { status: 500 });
  }
}
