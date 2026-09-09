const LOCALE = "de-CH";

export function startOfDay(date: Date): Date {
  const copy = new Date(date.getTime());
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export function endOfDay(date: Date): Date {
  const copy = new Date(date.getTime());
  copy.setHours(23, 59, 59, 999);
  return copy;
}

export function addDays(date: Date, days: number): Date {
  const copy = new Date(date.getTime());
  copy.setDate(copy.getDate() + days);
  return copy;
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

export function isOverdue(date: Date): boolean {
  return date.getTime() < Date.now();
}

export function formatTime(date: Date): string {
  return new Intl.DateTimeFormat(LOCALE, { hour: "2-digit", minute: "2-digit" }).format(date);
}

export function formatWeekday(date: Date): string {
  return new Intl.DateTimeFormat(LOCALE, { weekday: "long" }).format(date);
}

export function formatLongDate(date: Date): string {
  return new Intl.DateTimeFormat(LOCALE, {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);
}

export function formatShortDate(date: Date): string {
  return new Intl.DateTimeFormat(LOCALE, { day: "numeric", month: "short" }).format(date);
}

/** Kurzes Label für die Aufgabenliste, zum Beispiel "Heute 14:00" oder "Fr, 7. Nov". */
export function formatDueLabel(value: string, allDay: boolean): string {
  const date = new Date(value);
  const today = new Date();
  const time = allDay ? "" : ` ${formatTime(date)}`;

  if (isSameDay(date, today)) return `Heute${time}`;
  if (isSameDay(date, addDays(today, 1))) return `Morgen${time}`;
  if (isSameDay(date, addDays(today, -1))) return `Gestern${time}`;

  const withinWeek = date.getTime() > today.getTime() && date.getTime() < addDays(today, 7).getTime();
  if (withinWeek) {
    const weekday = new Intl.DateTimeFormat(LOCALE, { weekday: "short" }).format(date);
    return `${weekday}${time}`;
  }

  const sameYear = date.getFullYear() === today.getFullYear();
  const datePart = new Intl.DateTimeFormat(LOCALE, {
    day: "numeric",
    month: "short",
    year: sameYear ? undefined : "numeric",
  }).format(date);
  return `${datePart}${time}`;
}

/** Wandelt ein Datum in den Wert eines input[type=date] Feldes (lokale Zeit). */
export function toDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function toTimeInputValue(date: Date): string {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

/** Baut aus den Werten von input[type=date] und input[type=time] ein Datum. */
export function fromInputValues(dateValue: string, timeValue: string | null): Date | null {
  if (!dateValue) return null;
  const [year, month, day] = dateValue.split("-").map(Number);
  if (!year || !month || !day) return null;
  const date = new Date(year, month - 1, day, 0, 0, 0, 0);
  if (timeValue) {
    const [hours, minutes] = timeValue.split(":").map(Number);
    date.setHours(hours || 0, minutes || 0, 0, 0);
  }
  return date;
}
