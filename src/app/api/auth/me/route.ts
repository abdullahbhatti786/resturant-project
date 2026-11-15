import { NextResponse } from "next/server";
import { getStaffSession, getCustomerSession } from "@/lib/session";

export async function GET() {
  try {
    const staffSession = await getStaffSession();
    if (staffSession.userId || staffSession.activeRoles) {
      return NextResponse.json({
        authenticated: true,
        type: "staff",
        user: {
          id: staffSession.userId,
          name: staffSession.name,
          email: staffSession.email,
          role: staffSession.role,
          restaurantId: staffSession.restaurantId,
        },
        activeRoles: staffSession.activeRoles || (staffSession.role ? { [staffSession.role]: true } : {}),
      });
    }

    const customerSession = await getCustomerSession();
    if (customerSession.customerId) {
      return NextResponse.json({
        authenticated: true,
        type: "customer",
        customer: {
          id: customerSession.customerId,
          name: customerSession.name,
          email: customerSession.email,
          restaurantId: customerSession.restaurantId,
        },
      });
    }

    return NextResponse.json({ authenticated: false });
  } catch {
    return NextResponse.json({ authenticated: false }, { status: 500 });
  }
}
