import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import connectToDatabase from "@/lib/db";
import User from "@/models/User";
import { getStaffSession } from "@/lib/session";

const LoginSchema = z.object({
  email: z.string().email("Invalid email format").toLowerCase().trim(),
  password: z.string().min(1, "Password is required"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = LoginSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.error.issues[0]?.message || "Validation error" },
        { status: 400 }
      );
    }

    const { email, password } = result.data;
    await connectToDatabase();

    const user = await User.findOne({ email, active: true });
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Invalid email or password" },
        { status: 401 }
      );
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { success: false, message: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Save iron-session for staff
    const session = await getStaffSession();
    session.isLoggedIn = true;
    session.type = "staff";
    session.userId = user._id.toString();
    session.restaurantId = user.restaurantId.toString();
    session.role = user.role;
    session.name = user.name;
    session.email = user.email;

    // Preserve active roles across stations so one browser can run all tabs simultaneously
    const roleInfo = {
      userId: user._id.toString(),
      restaurantId: user.restaurantId.toString(),
      role: user.role,
      name: user.name,
      email: user.email,
    };

    session.activeRoles = {
      ...(session.activeRoles || {}),
      [user.role]: roleInfo,
    };

    if (user.role === "owner") {
      session.activeRoles.owner = roleInfo;
      session.activeRoles.kitchen = roleInfo;
      session.activeRoles.waiter = roleInfo;
    }

    await session.save();

    return NextResponse.json({
      success: true,
      role: user.role,
      name: user.name,
      redirect:
        user.role === "owner"
          ? "/dashboard"
          : user.role === "waiter"
          ? "/waiter"
          : "/kitchen",
    });
  } catch (error: unknown) {
    console.error("Login error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
