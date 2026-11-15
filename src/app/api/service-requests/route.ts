import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import connectToDatabase from "@/lib/db";
import Restaurant from "@/models/Restaurant";
import ServiceRequest from "@/models/ServiceRequest";
import { getStaffSession, hasStaffRole, getEffectiveRestaurantId } from "@/lib/session";
import { sseRegistry } from "@/lib/sse";

const CreateRequestSchema = z.object({
  slug: z.string().min(1),
  tableNumber: z.number().int().min(1),
  type: z.enum(["water", "bill", "waiter", "other"]),
  note: z.string().optional().default(""),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = CreateRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: parsed.error.issues[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    const { slug, tableNumber, type, note } = parsed.data;
    await connectToDatabase();

    const restaurant = await Restaurant.findOne({ slug });
    if (!restaurant) {
      return NextResponse.json({ success: false, message: "Restaurant not found" }, { status: 404 });
    }

    const serviceReq = await ServiceRequest.create({
      restaurantId: restaurant._id,
      tableNumber,
      type,
      note: note || (type === "water" ? "Water requested" : type === "bill" ? "Bill requested" : "Assistance requested"),
      status: "submitted",
    });

    // Notify waiter in real time via SSE
    sseRegistry.broadcast(
      "waiter",
      "request:new",
      {
        id: serviceReq._id,
        tableNumber: serviceReq.tableNumber,
        type: serviceReq.type,
        note: serviceReq.note,
        status: serviceReq.status,
        createdAt: serviceReq.createdAt,
      },
      restaurant._id.toString()
    );

    return NextResponse.json({ success: true, request: serviceReq }, { status: 201 });
  } catch (err: unknown) {
    console.error("Service request POST error:", err);
    return NextResponse.json({ success: false, message: "Failed to submit request" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getStaffSession();
    if (!hasStaffRole(session, ["owner", "waiter", "kitchen"])) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const restaurantId = getEffectiveRestaurantId(session);
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    await connectToDatabase();
    const filter: Record<string, unknown> = {
      restaurantId,
    };
    if (status) {
      filter.status = status;
    }

    const requests = await ServiceRequest.find(filter).sort({ createdAt: -1 }).limit(50);
    return NextResponse.json({ success: true, requests });
  } catch (err: unknown) {
    console.error("Service requests GET error:", err);
    return NextResponse.json({ success: false, message: "Failed to fetch requests" }, { status: 500 });
  }
}
