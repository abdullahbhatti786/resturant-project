import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import Customer from "@/models/Customer";
import Visit from "@/models/Visit";
import Reward from "@/models/Reward";
import Restaurant from "@/models/Restaurant";
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
    const restaurant = await Restaurant.findById(restaurantId);
    const customers = await Customer.find({ restaurantId }).sort({ createdAt: -1 });

    const requiredVisits = restaurant?.loyaltyRules?.requiredVisits || 2;
    const daysWindow = restaurant?.loyaltyRules?.withinDays || 30;
    const windowStart = new Date(Date.now() - daysWindow * 24 * 60 * 60 * 1000);

    const customerList = [];

    for (const cust of customers) {
      const latestReward = await Reward.findOne({
        restaurantId,
        customerId: cust._id,
      }).sort({ createdAt: -1 });

      const totalVisits = await Visit.countDocuments({
        restaurantId,
        customerId: cust._id,
      });

      const streakQuery: Record<string, unknown> = {
        restaurantId,
        customerId: cust._id,
        createdAt: { $gte: windowStart },
      };

      if (latestReward) {
        streakQuery.createdAt = {
          $gt: latestReward.createdAt,
          $gte: windowStart,
        };
      }

      const streakVisits = await Visit.countDocuments(streakQuery);

      const latestVisit = await Visit.findOne({
        restaurantId,
        customerId: cust._id,
      }).sort({ date: -1 });

      customerList.push({
        id: cust._id,
        name: cust.name,
        email: cust.email,
        marketingConsent: cust.marketingConsent,
        totalVisits,
        streakStatus: `${streakVisits} / ${requiredVisits} visits`,
        hasActiveReward: !!latestReward && latestReward.status === "active",
        lastVisit: latestVisit ? latestVisit.date : cust.createdAt,
        createdAt: cust.createdAt,
      });
    }

    return NextResponse.json({ success: true, customers: customerList });
  } catch (err: unknown) {
    console.error("Owner customers GET error:", err);
    return NextResponse.json({ success: false, message: "Failed to load customers" }, { status: 500 });
  }
}
