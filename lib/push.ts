import webpush from "web-push";
import { sql } from "./db";

let configured = false;

function configure(): boolean {
  if (configured) return true;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) return false;
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:noreply@example.com",
    publicKey,
    privateKey,
  );
  configured = true;
  return true;
}

/** Meldet, ob die VAPID Schlüssel gesetzt sind. */
export function pushConfigured(): boolean {
  return configure();
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
}

interface SubscriptionRow {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}

/** Sendet eine Mitteilung an alle Geräte eines Benutzers. Tote Abos werden entfernt. */
export async function sendPushToUser(userId: string, payload: PushPayload): Promise<number> {
  if (!configure()) return 0;

  const subscriptions = await sql<SubscriptionRow>`
    select id, endpoint, p256dh, auth from push_subscriptions where user_id = ${userId}
  `;

  let delivered = 0;
  const stale: string[] = [];

  await Promise.all(
    subscriptions.map(async (subscription) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: { p256dh: subscription.p256dh, auth: subscription.auth },
          },
          JSON.stringify(payload),
          { TTL: 60 * 60 * 12 },
        );
        delivered += 1;
      } catch (error) {
        const status = (error as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) {
          stale.push(subscription.id);
        } else {
          console.error("Push fehlgeschlagen", status, (error as Error).message);
        }
      }
    }),
  );

  for (const id of stale) {
    await sql`delete from push_subscriptions where id = ${id}`;
  }

  return delivered;
}
