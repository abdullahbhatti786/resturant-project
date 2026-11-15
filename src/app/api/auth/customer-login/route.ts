import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import connectToDatabase from "@/lib/db";
import Restaurant from "@/models/Restaurant";
import Customer from "@/models/Customer";
import Order from "@/models/Order";
import Visit from "@/models/Visit";
import Reward from "@/models/Reward";
import { getCustomerSession } from "@/lib/session";

export const dynamic = "force-dynamic";

const CustomerLoginSchema = z.object({
  slug: z.string().min(1, "Restaurant slug is required"),
  name: z.string().min(1, "Name is required").trim(),
  email: z.string().email("Invalid email address").toLowerCase().trim(),
  marketingConsent: z.boolean().optional().default(false),
  activeOrderId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = CustomerLoginSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.error.issues[0]?.message || "Validation error" },
        { status: 400 }
      );
    }

    const { slug, name, email, marketingConsent, activeOrderId } = result.data;
    await connectToDatabase();

    const restaurant = await Restaurant.findOne({ slug });
    if (!restaurant) {
      return NextResponse.json(
        { success: false, message: "Restaurant not found" },
        { status: 404 }
      );
    }

    // Find or create customer for this restaurant
    let customer = await Customer.findOne({
      restaurantId: restaurant._id,
      email,
    });

    if (customer) {
      customer.name = name;
      customer.marketingConsent = marketingConsent;
      await customer.save();
    } else {
      customer = await Customer.create({
        restaurantId: restaurant._id,
        email,
        name,
        marketingConsent,
      });
    }

    // Auto-link any active or recent order placed on this device/table to this customer!
    let targetOrder = null;
    if (activeOrderId) {
      targetOrder = await Order.findById(activeOrderId);
      if (targetOrder && !targetOrder.customerId) {
        targetOrder.customerId = customer._id;
        await targetOrder.save();
      }
    }

    if (!targetOrder) {
      targetOrder = await Order.findOne({
        restaurantId: restaurant._id,
        $or: [{ customerId: { $exists: false } }, { customerId: null }],
        createdAt: { $gte: new Date(Date.now() - 2 * 60 * 60 * 1000) },
      }).sort({ createdAt: -1 });

      if (targetOrder) {
        targetOrder.customerId = customer._id;
        await targetOrder.save();
      }
    }

    // If the linked order was already served, check and grant visit and streak reward
    if (targetOrder && targetOrder.status === "served") {
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      let visit = await Visit.findOne({
        restaurantId: restaurant._id,
        customerId: customer._id,
        date: startOfDay,
      });

      if (!visit) {
        visit = await Visit.create({
          restaurantId: restaurant._id,
          customerId: customer._id,
          orderId: targetOrder._id,
          date: startOfDay,
        });
      }

      // Check loyalty rules
      const latestReward = await Reward.findOne({
        restaurantId: restaurant._id,
        customerId: customer._id,
      }).sort({ createdAt: -1 });

      const daysWindow = restaurant.loyaltyRules.withinDays || 30;
      const windowStart = new Date(Date.now() - daysWindow * 24 * 60 * 60 * 1000);

      const visitQuery: Record<string, unknown> = {
        restaurantId: restaurant._id,
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

      if (qualifyingVisits >= requiredVisits) {
        const code = `GIFT${crypto.randomBytes(2).toString("hex").toUpperCase()}`;
        const expiryDays = restaurant.loyaltyRules.rewardExpiryDays || 30;
        const expiresAt = new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000);

        await Reward.create({
          restaurantId: restaurant._id,
          customerId: customer._id,
          code,
          description: restaurant.loyaltyRules.giftDescription || "Free Peshawari Kulfa",
          status: "active",
          expiresAt,
        });
      }
    }

    // Save iron-session for customer
    const session = await getCustomerSession();
    session.isLoggedIn = true;
    session.type = "customer";
    session.customerId = customer._id.toString();
    session.restaurantId = restaurant._id.toString();
    session.name = customer.name;
    session.email = customer.email;
    await session.save();

    return NextResponse.json({
      success: true,
      customer: {
        id: customer._id.toString(),
        name: customer.name,
        email: customer.email,
        marketingConsent: customer.marketingConsent,
      },
    });
  } catch (error: unknown) {
    console.error("Customer login error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
