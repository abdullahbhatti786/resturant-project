import { NextRequest, NextResponse } from "next/server";
import { getStaffSession, getCustomerSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const targetType = searchParams.get("type");

    if (targetType === "customer") {
      const customerSession = await getCustomerSession();
      customerSession.destroy();
      return NextResponse.json({ success: true, message: "Customer logged out successfully" });
    }

    if (targetType === "staff") {
      const staffSession = await getStaffSession();
      staffSession.destroy();
      return NextResponse.json({ success: true, message: "Staff logged out successfully" });
    }

    // Default: clear both
    const staffSession = await getStaffSession();
    staffSession.destroy();

    const customerSession = await getCustomerSession();
    customerSession.destroy();

    return NextResponse.json({ success: true, message: "Logged out successfully" });
  } catch {
    return NextResponse.json({ success: false, message: "Logout failed" }, { status: 500 });
  }
}
