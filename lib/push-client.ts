"use client";

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const normalized = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(normalized);
  const output = new Uint8Array(raw.length);
  for (let index = 0; index < raw.length; index += 1) output[index] = raw.charCodeAt(index);
  return output;
}

export function pushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!pushSupported()) return null;
  try {
    return await navigator.serviceWorker.register("/sw.js", { scope: "/" });
  } catch (error) {
    console.error("Service Worker konnte nicht registriert werden", error);
    return null;
  }
}

/**
 * Fragt die Berechtigung an, legt das Push Abo an und speichert es im Backend.
 * Gibt eine Meldung für die Oberfläche zurück.
 */
export async function enablePush(): Promise<{ ok: boolean; message: string }> {
  if (!pushSupported()) {
    return {
      ok: false,
      message:
        "Dieser Browser unterstützt keine Mitteilungen. Auf dem iPhone die App zuerst zum Home Bildschirm hinzufügen.",
    };
  }

  const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!key) {
    return { ok: false, message: "Der VAPID Schlüssel fehlt in der Umgebung." };
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    return { ok: false, message: "Die Berechtigung für Mitteilungen wurde nicht erteilt." };
  }

  const registration = (await registerServiceWorker()) ?? (await navigator.serviceWorker.ready);
  if (!registration) {
    return { ok: false, message: "Der Service Worker konnte nicht gestartet werden." };
  }
  await navigator.serviceWorker.ready;

  const existing = await registration.pushManager.getSubscription();
  const subscription =
    existing ??
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(key) as BufferSource,
    }));

  const payload = subscription.toJSON();
  const response = await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      endpoint: subscription.endpoint,
      keys: payload.keys,
      userAgent: navigator.userAgent,
    }),
  });

  if (!response.ok) {
    return { ok: false, message: "Das Abo konnte nicht gespeichert werden." };
  }
  return { ok: true, message: "Mitteilungen sind aktiv." };
}

export async function disablePush(): Promise<void> {
  if (!pushSupported()) return;
  const registration = await navigator.serviceWorker.getRegistration();
  const subscription = await registration?.pushManager.getSubscription();
  if (!subscription) return;
  await fetch("/api/push/subscribe", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ endpoint: subscription.endpoint }),
  });
  await subscription.unsubscribe();
}

/** Stellt beim Start sicher, dass ein erteiltes Abo im Backend bekannt ist. */
export async function syncExistingSubscription(): Promise<void> {
  if (!pushSupported()) return;
  if (Notification.permission !== "granted") return;
  await enablePush().catch(() => undefined);
}
