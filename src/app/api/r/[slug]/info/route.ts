import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import Restaurant from "@/models/Restaurant";

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;
    await connectToDatabase();

    const restaurant = await Restaurant.findOne({ slug }).select(
      "name slug logo address wifiName wifiPassword tableCount enabledGames loyaltyRules"
    );

    if (!restaurant) {
      return NextResponse.json({ success: false, message: "Restaurant not found" }, { status: 404 });
    }

    const resObj = restaurant.toObject();
    return NextResponse.json({
      success: true,
      restaurant: resObj,
      ...resObj,
    });
  } catch {
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
