import type { RepeatUnit } from "./types";

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
}

/**
 * Addiert ein Intervall auf ein Datum. Bei Monaten und Jahren wird der Tag
 * geklemmt, damit aus dem 31. Januar der 28. Februar wird und nicht der 3. März.
 */
export function addInterval(date: Date, unit: RepeatUnit, interval: number): Date {
  const next = new Date(date.getTime());
  const step = Math.max(1, Math.floor(interval));

  if (unit === "day") {
    next.setUTCDate(next.getUTCDate() + step);
    return next;
  }
  if (unit === "week") {
    next.setUTCDate(next.getUTCDate() + step * 7);
    return next;
  }

  const monthsToAdd = unit === "month" ? step : step * 12;
  const day = next.getUTCDate();
  const targetMonthIndex = next.getUTCMonth() + monthsToAdd;
  const targetYear = next.getUTCFullYear() + Math.floor(targetMonthIndex / 12);
  const targetMonth = ((targetMonthIndex % 12) + 12) % 12;

  next.setUTCFullYear(targetYear, targetMonth, Math.min(day, daysInMonth(targetYear, targetMonth)));
  return next;
}

export interface RepeatInput {
  repeatMode: "schedule" | "completion" | null;
  repeatUnit: RepeatUnit | null;
  repeatInterval: number;
  dueAt: Date | null;
  remindAt: Date | null;
}

export interface NextOccurrence {
  dueAt: Date | null;
  remindAt: Date | null;
}

/**
 * Berechnet den nächsten Termin einer Wiederholung.
 *
 * "schedule"   -- fixer Rhythmus, ausgehend vom bisherigen Fälligkeitsdatum.
 *                 Liegt der neue Termin noch in der Vergangenheit, wird so lange
 *                 weitergerechnet, bis er in der Zukunft liegt.
 * "completion" -- der Rhythmus startet erst beim Abhaken.
 */
export function nextOccurrence(
  todo: RepeatInput,
  completedAt: Date = new Date(),
): NextOccurrence | null {
  if (!todo.repeatMode || !todo.repeatUnit) return null;

  const interval = Math.max(1, todo.repeatInterval || 1);
  const offset =
    todo.dueAt && todo.remindAt ? todo.remindAt.getTime() - todo.dueAt.getTime() : null;

  let base: Date;
  if (todo.repeatMode === "completion") {
    base = completedAt;
  } else {
    base = todo.dueAt ?? completedAt;
  }

  let nextDue = addInterval(base, todo.repeatUnit, interval);

  if (todo.repeatMode === "schedule") {
    let guard = 0;
    while (nextDue.getTime() <= completedAt.getTime() && guard < 500) {
      nextDue = addInterval(nextDue, todo.repeatUnit, interval);
      guard += 1;
    }
  }

  let nextRemind: Date | null = null;
  if (offset !== null) {
    nextRemind = new Date(nextDue.getTime() + offset);
  } else if (todo.remindAt) {
    nextRemind = addInterval(todo.remindAt, todo.repeatUnit, interval);
    if (todo.repeatMode === "completion") {
      nextRemind = new Date(nextDue.getTime());
    }
  }

  return { dueAt: nextDue, remindAt: nextRemind };
}

export function describeRepeat(
  mode: "schedule" | "completion" | null,
  unit: RepeatUnit | null,
  interval: number,
): string {
  if (!mode || !unit) return "Nie";

  const rhythmic: Record<RepeatUnit, string> = {
    day: "Täglich",
    week: "Wöchentlich",
    month: "Monatlich",
    year: "Jährlich",
  };
  const plural: Record<RepeatUnit, string> = {
    day: "Tage",
    week: "Wochen",
    month: "Monate",
    year: "Jahre",
  };
  const dative: Record<RepeatUnit, string> = {
    day: "einem Tag",
    week: "einer Woche",
    month: "einem Monat",
    year: "einem Jahr",
  };

  if (mode === "completion") {
    return interval === 1
      ? `Nach dem Abhaken: nach ${dative[unit]}`
      : `Nach dem Abhaken: nach ${interval} ${plural[unit]}`;
  }
  return interval === 1 ? rhythmic[unit] : `Alle ${interval} ${plural[unit]}`;
}
