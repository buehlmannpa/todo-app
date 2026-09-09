"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/components/store";
import PageHeader from "@/components/PageHeader";
import { IconBell, IconCheck, IconLogout } from "@/components/Icons";
import { disablePush, enablePush, pushSupported } from "@/lib/push-client";

export default function EinstellungenPage() {
  const { user, notify, todos, projects } = useStore();
  const router = useRouter();
  const [permission, setPermission] = useState<NotificationPermission | "nicht-verfügbar">(
    "default",
  );
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!pushSupported()) {
      setPermission("nicht-verfügbar");
      return;
    }
    setPermission(Notification.permission);
  }, []);

  const activate = async () => {
    setBusy(true);
    const result = await enablePush();
    setBusy(false);
    notify(result.message);
    if (pushSupported()) setPermission(Notification.permission);
  };

  const deactivate = async () => {
    setBusy(true);
    await disablePush();
    setBusy(false);
    notify("Mitteilungen auf diesem Gerät deaktiviert.");
  };

  const test = async () => {
    setBusy(true);
    const response = await fetch("/api/push/test", { method: "POST" });
    const data = (await response.json()) as { delivered?: number; error?: string };
    setBusy(false);
    notify(
      data.error
        ? data.error
        : data.delivered
          ? `Testmitteilung an ${data.delivered} Gerät(e) gesendet.`
          : "Kein aktives Gerät gefunden. Bitte Mitteilungen zuerst aktivieren.",
    );
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  const open = todos.filter((todo) => !todo.completedAt).length;
  const done = todos.length - open;

  return (
    <>
      <PageHeader title="Einstellungen" subtitle={`Angemeldet als ${user.username}`} />

      <section className="section">
        <div className="section-head">
          <span className="section-title">Konto</span>
        </div>
        <div className="card" style={{ padding: 16 }}>
          <div className="spread" style={{ marginBottom: 8 }}>
            <span className="muted small">Benutzername</span>
            <strong>{user.username}</strong>
          </div>
          <div className="spread" style={{ marginBottom: 8 }}>
            <span className="muted small">E-Mail</span>
            <strong>{user.email}</strong>
          </div>
          <div className="spread" style={{ marginBottom: 8 }}>
            <span className="muted small">Projekte</span>
            <strong>{projects.length}</strong>
          </div>
          <div className="spread">
            <span className="muted small">Aufgaben offen und erledigt</span>
            <strong>
              {open} / {done}
            </strong>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <span className="section-title">Mitteilungen</span>
        </div>
        <div className="card" style={{ padding: 16 }}>
          {permission === "nicht-verfügbar" ? (
            <p className="muted small" style={{ marginTop: 0 }}>
              Dieser Browser unterstützt keine Push Mitteilungen. Auf dem iPhone öffnen Sie die
              App über Safari und legen sie über Teilen mit «Zum Home Bildschirm» ab. Danach sind
              Mitteilungen verfügbar.
            </p>
          ) : (
            <>
              <p className="muted small" style={{ marginTop: 0 }}>
                Status:{" "}
                <strong>
                  {permission === "granted"
                    ? "aktiv"
                    : permission === "denied"
                      ? "im Browser blockiert"
                      : "noch nicht aktiviert"}
                </strong>
              </p>
              <div className="chips" style={{ marginTop: 12 }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={busy || permission === "denied"}
                  onClick={() => void activate()}
                >
                  <IconBell size={15} /> Auf diesem Gerät aktivieren
                </button>
                <button type="button" className="btn btn-ghost" disabled={busy} onClick={() => void test()}>
                  <IconCheck size={15} /> Test senden
                </button>
                <button type="button" className="btn btn-ghost" disabled={busy} onClick={() => void deactivate()}>
                  Deaktivieren
                </button>
              </div>
              {permission === "denied" ? (
                <p className="muted small" style={{ marginBottom: 0 }}>
                  Die Berechtigung wurde im Browser blockiert. Bitte in den Website Einstellungen
                  des Browsers wieder erlauben.
                </p>
              ) : null}
            </>
          )}
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <span className="section-title">Als App installieren</span>
        </div>
        <div className="card" style={{ padding: 16 }}>
          <p className="muted small" style={{ margin: 0 }}>
            iPhone und iPad: in Safari öffnen, Teilen antippen und «Zum Home Bildschirm» wählen.
            Android: im Chrome Menü «App installieren» wählen. Desktop: in der Adressleiste auf das
            Installationssymbol klicken. So laufen Mitteilungen auch bei geschlossener App.
          </p>
        </div>
      </section>

      <button type="button" className="btn btn-ghost btn-full" onClick={() => void logout()}>
        <IconLogout size={16} /> Abmelden
      </button>
    </>
  );
}
