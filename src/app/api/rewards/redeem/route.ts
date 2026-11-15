import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import connectToDatabase from "@/lib/db";
import Reward from "@/models/Reward";
import { getStaffSession, hasStaffRole, getEffectiveRestaurantId } from "@/lib/session";

const RedeemSchema = z.object({
  rewardId: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getStaffSession();
    if (!hasStaffRole(session, ["owner", "waiter"])) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = RedeemSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, message: "Invalid reward ID" }, { status: 400 });
    }

    const restaurantId = getEffectiveRestaurantId(session);
    await connectToDatabase();
    const reward = await Reward.findOne({
      _id: parsed.data.rewardId,
      restaurantId,
    });

    if (!reward) {
      return NextResponse.json({ success: false, message: "Reward not found" }, { status: 404 });
    }

    if (reward.status !== "active") {
      return NextResponse.json(
        { success: false, message: `Reward is already ${reward.status}` },
        { status: 400 }
      );
    }

    reward.status = "redeemed";
    reward.redeemedAt = new Date();
    await reward.save();

    return NextResponse.json({
      success: true,
      message: `Voucher ${reward.code} successfully marked as REDEEMED!`,
      reward,
    });
  } catch (err: unknown) {
    console.error("Reward redeem error:", err);
    return NextResponse.json({ success: false, message: "Failed to redeem reward" }, { status: 500 });
  }
}
