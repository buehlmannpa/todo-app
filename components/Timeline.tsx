"use client";

import { useEffect, useState } from "react";
import { useStore } from "./store";
import { IconPlus } from "./Icons";
import { formatTime, isSameDay } from "@/lib/format";
import type { Todo } from "@/lib/types";

interface Props {
  day: Date;
  todos: Todo[];
}

const DEFAULT_START = 7;
const DEFAULT_END = 21;

/**
 * Tagesplan im Stil einer Agenda: Aufgaben mit Uhrzeit liegen in ihrem
 * Zeitfenster, alles ohne Uhrzeit steht oben als ganztägig.
 */
export default function Timeline({ day, todos }: Props) {
  const { openDetail, openQuickAdd, projectById, setCompleted } = useStore();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  const timed = todos
    .filter((todo) => todo.dueAt && !todo.dueAllDay)
    .sort((a, b) => (a.dueAt! < b.dueAt! ? -1 : 1));
  const allDay = todos.filter((todo) => !todo.dueAt || todo.dueAllDay);

  const hours = timed.map((todo) => new Date(todo.dueAt as string).getHours());
  const start = Math.min(DEFAULT_START, ...(hours.length > 0 ? hours : [DEFAULT_START]));
  const end = Math.max(DEFAULT_END, ...(hours.length > 0 ? hours.map((hour) => hour + 1) : [DEFAULT_END]));

  const showNow = isSameDay(day, now);
  const rows: number[] = [];
  for (let hour = start; hour <= end; hour += 1) rows.push(hour);

  return (
    <div className="card">
      {allDay.length > 0 ? (
        <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--hairline)" }}>
          <div className="detail-label" style={{ marginBottom: 8 }}>
            Ganztägig
          </div>
          <div className="chips">
            {allDay.map((todo) => {
              const project = projectById(todo.projectId);
              return (
                <button
                  key={todo.id}
                  type="button"
                  className="chip"
                  onClick={() => openDetail(todo.id)}
                  style={{ opacity: todo.completedAt ? 0.5 : 1 }}
                >
                  {project ? (
                    <span className="dot" style={{ background: `var(--p-${project.color})` }} />
                  ) : null}
                  {todo.title}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="timeline">
        {rows.map((hour) => {
          const inHour = timed.filter(
            (todo) => new Date(todo.dueAt as string).getHours() === hour,
          );
          const isCurrentHour = showNow && now.getHours() === hour;

          return (
            <div className="tl-row" key={hour}>
              <div className="tl-hour">{String(hour).padStart(2, "0")}:00</div>
              <div className="tl-slot">
                {isCurrentHour ? (
                  <div className="tl-now" style={{ top: `${(now.getMinutes() / 60) * 100}%` }} />
                ) : null}

                {inHour.map((todo) => {
                  const project = projectById(todo.projectId);
                  const startTime = new Date(todo.dueAt as string);
                  return (
                    <div key={todo.id} className="tl-block" data-done={Boolean(todo.completedAt)}>
                      <button
                        type="button"
                        className="todo-check"
                        data-done={Boolean(todo.completedAt)}
                        style={{ width: 18, height: 18 }}
                        aria-label="Erledigt"
                        onClick={() => void setCompleted(todo.id, !todo.completedAt)}
                      />
                      <button
                        type="button"
                        onClick={() => openDetail(todo.id)}
                        style={{
                          flex: 1,
                          textAlign: "left",
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          minWidth: 0,
                        }}
                      >
                        {project ? (
                          <span
                            className="dot"
                            style={{ background: `var(--p-${project.color})` }}
                          />
                        ) : null}
                        <span
                          style={{
                            flex: 1,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {todo.title}
                        </span>
                        <span className="tl-time">
                          {formatTime(startTime)} bis{" "}
                          {formatTime(
                            new Date(startTime.getTime() + todo.durationMinutes * 60_000),
                          )}
                        </span>
                      </button>
                    </div>
                  );
                })}

                <button
                  type="button"
                  className="tl-add"
                  aria-label={`Aufgabe um ${hour} Uhr anlegen`}
                  onClick={() => {
                    const slot = new Date(day.getTime());
                    slot.setHours(hour, 0, 0, 0);
                    openQuickAdd({ dueAt: slot.toISOString() });
                  }}
                >
                  <IconPlus size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
