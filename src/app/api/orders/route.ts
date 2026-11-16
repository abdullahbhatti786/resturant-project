import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import connectToDatabase from "@/lib/db";
import Restaurant from "@/models/Restaurant";
import MenuItem from "@/models/MenuItem";
import Order from "@/models/Order";
import Customer from "@/models/Customer";
import { getCustomerSession, getStaffSession, hasStaffRole, getEffectiveRestaurantId } from "@/lib/session";
import { sseRegistry } from "@/lib/sse";

export const dynamic = "force-dynamic";

const CreateOrderItemSchema = z.object({
  menuItemId: z.string().min(1),
  quantity: z.number().int().min(1).max(20),
  specialInstructions: z.string().optional().default(""),
});

const CreateOrderSchema = z.object({
  slug: z.string().min(1),
  tableNumber: z.number().int().min(1),
  items: z.array(CreateOrderItemSchema).min(1, "Cart cannot be empty"),
  customerName: z.string().optional(),
  customerEmail: z.string().email().optional(),
  marketingConsent: z.boolean().optional().default(false),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = CreateOrderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: parsed.error.issues[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    const { slug, tableNumber, items, customerName, customerEmail, marketingConsent } =
      parsed.data;

    await connectToDatabase();
    const restaurant = await Restaurant.findOne({ slug });
    if (!restaurant) {
      return NextResponse.json({ success: false, message: "Restaurant not found" }, { status: 404 });
    }

    if (tableNumber < 1 || tableNumber > restaurant.tableCount) {
      return NextResponse.json(
        { success: false, message: `Invalid table. Choose between 1 and ${restaurant.tableCount}` },
        { status: 400 }
      );
    }

    // Verify all items belong to this restaurant and are available
    const itemIds = items.map((i) => i.menuItemId);
    const dbItems = await MenuItem.find({
      _id: { $in: itemIds },
      restaurantId: restaurant._id,
    });

    if (dbItems.length !== itemIds.length) {
      return NextResponse.json(
        { success: false, message: "One or more items in cart do not belong to this restaurant" },
        { status: 400 }
      );
    }

    // Check availability and compute server-verified price total
    let total = 0;
    const verifiedOrderItems = [];

    for (const reqItem of items) {
      const match = dbItems.find((d) => d._id.toString() === reqItem.menuItemId);
      if (!match) {
        return NextResponse.json({ success: false, message: "Menu item not found" }, { status: 400 });
      }
      if (!match.available) {
        return NextResponse.json(
          { success: false, message: `Item "${match.name}" is currently 86'd / out of stock` },
          { status: 400 }
        );
      }

      total += match.price * reqItem.quantity;
      verifiedOrderItems.push({
        menuItemId: match._id,
        name: match.name,
        price: match.price,
        quantity: reqItem.quantity,
        specialInstructions: reqItem.specialInstructions || "",
      });
    }

    // Determine customer identification
    let customerId: string | undefined;
    const customerSession = await getCustomerSession();

    if (customerSession.isLoggedIn && customerSession.restaurantId === restaurant._id.toString()) {
      customerId = customerSession.customerId;
    } else if (customerEmail && customerName) {
      // Find or create customer
      let cust = await Customer.findOne({
        restaurantId: restaurant._id,
        email: customerEmail.toLowerCase().trim(),
      });
      if (!cust) {
        cust = await Customer.create({
          restaurantId: restaurant._id,
          name: customerName.trim(),
          email: customerEmail.toLowerCase().trim(),
          marketingConsent,
        });
      }
      customerId = cust._id.toString();

      // Establish customer session
      customerSession.isLoggedIn = true;
      customerSession.customerId = cust._id.toString();
      customerSession.restaurantId = restaurant._id.toString();
      customerSession.name = cust.name;
      customerSession.email = cust.email;
      await customerSession.save();
    }

    // Check if an active order already exists for this table in received or preparing status
    const existingActiveOrder = await Order.findOne({
      restaurantId: restaurant._id,
      tableNumber,
      status: { $in: ["received", "preparing"] },
    });

    if (existingActiveOrder) {
      // Append the new items to the existing active table ticket
      for (const newItem of verifiedOrderItems) {
        existingActiveOrder.items.push(newItem);
      }
      existingActiveOrder.total += total;
      await existingActiveOrder.save();

      // Notify kitchen about updated ticket
      sseRegistry.broadcast(
        "kitchen",
        "order:new",
        {
          orderId: existingActiveOrder._id,
          tableNumber: existingActiveOrder.tableNumber,
          items: existingActiveOrder.items,
          total: existingActiveOrder.total,
          status: existingActiveOrder.status,
          createdAt: existingActiveOrder.createdAt,
        },
        restaurant._id.toString()
      );

      return NextResponse.json(
        {
          success: true,
          orderId: existingActiveOrder._id,
          publicToken: existingActiveOrder.publicToken,
          order: {
            id: existingActiveOrder._id,
            tableNumber: existingActiveOrder.tableNumber,
            total: existingActiveOrder.total,
            status: existingActiveOrder.status,
          },
          appended: true,
        },
        { status: 200 }
      );
    }

    const publicToken = crypto.randomUUID();
    const order = await Order.create({
      restaurantId: restaurant._id,
      tableNumber,
      customerId,
      publicToken,
      items: verifiedOrderItems,
      total,
      status: "received",
    });

    // Notify kitchen in real time via SSE
    sseRegistry.broadcast(
      "kitchen",
      "order:new",
      {
        orderId: order._id,
        tableNumber: order.tableNumber,
        items: order.items,
        total: order.total,
        status: order.status,
        createdAt: order.createdAt,
      },
      restaurant._id.toString()
    );

    return NextResponse.json(
      {
        success: true,
        orderId: order._id,
        publicToken: order.publicToken,
        order: {
          id: order._id,
          tableNumber: order.tableNumber,
          total: order.total,
          status: order.status,
        },
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    console.error("Order creation error:", err);
    return NextResponse.json({ success: false, message: "Failed to place order" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getStaffSession();
    if (!hasStaffRole(session, ["owner", "waiter", "kitchen"])) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const restaurantId = getEffectiveRestaurantId(session);
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const paymentStatus = searchParams.get("paymentStatus");

    await connectToDatabase();
    const filter: Record<string, unknown> = {
      restaurantId,
    };
    if (status) {
      filter.status = status;
    }
    if (paymentStatus) {
      filter.paymentStatus = paymentStatus;
    }

    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .populate("customerId", "name email");

    return NextResponse.json({ success: true, orders });
  } catch (err: unknown) {
    console.error("Orders list error:", err);
    return NextResponse.json({ success: false, message: "Failed to fetch orders" }, { status: 500 });
  }
}
