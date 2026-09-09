import { NextResponse } from "next/server";
import { verifyCredentials } from "@/lib/auth";
import { setSessionCookie } from "@/lib/session";
import { badRequest, readJson, serverError } from "@/lib/api";

interface Body {
  identifier?: string;
  password?: string;
}

export async function POST(request: Request) {
  const body = await readJson<Body>(request);
  if (!body) return badRequest("Ungültige Anfrage.");

  const identifier = (body.identifier ?? "").trim();
  const password = body.password ?? "";

  if (!identifier || !password) {
    return badRequest("Bitte Benutzername oder E-Mail und Passwort angeben.");
  }

  try {
    const user = await verifyCredentials(identifier, password);
    if (!user) {
      return NextResponse.json(
        { error: "Anmeldedaten stimmen nicht." },
        { status: 401 },
      );
    }
    await setSessionCookie(user);
    return NextResponse.json({ user });
  } catch (error) {
    return serverError(error);
  }
}
