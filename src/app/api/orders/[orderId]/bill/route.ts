import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import Order from "@/models/Order";
import ServiceRequest from "@/models/ServiceRequest";
import { sseRegistry } from "@/lib/sse";

export async function POST(
  req: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const { orderId } = params;
    const body = await req.json().catch(() => ({}));
    const { token } = body;

    await connectToDatabase();
    const order = await Order.findById(orderId);
    if (!order) {
      return NextResponse.json({ success: false, message: "Order not found" }, { status: 404 });
    }

    // Verify customer token
    if (!token || token !== order.publicToken) {
      return NextResponse.json({ success: false, message: "Unauthorized: Invalid order token" }, { status: 403 });
    }

    if (order.paymentStatus === "paid") {
      return NextResponse.json({
        success: false,
        message: "Order is already paid.",
      }, { status: 400 });
    }

    // Set order paymentStatus to bill_requested
    order.paymentStatus = "bill_requested";
    order.billRequestedAt = new Date();
    await order.save();

    // Create a ServiceRequest so waiter sees it in real-time
    const note = `Table ${order.tableNumber} requested Bill - Total Rs. ${order.total} (Cash in Hand)`;
    const serviceReq = await ServiceRequest.create({
      restaurantId: order.restaurantId,
      tableNumber: order.tableNumber,
      type: "bill",
      note,
      status: "submitted",
    });

    // Broadcast to Waiter & Kitchen
    sseRegistry.broadcast(
      "waiter",
      "request:new",
      {
        requestId: serviceReq._id,
        tableNumber: order.tableNumber,
        type: "bill",
        note,
        status: "submitted",
        createdAt: serviceReq.createdAt,
      },
      order.restaurantId.toString()
    );

    sseRegistry.broadcast(
      "waiter",
      "order:bill_requested",
      {
        orderId: order._id,
        tableNumber: order.tableNumber,
        total: order.total,
        paymentStatus: "bill_requested",
      },
      order.restaurantId.toString()
    );

    // Broadcast to Customer order room
    sseRegistry.broadcastOrderUpdate(order._id.toString(), "order:payment", {
      orderId: order._id,
      paymentStatus: "bill_requested",
      billRequestedAt: order.billRequestedAt,
    });

    return NextResponse.json({
      success: true,
      message: "Bill requested! Floor captain notified with your invoice.",
      order: {
        id: order._id,
        paymentStatus: order.paymentStatus,
        total: order.total,
      },
    });
  } catch (err: unknown) {
    console.error("Bill request error:", err);
    return NextResponse.json({ success: false, message: "Failed to request bill" }, { status: 500 });
  }
}
