import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import connectToDatabase from "@/lib/db";
import ServiceRequest from "@/models/ServiceRequest";
import { getStaffSession, hasStaffRole, getEffectiveRestaurantId } from "@/lib/session";
import { sseRegistry } from "@/lib/sse";

const UpdateRequestSchema = z.object({
  status: z.enum(["acknowledged", "in_progress", "resolved"]),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { reqId: string } }
) {
  try {
    const session = await getStaffSession();
    if (!hasStaffRole(session, ["owner", "waiter"])) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = UpdateRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: parsed.error.issues[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    const restaurantId = getEffectiveRestaurantId(session);
    await connectToDatabase();
    const serviceReq = await ServiceRequest.findOne({
      _id: params.reqId,
      restaurantId,
    });

    if (!serviceReq) {
      return NextResponse.json({ success: false, message: "Request not found" }, { status: 404 });
    }

    serviceReq.status = parsed.data.status;
    if (parsed.data.status === "resolved") {
      serviceReq.resolvedAt = new Date();
    }
    await serviceReq.save();

    // Broadcast status change to waiter and floor
    sseRegistry.broadcast(
      "waiter",
      "request:status",
      { id: serviceReq._id, status: serviceReq.status, tableNumber: serviceReq.tableNumber },
      session.restaurantId
    );

    return NextResponse.json({ success: true, request: serviceReq });
  } catch (err: unknown) {
    console.error("Service request PATCH error:", err);
    return NextResponse.json({ success: false, message: "Failed to update request" }, { status: 500 });
  }
}
