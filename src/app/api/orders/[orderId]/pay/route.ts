import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectToDatabase from "@/lib/db";
import Order from "@/models/Order";
import ServiceRequest from "@/models/ServiceRequest";
import { getStaffSession, hasStaffRole, getEffectiveRestaurantId } from "@/lib/session";
import { sseRegistry } from "@/lib/sse";

export async function POST(
  req: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const session = await getStaffSession();
    if (!hasStaffRole(session, ["owner", "waiter"])) {
      return NextResponse.json({ success: false, message: "Unauthorized. Waiter or Owner role required." }, { status: 401 });
    }

    const { orderId } = params;
    const body = await req.json().catch(() => ({}));
    const paymentMethod = body.paymentMethod || "cash";

    const restaurantId = getEffectiveRestaurantId(session);
    await connectToDatabase();

    const order = await Order.findOne({
      _id: orderId,
      restaurantId,
    });

    if (!order) {
      return NextResponse.json({ success: false, message: "Order not found" }, { status: 404 });
    }

    // Mark payment completed
    order.paymentStatus = "paid";
    order.paymentMethod = paymentMethod;
    order.paidAt = new Date();
    if (session.userId) {
      order.paidByStaffId = new mongoose.Types.ObjectId(session.userId);
    }

    // Ensure order is also marked served when paid
    if (order.status !== "served") {
      order.status = "served";
      order.servedAt = new Date();
    }

    await order.save();

    // Automatically resolve any pending bill request for this table
    await ServiceRequest.updateMany(
      {
        restaurantId,
        tableNumber: order.tableNumber,
        type: "bill",
        status: { $in: ["submitted", "acknowledged", "in_progress"] },
      },
      {
        status: "resolved",
        resolvedAt: new Date(),
      }
    );

    // Real-time broadcasts
    // 1. To customer order tracking room
    sseRegistry.broadcastOrderUpdate(order._id.toString(), "order:payment", {
      orderId: order._id,
      paymentStatus: "paid",
      paidAt: order.paidAt,
    });
    sseRegistry.broadcastOrderUpdate(order._id.toString(), "order:status", {
      orderId: order._id,
      status: order.status,
      servedAt: order.servedAt,
    });

    // 2. To staff channels
    sseRegistry.broadcast(
      "waiter",
      "order:paid",
      {
        orderId: order._id,
        tableNumber: order.tableNumber,
        total: order.total,
        paymentStatus: "paid",
      },
      restaurantId
    );

    sseRegistry.broadcast(
      "kitchen",
      "order:status",
      { orderId: order._id, tableNumber: order.tableNumber, status: order.status },
      restaurantId
    );

    return NextResponse.json({
      success: true,
      message: `Payment of Rs. ${order.total} received in ${paymentMethod}. Table ${order.tableNumber} is now vacant!`,
      order: {
        id: order._id,
        tableNumber: order.tableNumber,
        status: order.status,
        paymentStatus: order.paymentStatus,
        paidAt: order.paidAt,
      },
    });
  } catch (err: unknown) {
    console.error("Order payment processing error:", err);
    return NextResponse.json({ success: false, message: "Failed to record payment" }, { status: 500 });
  }
}
