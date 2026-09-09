"use client";

import { useState } from "react";
import Sheet from "./Sheet";
import { useStore } from "./store";
import { addDays, fromInputValues, startOfDay, toDateInputValue, toTimeInputValue } from "@/lib/format";
import type { Todo } from "@/lib/types";

interface Props {
  todo: Todo;
  onClose: () => void;
}

type ReminderOption = "none" | "at" | "10m" | "1h" | "1d";

const REMINDER_LABEL: Record<ReminderOption, string> = {
  none: "Keine",
  at: "Zum Zeitpunkt",
  "10m": "10 Min vorher",
  "1h": "1 Std vorher",
  "1d": "1 Tag vorher",
};

const OFFSET_MINUTES: Record<Exclude<ReminderOption, "none">, number> = {
  at: 0,
  "10m": 10,
  "1h": 60,
  "1d": 60 * 24,
};

/** Ganztägige Aufgaben melden sich standardmässig um 09:00. */
const ALL_DAY_HOUR = 9;

export default function DateSheet({ todo, onClose }: Props) {
  const { updateTodo } = useStore();
  const existingDue = todo.dueAt ? new Date(todo.dueAt) : null;

  const [dateValue, setDateValue] = useState(existingDue ? toDateInputValue(existingDue) : "");
  const [withTime, setWithTime] = useState(Boolean(existingDue) && !todo.dueAllDay);
  const [timeValue, setTimeValue] = useState(
    existingDue && !todo.dueAllDay ? toTimeInputValue(existingDue) : "09:00",
  );
  // Ohne bestehenden Termin wird direkt eine Erinnerung vorgeschlagen.
  const [reminder, setReminder] = useState<ReminderOption>(
    todo.remindAt ? "at" : existingDue ? "none" : "at",
  );

  const quick = (days: number | null) => {
    if (days === null) {
      setDateValue("");
      return;
    }
    setDateValue(toDateInputValue(addDays(startOfDay(new Date()), days)));
  };

  const save = async () => {
    if (!dateValue) {
      await updateTodo(todo.id, { dueAt: null, remindAt: null, dueAllDay: true });
      onClose();
      return;
    }

    const due = fromInputValues(dateValue, withTime ? timeValue : null);
    if (!due) {
      onClose();
      return;
    }

    let remindAt: string | null = null;
    if (reminder !== "none") {
      const base = new Date(due.getTime());
      if (!withTime) base.setHours(ALL_DAY_HOUR, 0, 0, 0);
      base.setMinutes(base.getMinutes() - OFFSET_MINUTES[reminder]);
      remindAt = base.toISOString();
    }

    await updateTodo(todo.id, {
      dueAt: due.toISOString(),
      dueAllDay: !withTime,
      remindAt,
    });
    onClose();
  };

  return (
    <Sheet title="Datum und Erinnerung" onClose={onClose}>
      <p className="muted small" style={{ margin: "-8px 0 14px" }}>
        {todo.title}
      </p>

      <div className="chips" style={{ marginBottom: 16 }}>
        <button type="button" className="chip" onClick={() => quick(0)}>
          Heute
        </button>
        <button type="button" className="chip" onClick={() => quick(1)}>
          Morgen
        </button>
        <button type="button" className="chip" onClick={() => quick(3)}>
          In 3 Tagen
        </button>
        <button type="button" className="chip" onClick={() => quick(7)}>
          Nächste Woche
        </button>
        <button type="button" className="chip" onClick={() => quick(null)}>
          Kein Datum
        </button>
      </div>

      <div className="field">
        <label className="label" htmlFor="due-date">
          Datum
        </label>
        <input
          id="due-date"
          className="input"
          type="date"
          value={dateValue}
          onChange={(event) => setDateValue(event.target.value)}
        />
      </div>

      <div className="switch-row">
        <span className="label" style={{ margin: 0 }}>
          Mit Uhrzeit
        </span>
        <button
          type="button"
          className="switch"
          data-on={withTime}
          aria-pressed={withTime}
          aria-label="Uhrzeit verwenden"
          onClick={() => setWithTime((value) => !value)}
        />
      </div>

      {withTime ? (
        <div className="field">
          <input
            className="input"
            type="time"
            value={timeValue}
            onChange={(event) => setTimeValue(event.target.value)}
          />
        </div>
      ) : null}

      <div className="field">
        <label className="label" htmlFor="reminder">
          Erinnerung
        </label>
        <select
          id="reminder"
          className="select"
          value={reminder}
          onChange={(event) => setReminder(event.target.value as ReminderOption)}
          disabled={!dateValue}
        >
          {(Object.keys(REMINDER_LABEL) as ReminderOption[]).map((option) => (
            <option key={option} value={option}>
              {REMINDER_LABEL[option]}
            </option>
          ))}
        </select>
      </div>

      <div className="row" style={{ marginTop: 18 }}>
        <button type="button" className="btn btn-ghost" onClick={onClose}>
          Abbrechen
        </button>
        <button type="button" className="btn btn-primary" onClick={() => void save()}>
          Sichern
        </button>
      </div>
    </Sheet>
  );
}
