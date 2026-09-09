import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { badRequest, currentUser, readJson, serverError, unauthorized } from "@/lib/api";
import { toTodo, type TodoRow } from "@/lib/serialize";
import {
  clampDuration,
  clampInterval,
  parseDate,
  parseLink,
  parsePriority,
  parseRepeatMode,
  parseRepeatUnit,
  type TodoInput,
} from "@/lib/todo-input";

export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) return unauthorized();

  const body = await readJson<TodoInput>(request);
  const title = (body?.title ?? "").trim();
  if (!title) return badRequest("Bitte einen Titel angeben.");
  if (title.length > 500) return badRequest("Der Titel ist zu lang.");

  try {
    let projectId: string | null = null;
    if (body?.projectId) {
      const owned = await sql<{ id: string }>`
        select id from projects where id = ${body.projectId} and user_id = ${user.id}
      `;
      projectId = owned.length > 0 ? owned[0].id : null;
    }

    const rows = await sql<{ min: number | null }>`
      select min(position) as min from todos where user_id = ${user.id} and completed_at is null
    `;
    const position = Number(rows[0]?.min ?? 0) - 1;

    const created = await sql<TodoRow>`
      insert into todos (
        user_id, project_id, title, notes, link, starred, priority,
        due_at, due_all_day, duration_minutes, remind_at,
        repeat_mode, repeat_unit, repeat_interval, position
      ) values (
        ${user.id}, ${projectId}, ${title}, ${body?.notes ?? ""}, ${parseLink(body?.link)},
        ${Boolean(body?.starred)}, ${parsePriority(body?.priority)},
        ${parseDate(body?.dueAt)}, ${body?.dueAllDay ?? true}, ${clampDuration(body?.durationMinutes)},
        ${parseDate(body?.remindAt)}, ${parseRepeatMode(body?.repeatMode)},
        ${parseRepeatUnit(body?.repeatUnit)}, ${clampInterval(body?.repeatInterval)}, ${position}
      )
      returning *
    `;

    return NextResponse.json({ todo: toTodo(created[0]) });
  } catch (error) {
    return serverError(error);
  }
}
