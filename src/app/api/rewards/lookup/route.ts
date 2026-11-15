import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import connectToDatabase from "@/lib/db";
import Reward from "@/models/Reward";
import Customer from "@/models/Customer";
import { getStaffSession, hasStaffRole, getEffectiveRestaurantId } from "@/lib/session";
import { maskEmail } from "@/lib/utils";

const LookupSchema = z.object({
  code: z.string().min(1).trim().toUpperCase(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getStaffSession();
    if (!hasStaffRole(session, ["owner", "waiter"])) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = LookupSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, message: "Invalid voucher code" }, { status: 400 });
    }

    const restaurantId = getEffectiveRestaurantId(session);
    await connectToDatabase();
    const reward = await Reward.findOne({
      code: parsed.data.code,
      restaurantId,
    });

    if (!reward) {
      return NextResponse.json({ success: false, message: "Voucher code not found" }, { status: 404 });
    }

    if (reward.status !== "active") {
      return NextResponse.json(
        {
          success: false,
          message: `This voucher is already ${reward.status.toUpperCase()} on ${reward.redeemedAt?.toLocaleDateString()}`,
        },
        { status: 400 }
      );
    }

    if (new Date(reward.expiresAt) < new Date()) {
      reward.status = "expired";
      await reward.save();
      return NextResponse.json({ success: false, message: "This voucher has expired" }, { status: 400 });
    }

    const customer = await Customer.findById(reward.customerId);

    return NextResponse.json({
      success: true,
      voucher: {
        id: reward._id,
        code: reward.code,
        description: reward.description,
        customerName: customer ? customer.name : "Guest Customer",
        customerEmailMasked: customer ? maskEmail(customer.email) : "",
        expiresAt: reward.expiresAt,
      },
    });
  } catch (err: unknown) {
    console.error("Voucher lookup error:", err);
    return NextResponse.json({ success: false, message: "Failed to verify voucher" }, { status: 500 });
  }
}
