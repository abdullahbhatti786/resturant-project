// Global SSE Registry to survive Next.js dev hot-reloads

type SSEClient = {
  id: string;
  channel: string; // 'kitchen' | 'waiter' | 'order:[orderId]'
  restaurantId?: string;
  orderId?: string;
  controller: ReadableStreamDefaultController;
};

interface SSERegistry {
  clients: SSEClient[];
  addClient: (client: SSEClient) => void;
  removeClient: (id: string) => void;
  broadcast: (channel: string, event: string, data: unknown, restaurantId?: string) => void;
  broadcastOrderUpdate: (orderId: string, event: string, data: unknown) => void;
}

declare global {
  // eslint-disable-next-line no-var
  var __sseRegistry: SSERegistry | undefined;
}

function createRegistry(): SSERegistry {
  const clients: SSEClient[] = [];

  return {
    clients,
    addClient(client: SSEClient) {
      clients.push(client);
    },
    removeClient(id: string) {
      const idx = clients.findIndex((c) => c.id === id);
      if (idx !== -1) {
        clients.splice(idx, 1);
      }
    },
    broadcast(channel: string, event: string, data: unknown, restaurantId?: string) {
      const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
      const encoded = new TextEncoder().encode(payload);

      for (let i = clients.length - 1; i >= 0; i--) {
        const c = clients[i];
        if (
          c.channel === channel &&
          (!restaurantId || !c.restaurantId || c.restaurantId === restaurantId)
        ) {
          try {
            c.controller.enqueue(encoded);
          } catch {
            clients.splice(i, 1);
          }
        }
      }
    },
    broadcastOrderUpdate(orderId: string, event: string, data: unknown) {
      const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
      const encoded = new TextEncoder().encode(payload);
      const targetChannel = `order:${orderId}`;

      for (let i = clients.length - 1; i >= 0; i--) {
        const c = clients[i];
        if (c.channel === targetChannel || c.orderId === orderId) {
          try {
            c.controller.enqueue(encoded);
          } catch {
            clients.splice(i, 1);
          }
        }
      }
    },
  };
}

export const sseRegistry: SSERegistry = globalThis.__sseRegistry || createRegistry();

if (process.env.NODE_ENV !== "production") {
  globalThis.__sseRegistry = sseRegistry;
}
