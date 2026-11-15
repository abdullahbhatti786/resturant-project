import { NextRequest } from "next/server";
import crypto from "crypto";
import { getStaffSession, hasStaffRole, getEffectiveRestaurantId } from "@/lib/session";
import { sseRegistry } from "@/lib/sse";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getStaffSession();
  if (!hasStaffRole(session, ["owner", "waiter", "kitchen"])) {
    return new Response("Unauthorized", { status: 401 });
  }

  const restaurantId = getEffectiveRestaurantId(session) || session.restaurantId;
  const { searchParams } = new URL(req.url);
  const channel = searchParams.get("channel") || (session.role === "kitchen" ? "kitchen" : "waiter");
  const clientId = crypto.randomUUID();

  let keepAliveTimer: NodeJS.Timeout | null = null;

  const stream = new ReadableStream({
    start(controller) {
      // Register client
      sseRegistry.addClient({
        id: clientId,
        channel,
        restaurantId,
        controller,
      });

      // Send initial connect frame
      const initialPayload = `event: connected\ndata: ${JSON.stringify({
        status: "ok",
        clientId,
        channel,
      })}\n\n`;
      controller.enqueue(new TextEncoder().encode(initialPayload));

      // Keepalive comment every 25 seconds
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
