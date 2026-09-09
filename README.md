# Klar

Eine minimalistische Aufgabenverwaltung als Webapp, gebaut für den Alltag in der
Projektleitung. Wenige Ansichten, kurze Wege, und trotzdem alles dabei, was ein
Arbeitstag mit mehreren parallelen Projekten braucht.

Die Oberfläche orientiert sich am Liquid Glass Look von Apple: durchscheinende
Flächen, weiche Schatten, viel Weissraum und ein farbiger Hintergrund, der durch
die Karten hindurchschimmert. Hell und dunkel folgen automatisch dem System.

## Funktionen

**Drei Ansichten**

* **Heute** zeigt alles mit Stern sowie alles, was heute oder früher fällig ist,
  gruppiert nach Projekt und innerhalb des Projekts nach Dringlichkeit und
  Termin. Wahlweise als Liste oder als Timeline im Stil eines Tagesplans, mit
  Zeitachse, Blöcken und einer Linie für die aktuelle Uhrzeit.
* **Eingang** sammelt alles ohne Projekt. Neue Aufgaben landen automatisch hier.
* **Projekte** listet alle Projekte alphabetisch oder in eigener Reihenfolge,
  je mit Anzahl offener Aufgaben und einer Markierung, sobald ein Eintrag mit
  hoher Dringlichkeit enthalten ist.

**Aufgaben**

* Erfassen über den runden Knopf in der Navigation oder mit der Taste `n`.
* Vier Stufen der Dringlichkeit: keine, tief, mittel, hoch.
* Stern setzt eine Aufgabe auf die Ansicht Heute.
* Termin mit oder ohne Uhrzeit, dazu eine frei wählbare Erinnerung.
* Wiederholung in zwei Varianten:
  * **Fixer Rhythmus** täglich, wöchentlich, monatlich, jährlich oder alle X
    Einheiten. Der nächste Termin richtet sich nach dem bisherigen Termin.
  * **Nach dem Abhaken** alle X Tage, Wochen, Monate oder Jahre. Der Rhythmus
    startet erst beim Abhaken.
  Beim Abhaken wird die nächste Instanz automatisch angelegt, die erledigte
  bleibt im Archiv sichtbar.
* Vollbildansicht mit frei formatierbarem Text: fett, kursiv, unterstrichen,
  durchgestrichen, Titel, Aufzählungen, Zitate und Links im Text.
* Jede Aufgabe kann zusätzlich einen Link hinterlegen.
* Wischgesten in der Liste: nach rechts für Termin und Erinnerung, nach links
  für die Zuordnung zu einem Projekt.
* **Archiv** mit Volltextsuche über alle abgehakten Aufgaben der letzten
  180 Tage, gruppiert nach Tag.

**Mitteilungen**

Fällige Aufgaben melden sich per Push Mitteilung auf dem Handy und auf dem
Desktop, auch bei geschlossener App. Ein Cron Job auf Vercel prüft regelmässig,
was ansteht. Massgebend ist die Erinnerung, sonst der Termin. Ganztägige
Aufgaben melden sich am Morgen ihres Termins.

**Konto**

Registrierung mit Benutzername, E-Mail und Passwort. Die Anmeldung funktioniert
wahlweise mit Benutzername oder E-Mail. Passwörter werden mit bcrypt gehasht,
die Session liegt in einem signierten HTTP only Cookie.

## Technik

* Next.js 15 mit App Router und React 19
* TypeScript durchgehend
* Postgres, auf Vercel über Vercel Postgres beziehungsweise Neon
* Eigene Authentisierung mit bcrypt und JWT in einem HTTP only Cookie
* Web Push über VAPID, Service Worker als PWA
* Handgeschriebenes CSS, kein UI Framework

## Lokal starten

Voraussetzung ist Node 20 oder neuer sowie ein erreichbares Postgres.

```bash
npm install
cp .env.example .env.local
```

In `.env.local` eintragen:

```
DATABASE_URL="postgresql://benutzer:passwort@localhost:5432/klar"
AUTH_SECRET="$(openssl rand -base64 48)"
```

VAPID Schlüssel erzeugen und die drei ausgegebenen Zeilen in `.env.local`
übernehmen:

```bash
npm run vapid
```

Schema anlegen und Server starten:

```bash
npm run db:setup
npm run dev
```

Die App läuft danach auf `http://localhost:3000`. Gegen ein lokales Postgres
wird automatisch der Treiber `pg` verwendet, gegen Neon der schnellere HTTP
Treiber. Mit `DB_DRIVER=pg` oder `DB_DRIVER=neon` lässt sich das erzwingen.

## Auf Vercel deployen

1. Repository in Vercel importieren.
2. Unter **Storage** eine Postgres Datenbank anlegen. Vercel setzt
   `DATABASE_URL` automatisch.
3. Umgebungsvariablen ergänzen, für alle Umgebungen:
   * `AUTH_SECRET`, ein zufälliger Wert mit mindestens 32 Zeichen
   * `NEXT_PUBLIC_VAPID_PUBLIC_KEY` und `VAPID_PRIVATE_KEY` aus `npm run vapid`
   * `VAPID_SUBJECT`, zum Beispiel `mailto:ihre@adresse.ch`
4. Einmalig das Schema anlegen, lokal mit der Produktionsadresse:

   ```bash
   DATABASE_URL="<Adresse aus Vercel>" node scripts/setup-db.mjs
   ```

5. Deployen. Der Cron Job aus `vercel.json` prüft alle fünf Minuten, ob etwas
   fällig ist. Vercel setzt `CRON_SECRET` selber und schützt den Endpunkt damit.

Hinweis zum Tarif: im Hobby Tarif führt Vercel Cron Jobs nur einmal täglich aus.
Für Mitteilungen im Minutentakt braucht es den Pro Tarif. Alternativ lässt sich
`https://<domain>/api/cron/reminders` von einem beliebigen externen Dienst
aufrufen, dann muss der Aufruf den Kopf `Authorization: Bearer <CRON_SECRET>`
mitschicken.

## Als App aufs Handy

* **iPhone und iPad**: die Adresse in Safari öffnen, Teilen antippen und
  «Zum Home Bildschirm» wählen. Danach in den Einstellungen der App die
  Mitteilungen aktivieren. Push funktioniert auf iOS nur über diesen Weg.
* **Android**: im Chrome Menü «App installieren» wählen.
* **Desktop**: in der Adressleiste auf das Installationssymbol klicken.

Unter **Einstellungen** lässt sich pro Gerät prüfen, ob Mitteilungen aktiv sind,
und eine Testmitteilung auslösen.

## Aufbau des Codes

```
app/
  (app)/            Angemeldeter Bereich: Heute, Eingang, Projekte, Archiv, Einstellungen
  (auth)/           Anmeldung und Registrierung
  api/              Endpunkte für Aufgaben, Projekte, Konto, Push und Cron
  globals.css       Das gesamte Design System
components/         Oberfläche, unter anderem Liste, Detailansicht, Timeline, Blätter
lib/                Datenbank, Authentisierung, Wiederholungen, Formatierung
db/schema.sql       Tabellen und Indizes
public/sw.js        Service Worker für Push Mitteilungen
scripts/            Schema einrichten, VAPID Schlüssel, App Symbole
```
