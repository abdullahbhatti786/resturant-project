import { getIronSession, SessionOptions } from "iron-session";
import { cookies } from "next/headers";

const SESSION_PASSWORD =
  process.env.SESSION_PASSWORD ||
  "servora-super-secret-iron-session-key-32chars-min";

export interface RoleSessionInfo {
  userId: string;
  restaurantId: string;
  role: "owner" | "waiter" | "kitchen";
  name: string;
  email: string;
}

export interface StaffSessionData {
  type?: "staff";
  isLoggedIn?: boolean;
  userId?: string;
  restaurantId?: string;
  role?: "owner" | "waiter" | "kitchen";
  name?: string;
  email?: string;
  // Preserve active logins for each role so single browser can demonstrate all stations simultaneously
  activeRoles?: {
    owner?: RoleSessionInfo;
    kitchen?: RoleSessionInfo;
    waiter?: RoleSessionInfo;
  };
}

export interface CustomerSessionData {
  type?: "customer";
  isLoggedIn?: boolean;
  customerId?: string;
  restaurantId?: string;
  name?: string;
  email?: string;
}

export const staffSessionOptions: SessionOptions = {
  password: SESSION_PASSWORD,
  cookieName: "servora_staff",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  },
};

export const customerSessionOptions: SessionOptions = {
  password: SESSION_PASSWORD,
  cookieName: "servora_customer",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  },
};

export async function getStaffSession() {
  const cookieStore = cookies();
  return getIronSession<StaffSessionData>(cookieStore, staffSessionOptions);
}

export async function getCustomerSession() {
  const cookieStore = cookies();
  return getIronSession<CustomerSessionData>(cookieStore, customerSessionOptions);
}

/**
 * Checks if current staff session satisfies any of the allowed roles,
 * either via primary active role or via preserved multi-role logins.
 * Note: An "owner" role grants implicit access across all stations (kitchen, waiter, owner).
 */
export function hasStaffRole(
  session: StaffSessionData,
  allowedRoles: Array<"owner" | "waiter" | "kitchen">
): boolean {
  if (!session || (!session.isLoggedIn && !session.userId && !session.activeRoles)) {
    return false;
  }

  // 1. Check primary session role
  if (session.role === "owner" || allowedRoles.includes(session.role as "owner" | "waiter" | "kitchen")) {
    return true;
  }

  // 2. Check preserved active roles
  if (session.activeRoles) {
    if (session.activeRoles.owner) return true;
    for (const r of allowedRoles) {
      if (session.activeRoles[r]) return true;
    }
  }

  return false;
}

export function getEffectiveRestaurantId(session: StaffSessionData): string | undefined {
  if (session.restaurantId) return session.restaurantId;
  if (session.activeRoles) {
    return (
      session.activeRoles.owner?.restaurantId ||
      session.activeRoles.kitchen?.restaurantId ||
      session.activeRoles.waiter?.restaurantId
    );
  }
  return undefined;
}
