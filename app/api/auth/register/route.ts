import { NextResponse } from "next/server";
import { createUser, validateRegistration } from "@/lib/auth";
import { setSessionCookie } from "@/lib/session";
import { badRequest, readJson, serverError } from "@/lib/api";
import { sql } from "@/lib/db";

interface Body {
  username?: string;
  email?: string;
  password?: string;
}

export async function POST(request: Request) {
  const body = await readJson<Body>(request);
  if (!body) return badRequest("Ungültige Anfrage.");

  const username = (body.username ?? "").trim();
  const email = (body.email ?? "").trim().toLowerCase();
  const password = body.password ?? "";

  const problem = validateRegistration({ username, email, password });
  if (problem) return badRequest(problem);

  try {
    const existing = await sql<{ id: string }>`
      select id from users where lower(username) = ${username.toLowerCase()} or email = ${email} limit 1
    `;
    if (existing.length > 0) {
      return badRequest("Benutzername oder E-Mail Adresse ist bereits vergeben.");
    }

    const user = await createUser({ username, email, password });

    // Ein erstes Projekt, damit die Projektansicht nicht leer startet.
    await sql`
      insert into projects (user_id, name, color, position) values (${user.id}, 'Allgemein', 'blue', 0)
    `;

    await setSessionCookie(user);
    return NextResponse.json({ user });
  } catch (error) {
    if ((error as { code?: string }).code === "23505") {
      return badRequest("Benutzername oder E-Mail Adresse ist bereits vergeben.");
    }
    return serverError(error);
  }
}
