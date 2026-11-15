import { NextResponse } from "next/server";
import QRCode from "qrcode";
import connectToDatabase from "@/lib/db";
import Restaurant from "@/models/Restaurant";
import { getStaffSession, hasStaffRole, getEffectiveRestaurantId } from "@/lib/session";
import { getAppUrl } from "@/lib/utils";

export const dynamic = "force-dynamic";

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

    const appUrl = getAppUrl();
    const targetUrl = `${appUrl}/r/${restaurant.slug}`;

    const qrDataUrl = await QRCode.toDataURL(targetUrl, {
      width: 400,
      margin: 2,
      color: {
        dark: "#3B2A20", // Servora dark roast secondary color
        light: "#FFFFFF",
      },
    });

    const qrSvg = await QRCode.toString(targetUrl, {
      type: "svg",
      margin: 2,
      color: {
        dark: "#3B2A20",
        light: "#FFFFFF",
      },
    });

    return NextResponse.json({
      success: true,
      qrDataUrl,
      qrSvg,
      targetUrl,
      restaurantName: restaurant.name,
      slug: restaurant.slug,
    });
  } catch (err: unknown) {
    console.error("QR generation error:", err);
    return NextResponse.json({ success: false, message: "Failed to generate QR code" }, { status: 500 });
  }
}
