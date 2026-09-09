"use client";

import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { useStore } from "./store";
import { IconCalendar, IconCheck, IconClock, IconFolder, IconLink, IconRepeat, IconStar } from "./Icons";
import { formatDueLabel, isSameDay } from "@/lib/format";
import type { Priority, Todo } from "@/lib/types";

const PRIORITY_COLOR: Record<Priority, string | null> = {
  none: null,
  low: "var(--prio-low)",
  medium: "var(--prio-medium)",
  high: "var(--prio-high)",
};

const SWIPE_TRIGGER = 72;
const SWIPE_MAX = 118;

interface Props {
  todo: Todo;
  showProject?: boolean;
  onSwipeDate: (todo: Todo) => void;
  onSwipeProject: (todo: Todo) => void;
}

export default function TodoRow({ todo, showProject = true, onSwipeDate, onSwipeProject }: Props) {
  const { projectById, setCompleted, updateTodo, openDetail } = useStore();
  const [offset, setOffset] = useState(0);
  const [animating, setAnimating] = useState(false);
  const start = useRef<{ x: number; y: number } | null>(null);
  const dragging = useRef(false);

  const project = projectById(todo.projectId);
  const done = Boolean(todo.completedAt);
  const priorityColor = PRIORITY_COLOR[todo.priority];

  const due = todo.dueAt ? new Date(todo.dueAt) : null;
  let dueTone: "overdue" | "today" | "normal" = "normal";
  if (due && !done) {
    if (isSameDay(due, new Date())) dueTone = "today";
    else if (due.getTime() < Date.now()) dueTone = "overdue";
  }

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    start.current = { x: event.clientX, y: event.clientY };
    dragging.current = false;
    setAnimating(false);
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!start.current) return;
    const dx = event.clientX - start.current.x;
    const dy = event.clientY - start.current.y;

    if (!dragging.current) {
      if (Math.abs(dx) < 12 || Math.abs(dx) < Math.abs(dy) * 1.4) return;
      dragging.current = true;
      event.currentTarget.setPointerCapture(event.pointerId);
    }

    setOffset(Math.max(-SWIPE_MAX, Math.min(SWIPE_MAX, dx)));
  };

  const finish = () => {
    const value = offset;
    start.current = null;
    setAnimating(true);
    setOffset(0);

    if (!dragging.current) return;
    dragging.current = false;

    if (value >= SWIPE_TRIGGER) onSwipeDate(todo);
    else if (value <= -SWIPE_TRIGGER) onSwipeProject(todo);
  };

  const onClick = () => {
    if (dragging.current) return;
    openDetail(todo.id);
  };

  const hasNotes = todo.notes.replace(/<[^>]*>/g, "").trim().length > 0;

  return (
    <div
      className="todo-wrap"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={finish}
      onPointerCancel={finish}
    >
      <div
        className="swipe-hint"
        style={{
          background:
            offset > 0
              ? "linear-gradient(90deg, var(--accent), transparent 60%)"
              : offset < 0
                ? "linear-gradient(270deg, var(--p-purple), transparent 60%)"
                : "transparent",
        }}
      >
        <span style={{ opacity: offset > 24 ? 1 : 0 }}>
          <IconCalendar size={15} /> Datum
        </span>
        <span style={{ opacity: offset < -24 ? 1 : 0 }}>
          <IconFolder size={15} /> Projekt
        </span>
      </div>

      <div
        className="todo"
        style={{
          transform: `translateX(${offset}px)`,
          transition: animating ? "transform 0.22s cubic-bezier(0.32,0.72,0,1)" : "none",
          background: offset !== 0 ? "var(--glass-strong)" : undefined,
        }}
      >
        {priorityColor && !done ? (
          <span className="prio-bar" style={{ background: priorityColor }} />
        ) : null}

        <button
          type="button"
          className="todo-check"
          data-done={done}
          data-prio={todo.priority}
          aria-label={done ? "Wieder öffnen" : "Erledigt"}
          onClick={(event) => {
            event.stopPropagation();
            void setCompleted(todo.id, !done);
          }}
        >
          {done ? <IconCheck size={13} /> : null}
        </button>

        <button type="button" className="todo-body" onClick={onClick}>
          <div className="todo-title" data-done={done}>
            {todo.title}
          </div>
          <div className="todo-meta">
            {showProject && project ? (
              <span className="meta-chip">
                <span className="dot" style={{ background: `var(--p-${project.color})` }} />
                {project.name}
              </span>
            ) : null}
            {due ? (
              <span className="meta-chip" data-tone={dueTone}>
                <IconCalendar size={13} />
                {formatDueLabel(todo.dueAt as string, todo.dueAllDay)}
              </span>
            ) : null}
            {todo.remindAt ? (
              <span className="meta-chip">
                <IconClock size={13} />
              </span>
            ) : null}
            {todo.repeatMode ? (
              <span className="meta-chip">
                <IconRepeat size={13} />
              </span>
            ) : null}
            {todo.link ? (
              <span className="meta-chip">
                <IconLink size={13} />
              </span>
            ) : null}
            {hasNotes ? <span className="meta-chip">Notiz</span> : null}
          </div>
        </button>

        <button
          type="button"
          className="todo-star"
          data-on={todo.starred}
          aria-label={todo.starred ? "Stern entfernen" : "In Heute anzeigen"}
          onClick={(event) => {
            event.stopPropagation();
            void updateTodo(todo.id, { starred: !todo.starred });
          }}
        >
          <IconStar size={17} filled={todo.starred} />
        </button>
      </div>
    </div>
  );
}
