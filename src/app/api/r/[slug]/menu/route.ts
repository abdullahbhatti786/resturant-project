import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import Restaurant from "@/models/Restaurant";
import MenuCategory from "@/models/MenuCategory";
import MenuItem from "@/models/MenuItem";

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const slug = params.slug;
    await connectToDatabase();

    const restaurant = await Restaurant.findOne({ slug });
    if (!restaurant) {
      return NextResponse.json(
        { success: false, message: "Restaurant not found" },
        { status: 404 }
      );
    }

    const categories = await MenuCategory.find({ restaurantId: restaurant._id }).sort({
      sortOrder: 1,
      createdAt: 1,
    });

    const items = await MenuItem.find({ restaurantId: restaurant._id }).sort({
      createdAt: -1,
    });

    return NextResponse.json({
      success: true,
      restaurant: {
        id: restaurant._id,
        name: restaurant.name,
        slug: restaurant.slug,
        tableCount: restaurant.tableCount,
        logo: restaurant.logo,
        wifiName: restaurant.wifiName,
        wifiPassword: restaurant.wifiPassword,
        enabledGames: restaurant.enabledGames,
        loyaltyRules: restaurant.loyaltyRules,
      },
      categories,
      items,
    });
  } catch (err: unknown) {
    console.error("Public menu fetch error:", err);
    return NextResponse.json(
      { success: false, message: "Failed to load restaurant menu" },
      { status: 500 }
    );
  }
}
