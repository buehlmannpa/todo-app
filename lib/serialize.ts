import type { Priority, Project, ProjectColor, RepeatMode, RepeatUnit, Todo } from "./types";

export interface TodoRow {
  id: string;
  project_id: string | null;
  title: string;
  notes: string;
  link: string | null;
  starred: boolean;
  priority: string;
  due_at: Date | string | null;
  due_all_day: boolean;
  duration_minutes: number;
  remind_at: Date | string | null;
  reminder_sent_at?: Date | string | null;
  repeat_mode: string | null;
  repeat_unit: string | null;
  repeat_interval: number;
  position: number;
  completed_at: Date | string | null;
  created_at: Date | string;
  updated_at: Date | string;
}

export interface ProjectRow {
  id: string;
  name: string;
  color: string;
  position: number;
  created_at: Date | string;
}

function iso(value: Date | string | null): string | null {
  if (value === null || value === undefined) return null;
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

export function toTodo(row: TodoRow): Todo {
  return {
    id: row.id,
    projectId: row.project_id,
    title: row.title,
    notes: row.notes ?? "",
    link: row.link,
    starred: row.starred,
    priority: (row.priority ?? "none") as Priority,
    dueAt: iso(row.due_at),
    dueAllDay: row.due_all_day,
    durationMinutes: row.duration_minutes ?? 30,
    remindAt: iso(row.remind_at),
    repeatMode: (row.repeat_mode as RepeatMode | null) ?? null,
    repeatUnit: (row.repeat_unit as RepeatUnit | null) ?? null,
    repeatInterval: row.repeat_interval ?? 1,
    position: Number(row.position ?? 0),
    completedAt: iso(row.completed_at),
    createdAt: iso(row.created_at) as string,
    updatedAt: iso(row.updated_at) as string,
  };
}

export function toProject(row: ProjectRow): Project {
  return {
    id: row.id,
    name: row.name,
    color: (row.color ?? "blue") as ProjectColor,
    position: Number(row.position ?? 0),
    createdAt: iso(row.created_at) as string,
  };
}
