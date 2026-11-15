import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";
import connectToDatabase from "@/lib/db";
import Restaurant from "@/models/Restaurant";
import { getStaffSession, hasStaffRole, getEffectiveRestaurantId } from "@/lib/session";
import { getAppUrl } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getStaffSession();
    if (!hasStaffRole(session, ["owner"])) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const tableParam = searchParams.get("table");

    const restaurantId = getEffectiveRestaurantId(session);
    await connectToDatabase();
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return NextResponse.json({ success: false, message: "Restaurant not found" }, { status: 404 });
    }

    const appUrl = getAppUrl().replace(/\/+$/, "");
    const targetUrl = tableParam
      ? `${appUrl}/r/${restaurant.slug}/menu?table=${encodeURIComponent(tableParam)}`
      : `${appUrl}/r/${restaurant.slug}`;

    const qrDataUrl = await QRCode.toDataURL(targetUrl, {
      width: 480,
      margin: 2,
      color: {
        dark: "#0B1E36", // Servora midnight brand navy
        light: "#FFFFFF",
      },
    });

    const qrSvg = await QRCode.toString(targetUrl, {
      type: "svg",
      margin: 2,
      color: {
        dark: "#0B1E36",
        light: "#FFFFFF",
      },
    });

    return NextResponse.json({
      success: true,
      qrDataUrl,
      qrSvg,
      targetUrl,
      tableNumber: tableParam || null,
      restaurantName: restaurant.name,
      slug: restaurant.slug,
    });
  } catch (err: unknown) {
    console.error("QR generation error:", err);
    return NextResponse.json({ success: false, message: "Failed to generate QR code" }, { status: 500 });
  }
}
