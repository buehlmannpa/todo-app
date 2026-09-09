import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { badRequest, currentUser, readJson, serverError, unauthorized } from "@/lib/api";

interface Body {
  order?: string[];
}

export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) return unauthorized();

  const body = await readJson<Body>(request);
  const order = body?.order;
  if (!Array.isArray(order) || order.length === 0) {
    return badRequest("Es wurde keine Reihenfolge übergeben.");
  }

  try {
    for (let index = 0; index < order.length; index += 1) {
      await sql`
        update projects set position = ${index}
        where id = ${order[index]} and user_id = ${user.id}
      `;
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return serverError(error);
  }
}
