import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { badRequest, currentUser, readJson, serverError, unauthorized } from "@/lib/api";
import { toProject, type ProjectRow } from "@/lib/serialize";
import { PROJECT_COLORS } from "@/lib/types";

interface Body {
  name?: string;
  color?: string;
}

export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) return unauthorized();

  const body = await readJson<Body>(request);
  const name = (body?.name ?? "").trim();
  if (!name) return badRequest("Bitte einen Projektnamen angeben.");
  if (name.length > 80) return badRequest("Der Projektname ist zu lang.");

  const color = PROJECT_COLORS.includes((body?.color ?? "") as never)
    ? (body?.color as string)
    : "blue";

  try {
    const rows = await sql<{ max: number | null }>`
      select max(position) as max from projects where user_id = ${user.id}
    `;
    const position = Number(rows[0]?.max ?? 0) + 1;

    const created = await sql<ProjectRow>`
      insert into projects (user_id, name, color, position)
      values (${user.id}, ${name}, ${color}, ${position})
      returning id, name, color, position, created_at
    `;
    return NextResponse.json({ project: toProject(created[0]) });
  } catch (error) {
    return serverError(error);
  }
}
