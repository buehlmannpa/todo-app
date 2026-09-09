import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { pushConfigured, sendPushToUser } from "@/lib/push";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

interface DueRow {
  id: string;
  user_id: string;
  title: string;
  due_at: Date | string | null;
  remind_at: Date | string | null;
}

function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true; // Lokale Entwicklung ohne Secret
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

/**
 * Meldet fällige Aufgaben. Massgebend ist die Erinnerung, sonst der Termin.
 * Ganztägige Aufgaben melden sich am Morgen ihres Termins.
 *
 * Wird von einem Vercel Cron Job aufgerufen und verschickt Push Mitteilungen
 * für fällige Aufgaben. Der Endpunkt ist idempotent: jede Aufgabe wird nur
 * einmal gemeldet (reminder_sent_at).
 */
export async function GET(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Nicht berechtigt." }, { status: 401 });
  }

  if (!pushConfigured()) {
    // Ohne Schlüssel würden die Erinnerungen als versendet markiert und
    // wären danach verloren. Darum wird hier bewusst nichts verändert.
    return NextResponse.json(
      { error: "VAPID Schlüssel fehlen, es wurde nichts versendet." },
      { status: 503 },
    );
  }

  try {
    const due = await sql<DueRow>`
      select id, user_id, title, due_at, remind_at
      from todos
      where completed_at is null
        and reminder_sent_at is null
        and (
          (remind_at is not null and remind_at <= now())
          or (remind_at is null and due_all_day = false and due_at is not null and due_at <= now())
          or (
            remind_at is null and due_all_day = true and due_at is not null
            and due_at + interval '9 hours' <= now()
          )
        )
        and coalesce(remind_at, due_at) > now() - interval '2 days'
      order by coalesce(remind_at, due_at) asc
      limit 200
    `;

    let sent = 0;
    const byUser = new Map<string, DueRow[]>();
    for (const row of due) {
      const list = byUser.get(row.user_id) ?? [];
      list.push(row);
      byUser.set(row.user_id, list);
    }

    for (const [userId, items] of byUser) {
      const payload =
        items.length === 1
          ? {
              title: "Aufgabe fällig",
              body: items[0].title,
              url: "/heute",
              tag: `todo-${items[0].id}`,
            }
          : {
              title: `${items.length} Aufgaben fällig`,
              body: items
                .slice(0, 3)
                .map((item) => item.title)
                .join(", "),
              url: "/heute",
              tag: "todo-sammel",
            };

      const delivered = await sendPushToUser(userId, payload);
      sent += delivered;

      for (const item of items) {
        await sql`update todos set reminder_sent_at = now() where id = ${item.id}`;
      }
    }

    return NextResponse.json({ checked: due.length, delivered: sent });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Cron fehlgeschlagen." }, { status: 500 });
  }
}
