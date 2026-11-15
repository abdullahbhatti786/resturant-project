import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import connectToDatabase from "@/lib/db";
import Restaurant from "@/models/Restaurant";
import Feedback from "@/models/Feedback";
import { getCustomerSession, getStaffSession, hasStaffRole, getEffectiveRestaurantId } from "@/lib/session";

export const dynamic = "force-dynamic";

const SubmitFeedbackSchema = z.object({
  slug: z.string().min(1),
  tableNumber: z.number().int().min(1),
  ratings: z.object({
    food: z.number().int().min(1).max(5),
    service: z.number().int().min(1).max(5),
    cleanliness: z.number().int().min(1).max(5),
    waitingTime: z.number().int().min(1).max(5),
  }),
  comment: z.string().optional().default(""),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = SubmitFeedbackSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: parsed.error.issues[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    const { slug, tableNumber, ratings, comment } = parsed.data;
    await connectToDatabase();

    const restaurant = await Restaurant.findOne({ slug });
    if (!restaurant) {
      return NextResponse.json({ success: false, message: "Restaurant not found" }, { status: 404 });
    }

    const customerSession = await getCustomerSession();
    const customerId =
      customerSession.isLoggedIn &&
      customerSession.restaurantId === restaurant._id.toString()
        ? customerSession.customerId
        : undefined;

    const feedback = await Feedback.create({
      restaurantId: restaurant._id,
      tableNumber,
      customerId,
      ratings,
      comment,
    });

    return NextResponse.json({ success: true, feedback }, { status: 201 });
  } catch (err: unknown) {
    console.error("Feedback POST error:", err);
    return NextResponse.json({ success: false, message: "Failed to submit feedback" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getStaffSession();
    if (!hasStaffRole(session, ["owner"])) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const restaurantId = getEffectiveRestaurantId(session);
    await connectToDatabase();
    const feedbacks = await Feedback.find({ restaurantId })
      .sort({ createdAt: -1 })
      .populate("customerId", "name email");

    // Compute averages
    let avgFood = 0;
    let avgService = 0;
    let avgCleanliness = 0;
    let avgWaiting = 0;

    if (feedbacks.length > 0) {
      avgFood = feedbacks.reduce((acc, f) => acc + (f.ratings?.food || 5), 0) / feedbacks.length;
      avgService = feedbacks.reduce((acc, f) => acc + (f.ratings?.service || 5), 0) / feedbacks.length;
      avgCleanliness = feedbacks.reduce((acc, f) => acc + (f.ratings?.cleanliness || 5), 0) / feedbacks.length;
      avgWaiting = feedbacks.reduce((acc, f) => acc + (f.ratings?.waitingTime || 5), 0) / feedbacks.length;
    }

    return NextResponse.json({
      success: true,
      feedbacks,
      averages: {
        food: Number(avgFood.toFixed(1)),
        service: Number(avgService.toFixed(1)),
        cleanliness: Number(avgCleanliness.toFixed(1)),
        waitingTime: Number(avgWaiting.toFixed(1)),
        totalCount: feedbacks.length,
      },
    });
  } catch (err: unknown) {
    console.error("Feedback GET error:", err);
    return NextResponse.json({ success: false, message: "Failed to load feedback" }, { status: 500 });
  }
}
