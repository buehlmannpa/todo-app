export type Priority = "none" | "low" | "medium" | "high";
export type RepeatMode = "schedule" | "completion";
export type RepeatUnit = "day" | "week" | "month" | "year";

export const PRIORITY_ORDER: Record<Priority, number> = {
  high: 0,
  medium: 1,
  low: 2,
  none: 3,
};

export const PRIORITY_LABEL: Record<Priority, string> = {
  none: "Keine",
  low: "Tief",
  medium: "Mittel",
  high: "Hoch",
};

export const REPEAT_UNIT_PLURAL: Record<RepeatUnit, string> = {
  day: "Tage",
  week: "Wochen",
  month: "Monate",
  year: "Jahre",
};

export const PROJECT_COLORS = [
  "blue",
  "purple",
  "pink",
  "red",
  "orange",
  "yellow",
  "green",
  "teal",
  "graphite",
] as const;

export type ProjectColor = (typeof PROJECT_COLORS)[number];

export interface Project {
  id: string;
  name: string;
  color: ProjectColor;
  position: number;
  createdAt: string;
}

export interface Todo {
  id: string;
  projectId: string | null;
  title: string;
  notes: string;
  link: string | null;
  starred: boolean;
  priority: Priority;
  dueAt: string | null;
  dueAllDay: boolean;
  durationMinutes: number;
  remindAt: string | null;
  repeatMode: RepeatMode | null;
  repeatUnit: RepeatUnit | null;
  repeatInterval: number;
  position: number;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SessionUser {
  id: string;
  username: string;
  email: string;
}

export interface Bootstrap {
  user: SessionUser;
  projects: Project[];
  todos: Todo[];
}
