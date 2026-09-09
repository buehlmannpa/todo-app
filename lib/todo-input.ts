import type { Priority, RepeatMode, RepeatUnit } from "./types";

const PRIORITIES: Priority[] = ["none", "low", "medium", "high"];
const MODES: RepeatMode[] = ["schedule", "completion"];
const UNITS: RepeatUnit[] = ["day", "week", "month", "year"];

export interface TodoInput {
  title?: string;
  notes?: string;
  link?: string | null;
  starred?: boolean;
  priority?: string;
  projectId?: string | null;
  dueAt?: string | null;
  dueAllDay?: boolean;
  durationMinutes?: number;
  remindAt?: string | null;
  repeatMode?: string | null;
  repeatUnit?: string | null;
  repeatInterval?: number;
  position?: number;
}

export function parsePriority(value: unknown, fallback: Priority = "none"): Priority {
  return PRIORITIES.includes(value as Priority) ? (value as Priority) : fallback;
}

export function parseRepeatMode(value: unknown): RepeatMode | null {
  return MODES.includes(value as RepeatMode) ? (value as RepeatMode) : null;
}

export function parseRepeatUnit(value: unknown): RepeatUnit | null {
  return UNITS.includes(value as RepeatUnit) ? (value as RepeatUnit) : null;
}

export function parseDate(value: unknown): Date | null {
  if (value === null || value === undefined || value === "") return null;
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Erlaubt nur http und https, damit keine javascript: Links gespeichert werden. */
export function parseLink(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const raw = String(value).trim();
  if (!raw) return null;
  const candidate = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    const url = new URL(candidate);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.toString();
  } catch {
    return null;
  }
}

export function clampDuration(value: unknown, fallback = 30): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(480, Math.max(5, Math.round(parsed)));
}

export function clampInterval(value: unknown, fallback = 1): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(365, Math.max(1, Math.round(parsed)));
}
