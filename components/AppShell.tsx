"use client";

import { useEffect, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useStore } from "./store";
import QuickAdd from "./QuickAdd";
import TodoDetail from "./TodoDetail";
import { IconArchive, IconInbox, IconPlus, IconProjects, IconToday } from "./Icons";
import { registerServiceWorker, syncExistingSubscription } from "@/lib/push-client";

const LINKS = [
  { href: "/heute", label: "Heute", icon: IconToday },
  { href: "/eingang", label: "Eingang", icon: IconInbox },
  { href: "/projekte", label: "Projekte", icon: IconProjects },
  { href: "/archiv", label: "Archiv", icon: IconArchive },
];

export default function AppShell({ children }: { children: ReactNode }) {
  const { openQuickAdd, toast, inboxTodos, detailId } = useStore();
  const pathname = usePathname();

  useEffect(() => {
    void registerServiceWorker();
    void syncExistingSubscription();
  }, []);

  // Schnelltaste: n legt eine neue Aufgabe an.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);
      if (typing || event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.key === "n") {
        event.preventDefault();
        openQuickAdd();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [openQuickAdd]);

  return (
    <div className="app">
      <main className="app-main">{children}</main>

      {detailId ? null : (
        <nav className="nav" aria-label="Hauptnavigation">
          {LINKS.slice(0, 2).map((link) => (
            <NavLink key={link.href} link={link} pathname={pathname} badge={
              link.href === "/eingang" ? inboxTodos.length : 0
            } />
          ))}

          <button
            type="button"
            className="nav-add"
            aria-label="Neue Aufgabe"
            onClick={() => openQuickAdd()}
          >
            <IconPlus size={20} />
          </button>

          {LINKS.slice(2).map((link) => (
            <NavLink key={link.href} link={link} pathname={pathname} badge={0} />
          ))}
        </nav>
      )}

      <QuickAdd />
      <TodoDetail />
      {toast ? <div className="toast">{toast}</div> : null}
    </div>
  );
}

function NavLink({
  link,
  pathname,
  badge,
}: {
  link: (typeof LINKS)[number];
  pathname: string;
  badge: number;
}) {
  const Icon = link.icon;
  const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
  return (
    <Link href={link.href} className="nav-item" data-active={active}>
      <Icon size={18} />
      <span className="nav-label">{link.label}</span>
      {badge > 0 ? <span className="nav-badge">{badge}</span> : null}
    </Link>
  );
}
