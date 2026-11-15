import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import connectToDatabase from "@/lib/db";
import User from "@/models/User";
import { getStaffSession, hasStaffRole, getEffectiveRestaurantId } from "@/lib/session";

export const dynamic = "force-dynamic";

const CreateStaffSchema = z.object({
  name: z.string().min(1, "Name is required").trim(),
  email: z.string().email("Invalid email").toLowerCase().trim(),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["waiter", "kitchen"]),
});

const UpdateStaffSchema = z.object({
  userId: z.string().min(1),
  active: z.boolean().optional(),
  name: z.string().optional(),
});

export async function GET() {
  try {
    const session = await getStaffSession();
    if (!hasStaffRole(session, ["owner"])) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const restaurantId = getEffectiveRestaurantId(session);
    await connectToDatabase();
    const staff = await User.find({ restaurantId })
      .select("-passwordHash")
      .sort({ createdAt: -1 });

    return NextResponse.json({ success: true, staff });
  } catch (err: unknown) {
    console.error("Staff GET error:", err);
    return NextResponse.json({ success: false, message: "Failed to fetch staff" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getStaffSession();
    if (!hasStaffRole(session, ["owner"])) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const restaurantId = getEffectiveRestaurantId(session);
    const body = await req.json();
    const parsed = CreateStaffSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: parsed.error.issues[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const existing = await User.findOne({
      restaurantId,
      email: parsed.data.email,
    });
    if (existing) {
      return NextResponse.json(
        { success: false, message: "A staff account with this email already exists" },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(parsed.data.password, 10);
    const user = await User.create({
      restaurantId,
      name: parsed.data.name,
      email: parsed.data.email,
      passwordHash,
      role: parsed.data.role,
      active: true,
    });

    return NextResponse.json(
      {
        success: true,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          active: user.active,
        },
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    console.error("Staff POST error:", err);
    return NextResponse.json({ success: false, message: "Failed to create staff account" }, { status: 500 });
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
    const parsed = UpdateStaffSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: parsed.error.issues[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const user = await User.findOne({
      _id: parsed.data.userId,
      restaurantId,
    });

    if (!user) {
      return NextResponse.json({ success: false, message: "Staff member not found" }, { status: 404 });
    }

    // Owner cannot disable themselves
    if (user._id.toString() === session.userId && parsed.data.active === false) {
      return NextResponse.json(
        { success: false, message: "You cannot disable your own owner account" },
        { status: 400 }
      );
    }

    if (parsed.data.active !== undefined) user.active = parsed.data.active;
    if (parsed.data.name) user.name = parsed.data.name;
    await user.save();

    return NextResponse.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        active: user.active,
      },
    });
  } catch (err: unknown) {
    console.error("Staff PATCH error:", err);
    return NextResponse.json({ success: false, message: "Failed to update staff" }, { status: 500 });
  }
}
