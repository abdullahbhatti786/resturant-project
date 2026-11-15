import { NextRequest } from "next/server";
import crypto from "crypto";
import connectToDatabase from "@/lib/db";
import Order from "@/models/Order";
import { sseRegistry } from "@/lib/sse";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { orderId: string } }
) {
  const orderId = params.orderId;
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");

  await connectToDatabase();
  const order = await Order.findById(orderId);
  if (!order) {
    return new Response("Order not found", { status: 404 });
  }

  // Verify publicToken
  if (!token || token !== order.publicToken) {
    return new Response("Unauthorized", { status: 403 });
  }

  const clientId = crypto.randomUUID();
  let keepAliveTimer: NodeJS.Timeout | null = null;

  const stream = new ReadableStream({
    start(controller) {
      sseRegistry.addClient({
        id: clientId,
        channel: `order:${orderId}`,
        orderId,
        controller,
      });

      // Send initial state
      const initialPayload = `event: order:status\ndata: ${JSON.stringify({
        orderId: order._id,
        status: order.status,
      })}\n\n`;
      controller.enqueue(new TextEncoder().encode(initialPayload));

      // 25s keepalive
      keepAliveTimer = setInterval(() => {
        try {
          controller.enqueue(new TextEncoder().encode(": keepalive\n\n"));
        } catch {
          if (keepAliveTimer) clearInterval(keepAliveTimer);
          sseRegistry.removeClient(clientId);
        }
      }, 25000);
    },
    cancel() {
      if (keepAliveTimer) clearInterval(keepAliveTimer);
      sseRegistry.removeClient(clientId);
    },
  });

  req.signal.addEventListener("abort", () => {
    if (keepAliveTimer) clearInterval(keepAliveTimer);
    sseRegistry.removeClient(clientId);
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
