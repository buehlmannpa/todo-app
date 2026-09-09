"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/components/store";
import PageHeader from "@/components/PageHeader";
import TodoList from "@/components/TodoList";
import { IconSearch } from "@/components/Icons";
import { formatLongDate, isSameDay } from "@/lib/format";
import type { Todo } from "@/lib/types";

export default function ArchivPage() {
  const { doneTodos } = useStore();
  const [query, setQuery] = useState("");

  const groups = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const filtered = needle
      ? doneTodos.filter(
          (todo) =>
            todo.title.toLowerCase().includes(needle) ||
            todo.notes.replace(/<[^>]*>/g, " ").toLowerCase().includes(needle),
        )
      : doneTodos;

    const result: { label: string; todos: Todo[] }[] = [];
    for (const todo of filtered) {
      const day = new Date(todo.completedAt as string);
      const last = result[result.length - 1];
      if (last && isSameDay(new Date(last.todos[0].completedAt as string), day)) {
        last.todos.push(todo);
      } else {
        result.push({ label: formatLongDate(day), todos: [todo] });
      }
    }
    return result;
  }, [doneTodos, query]);

  return (
    <>
      <PageHeader
        title="Archiv"
        subtitle="Abgehakte Aufgaben der letzten 180 Tage"
      />

      <div className="link-box" style={{ marginBottom: 18 }}>
        <IconSearch size={16} />
        <input
          className="input"
          style={{ border: "none", background: "none", padding: 0 }}
          placeholder="Im Archiv suchen"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>

      {groups.length === 0 ? (
        <div className="card">
          <div className="empty">
            <span className="empty-emoji">🗂️</span>
            {query ? "Nichts gefunden." : "Noch nichts abgehakt."}
          </div>
        </div>
      ) : (
        groups.map((group) => (
          <section className="section" key={group.label}>
            <div className="section-head">
              <span className="section-title">{group.label}</span>
              <span className="section-count">{group.todos.length}</span>
            </div>
            <TodoList todos={group.todos} />
          </section>
        ))
      )}
    </>
  );
}
