import bcrypt from "bcryptjs";
import { sql } from "./db";
import type { SessionUser } from "./types";

export interface UserRow {
  id: string;
  username: string;
  email: string;
  password_hash: string;
}

const USERNAME_PATTERN = /^[a-zA-Z0-9._-]{3,32}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validateRegistration(input: {
  username: string;
  email: string;
  password: string;
}): string | null {
  if (!USERNAME_PATTERN.test(input.username)) {
    return "Der Benutzername braucht 3 bis 32 Zeichen und darf nur Buchstaben, Zahlen, Punkt, Bindestrich und Unterstrich enthalten.";
  }
  if (!EMAIL_PATTERN.test(input.email)) {
    return "Bitte eine gültige E-Mail Adresse angeben.";
  }
  if (input.password.length < 8) {
    return "Das Passwort braucht mindestens 8 Zeichen.";
  }
  return null;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function createUser(input: {
  username: string;
  email: string;
  password: string;
}): Promise<SessionUser> {
  const passwordHash = await hashPassword(input.password);
  const rows = await sql<UserRow>`
    insert into users (username, email, password_hash)
    values (${input.username}, ${input.email.toLowerCase()}, ${passwordHash})
    returning id, username, email, password_hash
  `;
  const user = rows[0];
  return { id: user.id, username: user.username, email: user.email };
}

/** Anmeldung mit Benutzername ODER E-Mail Adresse. */
export async function verifyCredentials(
  identifier: string,
  password: string,
): Promise<SessionUser | null> {
  const value = identifier.trim();
  const rows = await sql<UserRow>`
    select id, username, email, password_hash
    from users
    where lower(username) = lower(${value}) or lower(email) = lower(${value})
    limit 1
  `;
  const user = rows[0];
  if (!user) {
    // Konstante Laufzeit, damit sich vorhandene Konten nicht erraten lassen.
    await bcrypt.compare(password, "$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidiu");
    return null;
  }
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return null;
  return { id: user.id, username: user.username, email: user.email };
}
