"use client";

import { useEffect, useMemo, useState } from "react";
import { useStore } from "@/components/store";
import PageHeader from "@/components/PageHeader";
import TodoList from "@/components/TodoList";
import Timeline from "@/components/Timeline";
import { IconList, IconTimeline } from "@/components/Icons";
import { endOfDay, formatLongDate } from "@/lib/format";
import { PRIORITY_ORDER, type Todo } from "@/lib/types";

type View = "liste" | "timeline";

function byPriorityAndDate(a: Todo, b: Todo): number {
  const priority = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
  if (priority !== 0) return priority;
  if (a.dueAt && b.dueAt) return a.dueAt < b.dueAt ? -1 : 1;
  if (a.dueAt) return -1;
  if (b.dueAt) return 1;
  return a.createdAt < b.createdAt ? -1 : 1;
}

export default function HeutePage() {
  const { openTodos, projects } = useStore();
  const [view, setView] = useState<View>("liste");
  const today = new Date();

  useEffect(() => {
    const stored = window.localStorage.getItem("klar-heute-ansicht");
    if (stored === "timeline" || stored === "liste") setView(stored);
  }, []);

  const change = (next: View) => {
    setView(next);
    window.localStorage.setItem("klar-heute-ansicht", next);
  };

  /** In Heute erscheint alles mit Stern sowie alles, was heute oder früher fällig ist. */
  const relevant = useMemo(() => {
    const limit = endOfDay(today).getTime();
    return openTodos.filter(
      (todo) => todo.starred || (todo.dueAt !== null && new Date(todo.dueAt).getTime() <= limit),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openTodos]);

  const groups = useMemo(() => {
    const ordered = [...projects].sort((a, b) => a.name.localeCompare(b.name, "de-CH"));
    const result: { key: string; name: string; color: string; todos: Todo[] }[] = [];

    for (const project of ordered) {
      const todos = relevant.filter((todo) => todo.projectId === project.id).sort(byPriorityAndDate);
      if (todos.length > 0) {
        result.push({ key: project.id, name: project.name, color: project.color, todos });
      }
    }

    const loose = relevant.filter((todo) => !todo.projectId).sort(byPriorityAndDate);
    if (loose.length > 0) {
      result.push({ key: "eingang", name: "Ohne Projekt", color: "graphite", todos: loose });
    }
    return result;
  }, [projects, relevant]);

  const highCount = relevant.filter((todo) => todo.priority === "high").length;

  return (
    <>
      <PageHeader
        title="Heute"
        subtitle={formatLongDate(today)}
        actions={
          <div className="chips">
            <button
              type="button"
              className="chip"
              data-on={view === "liste"}
              aria-label="Liste"
              onClick={() => change("liste")}
            >
              <IconList size={15} />
            </button>
            <button
              type="button"
              className="chip"
              data-on={view === "timeline"}
              aria-label="Timeline"
              onClick={() => change("timeline")}
            >
              <IconTimeline size={15} />
            </button>
          </div>
        }
      />

      {relevant.length > 0 ? (
        <p className="page-sub" style={{ margin: "-8px 4px 16px" }}>
          {relevant.length} {relevant.length === 1 ? "Aufgabe" : "Aufgaben"}
          {highCount > 0 ? `, davon ${highCount} mit hoher Dringlichkeit` : ""}
        </p>
      ) : null}

      {view === "timeline" ? (
        <Timeline day={today} todos={relevant} />
      ) : groups.length === 0 ? (
        <TodoList
          todos={[]}
          emptyEmoji="🌤️"
          emptyText="Für heute ist nichts geplant. Markieren Sie Aufgaben mit einem Stern, damit sie hier erscheinen."
        />
      ) : (
        groups.map((group) => (
          <section className="section" key={group.key}>
            <div className="section-head">
              <span className="dot" style={{ background: `var(--p-${group.color})` }} />
              <span className="section-title">{group.name}</span>
              <span className="section-count">{group.todos.length}</span>
            </div>
            <TodoList todos={group.todos} showProject={false} />
          </section>
        ))
      )}
    </>
  );
}
