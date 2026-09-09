"use client";

import { useEffect, useRef, useState } from "react";
import Sheet from "./Sheet";
import { useStore } from "./store";
import { IconCalendar, IconFlag, IconStar } from "./Icons";
import { addDays, startOfDay, toDateInputValue } from "@/lib/format";
import { PRIORITY_LABEL, type Priority } from "@/lib/types";

const PRIORITIES: Priority[] = ["none", "low", "medium", "high"];

export default function QuickAdd() {
  const { quickAdd, closeQuickAdd, createTodo, projects, notify } = useStore();
  const [title, setTitle] = useState("");
  const [projectId, setProjectId] = useState<string | null>(null);
  const [priority, setPriority] = useState<Priority>("none");
  const [starred, setStarred] = useState(false);
  const [dueDate, setDueDate] = useState("");
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!quickAdd.open) return;
    setTitle("");
    setPriority("none");
    setStarred(false);
    setProjectId(quickAdd.projectId);
    setDueDate(quickAdd.dueAt ? toDateInputValue(new Date(quickAdd.dueAt)) : "");
    const timer = setTimeout(() => inputRef.current?.focus(), 60);
    return () => clearTimeout(timer);
  }, [quickAdd]);

  if (!quickAdd.open) return null;

  const submit = async () => {
    const trimmed = title.trim();
    if (!trimmed || saving) return;
    setSaving(true);

    const dueAt = quickAdd.dueAt
      ? quickAdd.dueAt
      : dueDate
        ? new Date(`${dueDate}T00:00:00`).toISOString()
        : null;

    const todo = await createTodo({
      title: trimmed,
      projectId,
      priority,
      starred,
      dueAt,
      dueAllDay: quickAdd.dueAt ? false : true,
    });
    setSaving(false);
    if (todo) {
      notify(projectId ? "Aufgabe im Projekt angelegt" : "Aufgabe im Eingang angelegt");
      closeQuickAdd();
    }
  };

  const quick = (days: number | null) =>
    setDueDate(days === null ? "" : toDateInputValue(addDays(startOfDay(new Date()), days)));

  return (
    <Sheet title="Neue Aufgabe" onClose={closeQuickAdd}>
      <input
        ref={inputRef}
        className="input"
        placeholder="Was ist zu tun?"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") void submit();
        }}
        style={{ fontSize: 17, fontWeight: 550, marginBottom: 16 }}
      />

      <div className="detail-label">Projekt</div>
      <div className="chips" style={{ marginBottom: 16 }}>
        <button
          type="button"
          className="chip"
          data-on={projectId === null}
          onClick={() => setProjectId(null)}
        >
          Eingang
        </button>
        {projects.map((project) => (
          <button
            key={project.id}
            type="button"
            className="chip"
            data-on={projectId === project.id}
            onClick={() => setProjectId(project.id)}
          >
            <span className="dot" style={{ background: `var(--p-${project.color})` }} />
            {project.name}
          </button>
        ))}
      </div>

      <div className="detail-label">
        <IconFlag size={12} style={{ verticalAlign: "-2px", marginRight: 4 }} />
        Dringlichkeit
      </div>
      <div className="chips" style={{ marginBottom: 16 }}>
        {PRIORITIES.map((value) => (
          <button
            key={value}
            type="button"
            className="chip"
            data-on={priority === value}
            data-tone={value}
            onClick={() => setPriority(value)}
          >
            {PRIORITY_LABEL[value]}
          </button>
        ))}
      </div>

      {quickAdd.dueAt ? null : (
        <>
          <div className="detail-label">
            <IconCalendar size={12} style={{ verticalAlign: "-2px", marginRight: 4 }} />
            Fällig
          </div>
          <div className="chips" style={{ marginBottom: 16 }}>
            <button
              type="button"
              className="chip"
              data-on={dueDate === toDateInputValue(new Date())}
              onClick={() => quick(0)}
            >
              Heute
            </button>
            <button
              type="button"
              className="chip"
              data-on={dueDate === toDateInputValue(addDays(new Date(), 1))}
              onClick={() => quick(1)}
            >
              Morgen
            </button>
            <button type="button" className="chip" data-on={dueDate === ""} onClick={() => quick(null)}>
              Ohne Datum
            </button>
          </div>
        </>
      )}

      <button
        type="button"
        className="chip"
        data-on={starred}
        onClick={() => setStarred((value) => !value)}
        style={{ marginBottom: 18 }}
      >
        <IconStar size={14} filled={starred} /> In Heute anzeigen
      </button>

      <div className="row">
        <button type="button" className="btn btn-ghost" onClick={closeQuickAdd}>
          Abbrechen
        </button>
        <button
          type="button"
          className="btn btn-primary"
          disabled={!title.trim() || saving}
          onClick={() => void submit()}
        >
          Hinzufügen
        </button>
      </div>
    </Sheet>
  );
}
