import { NextResponse } from "next/server";
import { getSessionUser } from "./session";
import type { SessionUser } from "./types";

export async function currentUser(): Promise<SessionUser | null> {
  return getSessionUser();
}

export function unauthorized(): NextResponse {
  return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
}

export function badRequest(message: string): NextResponse {
  return NextResponse.json({ error: message }, { status: 400 });
}

export function notFound(message = "Nicht gefunden."): NextResponse {
  return NextResponse.json({ error: message }, { status: 404 });
}

export function serverError(error: unknown): NextResponse {
  console.error(error);
  const message =
    error instanceof Error ? error.message : "Unerwarteter Fehler auf dem Server.";
  return NextResponse.json({ error: message }, { status: 500 });
}

export async function readJson<T>(request: Request): Promise<T | null> {
  try {
    return (await request.json()) as T;
  } catch {
    return null;
  }
}
