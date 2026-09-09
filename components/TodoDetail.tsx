"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useStore } from "./store";
import {
  IconCheck,
  IconClose,
  IconLink,
  IconStar,
  IconTrash,
} from "./Icons";
import { sanitizeHtml } from "@/lib/sanitize";
import { describeRepeat } from "@/lib/recurrence";
import { fromInputValues, toDateInputValue, toTimeInputValue } from "@/lib/format";
import {
  PRIORITY_LABEL,
  REPEAT_UNIT_PLURAL,
  type Priority,
  type RepeatMode,
  type RepeatUnit,
} from "@/lib/types";

const PRIORITIES: Priority[] = ["none", "low", "medium", "high"];
const UNITS: RepeatUnit[] = ["day", "week", "month", "year"];
const ALL_DAY_HOUR = 9;

interface Command {
  label: string;
  title: string;
  run: () => void;
}

export default function TodoDetail() {
  const { detailId, openDetail, todos, projects, updateTodo, deleteTodo, setCompleted } = useStore();
  const todo = todos.find((item) => item.id === detailId) ?? null;

  const editorRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLTextAreaElement>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [title, setTitle] = useState("");
  const [linkDraft, setLinkDraft] = useState("");
  const [showLinkField, setShowLinkField] = useState(false);

  useEffect(() => {
    if (!todo) return;
    setTitle(todo.title);
    setLinkDraft(todo.link ?? "");
    setShowLinkField(Boolean(todo.link));
    if (editorRef.current) editorRef.current.innerHTML = todo.notes || "";
    // Nur beim Wechsel der geöffneten Aufgabe zurücksetzen.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detailId]);

  const flush = useCallback(() => {
    if (!todo) return;
    const notes = editorRef.current ? sanitizeHtml(editorRef.current.innerHTML) : todo.notes;
    const trimmed = title.trim();
    const patch: Record<string, unknown> = {};
    if (trimmed && trimmed !== todo.title) patch.title = trimmed;
    if (notes !== todo.notes) patch.notes = notes;
    if (Object.keys(patch).length > 0) void updateTodo(todo.id, patch);
  }, [title, todo, updateTodo]);

  const scheduleSave = useCallback(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(flush, 700);
  }, [flush]);

  const close = useCallback(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    flush();
    openDetail(null);
  }, [flush, openDetail]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [close]);

  useEffect(() => {
    const element = titleRef.current;
    if (!element) return;
    element.style.height = "auto";
    element.style.height = `${element.scrollHeight}px`;
  }, [title]);

  const commands = useMemo<Command[]>(() => {
    const exec = (command: string, value?: string) => {
      editorRef.current?.focus();
      document.execCommand(command, false, value);
      scheduleSave();
    };
    return [
      { label: "B", title: "Fett", run: () => exec("bold") },
      { label: "I", title: "Kursiv", run: () => exec("italic") },
      { label: "U", title: "Unterstrichen", run: () => exec("underline") },
      { label: "S", title: "Durchgestrichen", run: () => exec("strikeThrough") },
      { label: "H", title: "Titel", run: () => exec("formatBlock", "<h2>") },
      { label: "T", title: "Fliesstext", run: () => exec("formatBlock", "<p>") },
      { label: "•", title: "Liste", run: () => exec("insertUnorderedList") },
      { label: "1.", title: "Nummerierte Liste", run: () => exec("insertOrderedList") },
      { label: "❝", title: "Zitat", run: () => exec("formatBlock", "<blockquote>") },
      {
        label: "🔗",
        title: "Link im Text",
        run: () => {
          const url = window.prompt("Adresse des Links");
          if (url && /^https?:\/\//i.test(url)) exec("createLink", url);
        },
      },
    ];
  }, [scheduleSave]);

  if (!todo) return null;

  const done = Boolean(todo.completedAt);
  const due = todo.dueAt ? new Date(todo.dueAt) : null;
  const remind = todo.remindAt ? new Date(todo.remindAt) : null;

  const setDue = (dateValue: string, timeValue: string | null) => {
    if (!dateValue) {
      void updateTodo(todo.id, { dueAt: null, remindAt: null, dueAllDay: true });
      return;
    }
    const next = fromInputValues(dateValue, timeValue);
    if (!next) return;
    void updateTodo(todo.id, { dueAt: next.toISOString(), dueAllDay: timeValue === null });
  };

  const setReminder = (dateValue: string, timeValue: string) => {
    if (!dateValue) {
      void updateTodo(todo.id, { remindAt: null });
      return;
    }
    const next = fromInputValues(dateValue, timeValue || "09:00");
    if (!next) return;
    void updateTodo(todo.id, { remindAt: next.toISOString() });
  };

  const enableReminder = () => {
    const base = due ? new Date(due.getTime()) : new Date();
    if (!due || todo.dueAllDay) base.setHours(ALL_DAY_HOUR, 0, 0, 0);
    if (!due) base.setDate(base.getDate() + 1);
    void updateTodo(todo.id, { remindAt: base.toISOString() });
  };

  const setRepeat = (mode: RepeatMode | null, unit: RepeatUnit | null, interval: number) => {
    void updateTodo(todo.id, {
      repeatMode: mode,
      repeatUnit: mode ? unit ?? "day" : null,
      repeatInterval: Math.max(1, interval),
    });
  };

  const saveLink = () => {
    const value = linkDraft.trim();
    void updateTodo(todo.id, { link: value ? value : null });
    if (!value) setShowLinkField(false);
  };

  return (
    <div className="detail">
      <div className="detail-bar">
        <button type="button" className="icon-btn" onClick={close} aria-label="Schliessen">
          <IconClose size={19} />
        </button>

        <div className="spread" style={{ gap: 4 }}>
          <button
            type="button"
            className="icon-btn"
            data-on={todo.starred}
            style={{ color: todo.starred ? "var(--star)" : undefined }}
            aria-label="Stern"
            onClick={() => void updateTodo(todo.id, { starred: !todo.starred })}
          >
            <IconStar size={18} filled={todo.starred} />
          </button>
          <button
            type="button"
            className="icon-btn"
            aria-label="Löschen"
            style={{ color: "var(--prio-high)" }}
            onClick={() => {
              if (window.confirm("Diese Aufgabe wirklich löschen?")) void deleteTodo(todo.id);
            }}
          >
            <IconTrash size={18} />
          </button>
          <button
            type="button"
            className="btn btn-primary"
            style={{ padding: "8px 14px" }}
            onClick={() => void setCompleted(todo.id, !done)}
          >
            <IconCheck size={15} /> {done ? "Wieder öffnen" : "Erledigt"}
          </button>
        </div>
      </div>

      <div className="detail-scroll">
        <textarea
          ref={titleRef}
          className="detail-title"
          value={title}
          rows={1}
          placeholder="Titel"
          onChange={(event) => {
            setTitle(event.target.value);
            scheduleSave();
          }}
          onBlur={flush}
        />

        <div className="toolbar">
          {commands.map((command) => (
            <button
              key={command.label}
              type="button"
              className="tool"
              title={command.title}
              onMouseDown={(event) => event.preventDefault()}
              onClick={command.run}
            >
              {command.label}
            </button>
          ))}
        </div>

        <div
          ref={editorRef}
          className="editor"
          contentEditable
          suppressContentEditableWarning
          data-placeholder="Notizen, Details, Protokoll ..."
          onInput={scheduleSave}
          onBlur={flush}
        />

        <div className="detail-section">
          <div className="detail-label">Link</div>
          {showLinkField || todo.link ? (
            <div className="link-box">
              <IconLink size={16} />
              <input
                className="input"
                style={{ border: "none", background: "none", padding: 0 }}
                placeholder="https://..."
                value={linkDraft}
                onChange={(event) => setLinkDraft(event.target.value)}
                onBlur={saveLink}
                onKeyDown={(event) => {
                  if (event.key === "Enter") saveLink();
                }}
              />
              {todo.link ? (
                <a href={todo.link} target="_blank" rel="noopener noreferrer" className="chip">
                  Öffnen
                </a>
              ) : null}
            </div>
          ) : (
            <button type="button" className="chip" onClick={() => setShowLinkField(true)}>
              <IconLink size={14} /> Link hinterlegen
            </button>
          )}
        </div>

        <div className="detail-section">
          <div className="detail-label">Projekt</div>
          <div className="chips">
            <button
              type="button"
              className="chip"
              data-on={todo.projectId === null}
              onClick={() => void updateTodo(todo.id, { projectId: null })}
            >
              Eingang
            </button>
            {projects.map((project) => (
              <button
                key={project.id}
                type="button"
                className="chip"
                data-on={todo.projectId === project.id}
                onClick={() => void updateTodo(todo.id, { projectId: project.id })}
              >
                <span className="dot" style={{ background: `var(--p-${project.color})` }} />
                {project.name}
              </button>
            ))}
          </div>
        </div>

        <div className="detail-section">
          <div className="detail-label">Dringlichkeit</div>
          <div className="chips">
            {PRIORITIES.map((value) => (
              <button
                key={value}
                type="button"
                className="chip"
                data-on={todo.priority === value}
                data-tone={value}
                onClick={() => void updateTodo(todo.id, { priority: value })}
              >
                {PRIORITY_LABEL[value]}
              </button>
            ))}
          </div>
        </div>

        <div className="detail-section">
          <div className="detail-label">Fällig</div>
          <div className="row">
            <input
              className="input"
              type="date"
              value={due ? toDateInputValue(due) : ""}
              onChange={(event) =>
                setDue(event.target.value, due && !todo.dueAllDay ? toTimeInputValue(due) : null)
              }
            />
            <input
              className="input"
              type="time"
              value={due && !todo.dueAllDay ? toTimeInputValue(due) : ""}
              disabled={!due}
              onChange={(event) =>
                setDue(due ? toDateInputValue(due) : "", event.target.value || null)
              }
            />
          </div>
          {due ? (
            <div className="row" style={{ marginTop: 10 }}>
              <input
                className="input"
                type="number"
                min={5}
                max={480}
                step={5}
                value={todo.durationMinutes}
                onChange={(event) =>
                  void updateTodo(todo.id, { durationMinutes: Number(event.target.value) })
                }
              />
              <span className="muted small" style={{ alignSelf: "center" }}>
                Minuten in der Timeline
              </span>
            </div>
          ) : null}
        </div>

        <div className="detail-section">
          <div className="detail-label">Erinnerung</div>
          {remind ? (
            <div className="row">
              <input
                className="input"
                type="date"
                value={toDateInputValue(remind)}
                onChange={(event) => setReminder(event.target.value, toTimeInputValue(remind))}
              />
              <input
                className="input"
                type="time"
                value={toTimeInputValue(remind)}
                onChange={(event) => setReminder(toDateInputValue(remind), event.target.value)}
              />
              <button
                type="button"
                className="btn btn-ghost"
                style={{ flex: "none" }}
                onClick={() => void updateTodo(todo.id, { remindAt: null })}
              >
                Entfernen
              </button>
            </div>
          ) : (
            <button type="button" className="chip" onClick={enableReminder}>
              Erinnerung setzen
            </button>
          )}
        </div>

        <div className="detail-section">
          <div className="detail-label">Wiederholung</div>
          <div className="chips" style={{ marginBottom: 10 }}>
            <button
              type="button"
              className="chip"
              data-on={todo.repeatMode === null}
              onClick={() => setRepeat(null, null, 1)}
            >
              Nie
            </button>
            <button
              type="button"
              className="chip"
              data-on={todo.repeatMode === "schedule"}
              onClick={() => setRepeat("schedule", todo.repeatUnit ?? "week", todo.repeatInterval)}
            >
              Fixer Rhythmus
            </button>
            <button
              type="button"
              className="chip"
              data-on={todo.repeatMode === "completion"}
              onClick={() => setRepeat("completion", todo.repeatUnit ?? "week", todo.repeatInterval)}
            >
              Nach dem Abhaken
            </button>
          </div>

          {todo.repeatMode ? (
            <>
              <div className="row">
                <input
                  className="input"
                  type="number"
                  min={1}
                  max={365}
                  value={todo.repeatInterval}
                  onChange={(event) =>
                    setRepeat(todo.repeatMode, todo.repeatUnit, Number(event.target.value))
                  }
                />
                <select
                  className="select"
                  value={todo.repeatUnit ?? "week"}
                  onChange={(event) =>
                    setRepeat(todo.repeatMode, event.target.value as RepeatUnit, todo.repeatInterval)
                  }
                >
                  {UNITS.map((unit) => (
                    <option key={unit} value={unit}>
                      {REPEAT_UNIT_PLURAL[unit]}
                    </option>
                  ))}
                </select>
              </div>
              <p className="muted small" style={{ marginTop: 8 }}>
                {describeRepeat(todo.repeatMode, todo.repeatUnit, todo.repeatInterval)}
                {todo.repeatMode === "schedule"
                  ? ". Die nächste Aufgabe wird beim Abhaken automatisch angelegt."
                  : ". Der Rhythmus startet erst, wenn Sie abhaken."}
              </p>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
