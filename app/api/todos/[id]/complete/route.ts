import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { currentUser, notFound, readJson, serverError, unauthorized } from "@/lib/api";
import { toTodo, type TodoRow } from "@/lib/serialize";
import { nextOccurrence } from "@/lib/recurrence";
import type { RepeatMode, RepeatUnit } from "@/lib/types";

interface Params {
  params: Promise<{ id: string }>;
}

interface Body {
  completed?: boolean;
}

function asDate(value: Date | string | null): Date | null {
  if (!value) return null;
  return value instanceof Date ? value : new Date(value);
}

export async function POST(request: Request, { params }: Params) {
  const user = await currentUser();
  if (!user) return unauthorized();

  const { id } = await params;
  const body = await readJson<Body>(request);
  const completed = body?.completed !== false;

  try {
    const rows = await sql<TodoRow>`
      select * from todos where id = ${id} and user_id = ${user.id}
    `;
    if (rows.length === 0) return notFound("Aufgabe nicht gefunden.");
    const current = rows[0];

    if (!completed) {
      const reopened = await sql<TodoRow>`
        update todos set completed_at = null, updated_at = now()
        where id = ${id} and user_id = ${user.id}
        returning *
      `;
      return NextResponse.json({ todo: toTodo(reopened[0]), created: null });
    }

    const completedAt = new Date();
    const done = await sql<TodoRow>`
      update todos set completed_at = ${completedAt}, updated_at = now()
      where id = ${id} and user_id = ${user.id}
      returning *
    `;

    // Wiederkehrende Aufgabe: die nächste Instanz wird sofort angelegt,
    // die abgehakte bleibt im Archiv sichtbar.
    const next = nextOccurrence(
      {
        repeatMode: current.repeat_mode as RepeatMode | null,
        repeatUnit: current.repeat_unit as RepeatUnit | null,
        repeatInterval: current.repeat_interval,
        dueAt: asDate(current.due_at),
        remindAt: asDate(current.remind_at),
      },
      completedAt,
    );

    let created: TodoRow | null = null;
    if (next) {
      const inserted = await sql<TodoRow>`
        insert into todos (
          user_id, project_id, title, notes, link, starred, priority,
          due_at, due_all_day, duration_minutes, remind_at,
          repeat_mode, repeat_unit, repeat_interval, position
        ) values (
          ${user.id}, ${current.project_id}, ${current.title}, ${current.notes}, ${current.link},
          ${current.starred}, ${current.priority}, ${next.dueAt}, ${current.due_all_day},
          ${current.duration_minutes}, ${next.remindAt}, ${current.repeat_mode},
          ${current.repeat_unit}, ${current.repeat_interval}, ${current.position}
        )
        returning *
      `;
      created = inserted[0];
    }

    return NextResponse.json({
      todo: toTodo(done[0]),
      created: created ? toTodo(created) : null,
    });
  } catch (error) {
    return serverError(error);
  }
}
