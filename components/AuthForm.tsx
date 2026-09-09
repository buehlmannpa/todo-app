"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { IconCheck } from "./Icons";

interface Props {
  mode: "login" | "registrieren";
}

export default function AuthForm({ mode }: Props) {
  const router = useRouter();
  const params = useSearchParams();
  const target = params.get("weiter") || "/heute";

  const [identifier, setIdentifier] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setBusy(true);

    const url = mode === "login" ? "/api/auth/login" : "/api/auth/register";
    const body =
      mode === "login" ? { identifier, password } : { username, email, password };

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(data.error ?? "Es hat nicht geklappt.");
        setBusy(false);
        return;
      }
      router.push(target);
      router.refresh();
    } catch {
      setError("Die Verbindung ist fehlgeschlagen.");
      setBusy(false);
    }
  };

  return (
    <div className="auth">
      <div className="auth-card">
        <div className="auth-logo">
          <IconCheck size={26} />
        </div>
        <h1 className="auth-title">Klar</h1>
        <p className="auth-sub">
          {mode === "login"
            ? "Willkommen zurück. Bitte anmelden."
            : "Konto erstellen und loslegen."}
        </p>

        {error ? <div className="auth-error">{error}</div> : null}

        <form onSubmit={submit}>
          {mode === "login" ? (
            <div className="field">
              <label className="label" htmlFor="identifier">
                Benutzername oder E-Mail
              </label>
              <input
                id="identifier"
                className="input"
                autoComplete="username"
                autoCapitalize="none"
                required
                value={identifier}
                onChange={(event) => setIdentifier(event.target.value)}
              />
            </div>
          ) : (
            <>
              <div className="field">
                <label className="label" htmlFor="username">
                  Benutzername
                </label>
                <input
                  id="username"
                  className="input"
                  autoComplete="username"
                  autoCapitalize="none"
                  required
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                />
              </div>
              <div className="field">
                <label className="label" htmlFor="email">
                  E-Mail
                </label>
                <input
                  id="email"
                  className="input"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>
            </>
          )}

          <div className="field">
            <label className="label" htmlFor="password">
              Passwort
            </label>
            <input
              id="password"
              className="input"
              type="password"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              required
              minLength={mode === "login" ? undefined : 8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>

          <button type="submit" className="btn btn-primary btn-full" disabled={busy}>
            {busy ? "Einen Moment ..." : mode === "login" ? "Anmelden" : "Konto erstellen"}
          </button>
        </form>

        <p className="auth-foot">
          {mode === "login" ? (
            <>
              Noch kein Konto? <Link href="/registrieren">Jetzt registrieren</Link>
            </>
          ) : (
            <>
              Bereits registriert? <Link href="/login">Zur Anmeldung</Link>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
