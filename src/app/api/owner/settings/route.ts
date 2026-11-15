import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import connectToDatabase from "@/lib/db";
import Restaurant from "@/models/Restaurant";
import { getStaffSession, hasStaffRole, getEffectiveRestaurantId } from "@/lib/session";

export const dynamic = "force-dynamic";

const UpdateSettingsSchema = z.object({
  name: z.string().min(1, "Restaurant name is required").optional(),
  address: z.string().optional(),
  wifiName: z.string().optional(),
  wifiPassword: z.string().optional(),
  tableCount: z.number().int().min(1).max(100).optional(),
  logo: z.string().optional(),
  enabledGames: z
    .object({
      tictactoe: z.boolean(),
      memory: z.boolean(),
      quiz: z.boolean(),
    })
    .optional(),
  loyaltyRules: z
    .object({
      requiredVisits: z.number().int().min(1),
      withinDays: z.number().int().min(1),
      giftDescription: z.string().min(1),
      rewardExpiryDays: z.number().int().min(1),
    })
    .optional(),
});

export async function GET() {
  try {
    const session = await getStaffSession();
    if (!hasStaffRole(session, ["owner"])) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const restaurantId = getEffectiveRestaurantId(session);
    await connectToDatabase();
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return NextResponse.json({ success: false, message: "Restaurant not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      restaurant: {
        id: restaurant._id,
        name: restaurant.name,
        slug: restaurant.slug,
        address: restaurant.address,
        wifiName: restaurant.wifiName,
        wifiPassword: restaurant.wifiPassword,
        tableCount: restaurant.tableCount,
        logo: restaurant.logo,
        enabledGames: restaurant.enabledGames,
        loyaltyRules: restaurant.loyaltyRules,
      },
    });
  } catch (err: unknown) {
    console.error("Settings GET error:", err);
    return NextResponse.json({ success: false, message: "Failed to fetch settings" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getStaffSession();
    if (!hasStaffRole(session, ["owner"])) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const restaurantId = getEffectiveRestaurantId(session);
    const body = await req.json();
    const parsed = UpdateSettingsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: parsed.error.issues[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const restaurant = await Restaurant.findByIdAndUpdate(
      restaurantId,
      { $set: parsed.data },
      { new: true }
    );

    if (!restaurant) {
      return NextResponse.json({ success: false, message: "Restaurant not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      restaurant: {
        id: restaurant._id,
        name: restaurant.name,
        slug: restaurant.slug,
        address: restaurant.address,
        wifiName: restaurant.wifiName,
        wifiPassword: restaurant.wifiPassword,
        tableCount: restaurant.tableCount,
        logo: restaurant.logo,
        enabledGames: restaurant.enabledGames,
        loyaltyRules: restaurant.loyaltyRules,
      },
    });
  } catch (err: unknown) {
    console.error("Settings PATCH error:", err);
    return NextResponse.json({ success: false, message: "Failed to update settings" }, { status: 500 });
  }
}
