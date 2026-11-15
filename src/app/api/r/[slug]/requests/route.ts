import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import Restaurant from "@/models/Restaurant";
import ServiceRequest from "@/models/ServiceRequest";

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const slug = params.slug;
    const { searchParams } = new URL(req.url);
    const tableStr = searchParams.get("table");

    if (!tableStr) {
      return NextResponse.json({ success: false, message: "Table query parameter is required" }, { status: 400 });
    }

    const tableNumber = Number(tableStr);
    await connectToDatabase();

    const restaurant = await Restaurant.findOne({ slug });
    if (!restaurant) {
      return NextResponse.json({ success: false, message: "Restaurant not found" }, { status: 404 });
    }

    // Return the latest active or recently resolved requests for this table
    const requests = await ServiceRequest.find({
      restaurantId: restaurant._id,
      tableNumber,
    })
      .sort({ createdAt: -1 })
      .limit(5);

    return NextResponse.json({ success: true, requests });
  } catch (err: unknown) {
    console.error("Table requests fetch error:", err);
    return NextResponse.json({ success: false, message: "Failed to fetch table requests" }, { status: 500 });
  }
}
