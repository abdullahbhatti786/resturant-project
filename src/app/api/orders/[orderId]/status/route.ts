import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import connectToDatabase from "@/lib/db";
import Order from "@/models/Order";
import Restaurant from "@/models/Restaurant";
import Visit from "@/models/Visit";
import Reward from "@/models/Reward";
import { getStaffSession, hasStaffRole, getEffectiveRestaurantId } from "@/lib/session";
import { sseRegistry } from "@/lib/sse";

const StatusUpdateSchema = z.object({
  status: z.enum(["preparing", "ready", "served"]),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const session = await getStaffSession();
    if (!hasStaffRole(session, ["owner", "waiter", "kitchen"])) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = StatusUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: parsed.error.issues[0]?.message || "Invalid status" },
        { status: 400 }
      );
    }

    const newStatus = parsed.data.status;

    // Role permissions check:
    // Kitchen & Owner: preparing, ready
    // Waiter & Owner: served
    if ((newStatus === "preparing" || newStatus === "ready") && !hasStaffRole(session, ["owner", "kitchen"])) {
      return NextResponse.json(
        { success: false, message: "Only kitchen staff or owner can set preparing / ready" },
        { status: 403 }
      );
    }

    if (newStatus === "served" && !hasStaffRole(session, ["owner", "waiter"])) {
      return NextResponse.json(
        { success: false, message: "Only waiters or owner can mark an order served" },
        { status: 403 }
      );
    }

    const restaurantId = getEffectiveRestaurantId(session);
    await connectToDatabase();
    const order = await Order.findOne({
      _id: params.orderId,
      restaurantId,
    });

    if (!order) {
      return NextResponse.json({ success: false, message: "Order not found" }, { status: 404 });
    }

    // Forward status progression rules:
    // received -> preparing -> ready -> served
    const validTransitions: Record<string, string[]> = {
      received: ["preparing"],
      preparing: ["ready"],
      ready: ["served"],
      served: [],
    };

    if (!validTransitions[order.status]?.includes(newStatus)) {
      return NextResponse.json(
        {
          success: false,
          message: `Cannot transition order status from '${order.status}' to '${newStatus}'`,
        },
        { status: 400 }
      );
    }

    order.status = newStatus;
    if (newStatus === "served") {
      order.servedAt = new Date();
    }
    await order.save();

    // Broadcast status change via SSE
    sseRegistry.broadcastOrderUpdate(order._id.toString(), "order:status", {
      orderId: order._id,
      status: order.status,
      servedAt: order.servedAt,
    });
    sseRegistry.broadcast(
      "waiter",
      newStatus === "ready" ? "order:ready" : "order:status",
      { orderId: order._id, tableNumber: order.tableNumber, status: order.status },
      session.restaurantId
    );
    sseRegistry.broadcast(
      "kitchen",
      "order:status",
      { orderId: order._id, tableNumber: order.tableNumber, status: order.status },
      session.restaurantId
    );

    // If order is served and linked to a customer, trigger loyalty visit counting
    let rewardCreated = null;
    if (newStatus === "served" && order.customerId) {
      const restaurant = await Restaurant.findById(session.restaurantId);
      if (restaurant) {
        // Enforce 1 visit per customer per day (normalized to midnight PKT)
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        let visit = await Visit.findOne({
          restaurantId: session.restaurantId,
          customerId: order.customerId,
          date: startOfDay,
        });

        if (!visit) {
          visit = await Visit.create({
            restaurantId: session.restaurantId,
            customerId: order.customerId,
            orderId: order._id,
            date: startOfDay,
          });
        }

        // Check if customer earned a reward:
        // Rule: visits created strictly AFTER the customer's latest reward ($gt) AND within the last loyaltyRules.withinDays days
        const latestReward = await Reward.findOne({
          restaurantId: session.restaurantId,
          customerId: order.customerId,
        }).sort({ createdAt: -1 });

        const daysWindow = restaurant.loyaltyRules.withinDays || 30;
        const windowStart = new Date(Date.now() - daysWindow * 24 * 60 * 60 * 1000);

        const visitQuery: Record<string, unknown> = {
          restaurantId: session.restaurantId,
          customerId: order.customerId,
          createdAt: { $gte: windowStart },
        };

        if (latestReward) {
          // Strictly $gt so the visit that triggered previous reward is never counted again
          visitQuery.createdAt = {
            $gt: latestReward.createdAt,
            $gte: windowStart,
          };
        }

        const qualifyingVisits = await Visit.countDocuments(visitQuery);
        const requiredVisits = restaurant.loyaltyRules.requiredVisits || 2;

        if (qualifyingVisits >= requiredVisits) {
          // Generate 8-character uppercase alphanumeric code
          const code = `GIFT${crypto.randomBytes(2).toString("hex").toUpperCase()}`;
          const expiryDays = restaurant.loyaltyRules.rewardExpiryDays || 30;
          const expiresAt = new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000);

          rewardCreated = await Reward.create({
            restaurantId: session.restaurantId,
            customerId: order.customerId,
            code,
            description: restaurant.loyaltyRules.giftDescription || "Free Peshawari Kulfa",
            status: "active",
            expiresAt,
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      order: {
        id: order._id,
        status: order.status,
        servedAt: order.servedAt,
      },
      rewardCreated: rewardCreated
        ? { code: rewardCreated.code, description: rewardCreated.description }
        : null,
    });
  } catch (err: unknown) {
    console.error("Order status update error:", err);
    return NextResponse.json({ success: false, message: "Failed to update order status" }, { status: 500 });
  }
}
