import { sql } from "./db";
import { toProject, toTodo, type ProjectRow, type TodoRow } from "./serialize";
import type { Project, Todo } from "./types";

export async function loadProjects(userId: string): Promise<Project[]> {
  const rows = await sql<ProjectRow>`
    select id, name, color, position, created_at
    from projects
    where user_id = ${userId}
    order by position asc, lower(name) asc
  `;
  return rows.map(toProject);
}

/** Offene Aufgaben vollständig, abgehakte aus den letzten 180 Tagen fürs Archiv. */
export async function loadTodos(userId: string): Promise<Todo[]> {
  const rows = await sql<TodoRow>`
    select * from todos
    where user_id = ${userId}
      and (completed_at is null or completed_at > now() - interval '180 days')
    order by position asc, created_at asc
  `;
  return rows.map(toTodo);
}
