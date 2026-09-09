import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { badRequest, currentUser, notFound, readJson, serverError, unauthorized } from "@/lib/api";
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
import type { Priority } from "@/lib/types";

interface Params {
  params: Promise<{ id: string }>;
}

function has<K extends keyof TodoInput>(body: TodoInput, key: K): boolean {
  return Object.prototype.hasOwnProperty.call(body, key);
}

export async function PATCH(request: Request, { params }: Params) {
  const user = await currentUser();
  if (!user) return unauthorized();

  const { id } = await params;
  const body = await readJson<TodoInput>(request);
  if (!body) return badRequest("Ungültige Anfrage.");

  try {
    const existingRows = await sql<TodoRow>`
      select * from todos where id = ${id} and user_id = ${user.id}
    `;
    if (existingRows.length === 0) return notFound("Aufgabe nicht gefunden.");
    const current = existingRows[0];

    const title = has(body, "title") ? (body.title ?? "").trim() : current.title;
    if (!title) return badRequest("Der Titel darf nicht leer sein.");

    let projectId = current.project_id;
    if (has(body, "projectId")) {
      if (!body.projectId) {
        projectId = null;
      } else {
        const owned = await sql<{ id: string }>`
          select id from projects where id = ${body.projectId} and user_id = ${user.id}
        `;
        projectId = owned.length > 0 ? owned[0].id : null;
      }
    }

    const dueAt = has(body, "dueAt") ? parseDate(body.dueAt) : current.due_at;
    const remindAt = has(body, "remindAt") ? parseDate(body.remindAt) : current.remind_at;
    // Wird der Reminder verschoben, soll er erneut ausgelöst werden können.
    const reminderSentAt = has(body, "remindAt") ? null : undefined;

    const updated = await sql<TodoRow>`
      update todos set
        title = ${title},
        notes = ${has(body, "notes") ? (body.notes ?? "") : current.notes},
        link = ${has(body, "link") ? parseLink(body.link) : current.link},
        starred = ${has(body, "starred") ? Boolean(body.starred) : current.starred},
        priority = ${
          has(body, "priority")
            ? parsePriority(body.priority, current.priority as Priority)
            : current.priority
        },
        project_id = ${projectId},
        due_at = ${dueAt},
        due_all_day = ${has(body, "dueAllDay") ? Boolean(body.dueAllDay) : current.due_all_day},
        duration_minutes = ${
          has(body, "durationMinutes")
            ? clampDuration(body.durationMinutes, current.duration_minutes)
            : current.duration_minutes
        },
        remind_at = ${remindAt},
        reminder_sent_at = ${reminderSentAt === undefined ? current.reminder_sent_at ?? null : null},
        repeat_mode = ${has(body, "repeatMode") ? parseRepeatMode(body.repeatMode) : current.repeat_mode},
        repeat_unit = ${has(body, "repeatUnit") ? parseRepeatUnit(body.repeatUnit) : current.repeat_unit},
        repeat_interval = ${
          has(body, "repeatInterval")
            ? clampInterval(body.repeatInterval, current.repeat_interval)
            : current.repeat_interval
        },
        position = ${has(body, "position") ? Number(body.position) : current.position},
        updated_at = now()
      where id = ${id} and user_id = ${user.id}
      returning *
    `;

    return NextResponse.json({ todo: toTodo(updated[0]) });
  } catch (error) {
    return serverError(error);
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const user = await currentUser();
  if (!user) return unauthorized();

  const { id } = await params;
  try {
    const deleted = await sql<{ id: string }>`
      delete from todos where id = ${id} and user_id = ${user.id} returning id
    `;
    if (deleted.length === 0) return notFound("Aufgabe nicht gefunden.");
    return NextResponse.json({ ok: true });
  } catch (error) {
    return serverError(error);
  }
}
