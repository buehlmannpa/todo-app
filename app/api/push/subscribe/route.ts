import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { badRequest, currentUser, readJson, serverError, unauthorized } from "@/lib/api";

interface Body {
  endpoint?: string;
  keys?: { p256dh?: string; auth?: string };
  userAgent?: string;
}

export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) return unauthorized();

  const body = await readJson<Body>(request);
  const endpoint = body?.endpoint;
  const p256dh = body?.keys?.p256dh;
  const auth = body?.keys?.auth;

  if (!endpoint || !p256dh || !auth) {
    return badRequest("Das Push Abo ist unvollständig.");
  }

  try {
    await sql`
      insert into push_subscriptions (user_id, endpoint, p256dh, auth, user_agent)
      values (${user.id}, ${endpoint}, ${p256dh}, ${auth}, ${body?.userAgent ?? null})
      on conflict (endpoint) do update
        set user_id = excluded.user_id,
            p256dh = excluded.p256dh,
            auth = excluded.auth,
            user_agent = excluded.user_agent
    `;
    return NextResponse.json({ ok: true });
  } catch (error) {
    return serverError(error);
  }
}

export async function DELETE(request: Request) {
  const user = await currentUser();
  if (!user) return unauthorized();

  const body = await readJson<Body>(request);
  if (!body?.endpoint) return badRequest("Endpoint fehlt.");

  try {
    await sql`delete from push_subscriptions where endpoint = ${body.endpoint} and user_id = ${user.id}`;
    return NextResponse.json({ ok: true });
  } catch (error) {
    return serverError(error);
  }
}
