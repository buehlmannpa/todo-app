import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { badRequest, currentUser, notFound, readJson, serverError, unauthorized } from "@/lib/api";
import { toProject, type ProjectRow } from "@/lib/serialize";
import { PROJECT_COLORS } from "@/lib/types";

interface Params {
  params: Promise<{ id: string }>;
}

interface Body {
  name?: string;
  color?: string;
}

export async function PATCH(request: Request, { params }: Params) {
  const user = await currentUser();
  if (!user) return unauthorized();

  const { id } = await params;
  const body = await readJson<Body>(request);
  if (!body) return badRequest("Ungültige Anfrage.");

  try {
    const existing = await sql<ProjectRow>`
      select id, name, color, position, created_at
      from projects where id = ${id} and user_id = ${user.id}
    `;
    if (existing.length === 0) return notFound("Projekt nicht gefunden.");

    const name = body.name !== undefined ? body.name.trim() : existing[0].name;
    if (!name) return badRequest("Bitte einen Projektnamen angeben.");

    const color =
      body.color !== undefined && PROJECT_COLORS.includes(body.color as never)
        ? body.color
        : existing[0].color;

    const updated = await sql<ProjectRow>`
      update projects set name = ${name}, color = ${color}
      where id = ${id} and user_id = ${user.id}
      returning id, name, color, position, created_at
    `;
    return NextResponse.json({ project: toProject(updated[0]) });
  } catch (error) {
    return serverError(error);
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const user = await currentUser();
  if (!user) return unauthorized();

  const { id } = await params;
  try {
    // Aufgaben bleiben erhalten und wandern zurück in den Eingang.
    await sql`update todos set project_id = null, updated_at = now() where project_id = ${id} and user_id = ${user.id}`;
    const deleted = await sql<{ id: string }>`
      delete from projects where id = ${id} and user_id = ${user.id} returning id
    `;
    if (deleted.length === 0) return notFound("Projekt nicht gefunden.");
    return NextResponse.json({ ok: true });
  } catch (error) {
    return serverError(error);
  }
}
