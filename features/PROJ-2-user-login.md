# PROJ-2: User Login

## Status: Deploy-Ready (QA PRODUCTION-READY)

## Beschreibung
Registrierte User können sich mit Email und Passwort einloggen. Die Session bleibt nach Browser-Reload automatisch erhalten.

## Zielgruppe
Kleine Teams (2-10 Personen), Startup-Teams

## User Stories
- Als registrierter User möchte ich mich mit Email und Passwort einloggen, um auf mein Dashboard zuzugreifen
- Als eingeloggter User möchte ich nach einem Browser-Reload eingeloggt bleiben, damit ich nicht ständig meine Credentials eingeben muss
- Als User möchte ich bei falschen Login-Daten eine klare Fehlermeldung sehen
- Als User möchte ich einen Link zur Registrierung sehen, falls ich noch keinen Account habe
- Als User möchte ich einen Link zum Passwort-Reset sehen, falls ich mein Passwort vergessen habe

## Acceptance Criteria
- [ ] Login-Formular enthält Felder: Email, Passwort
- [ ] Bei korrekten Credentials wird der User eingeloggt und zum Dashboard weitergeleitet
- [ ] Bei falschen Credentials wird eine generische Fehlermeldung angezeigt ("Email oder Passwort falsch") -- keine Hinweise ob Email existiert
- [ ] Session bleibt nach Browser-Reload/Tab-Schließen erhalten (automatisch)
- [ ] Formular zeigt Ladezustand während des Logins (Button disabled + Spinner)
- [ ] Link zur Registrierung vorhanden ("Noch kein Account? Hier registrieren")
- [ ] Link zum Passwort-Reset vorhanden ("Passwort vergessen?")
- [ ] Geschützte Seiten (z.B. Dashboard) leiten nicht-eingeloggte User zum Login weiter
- [ ] Nach Login-Redirect wird der User zum Dashboard weitergeleitet

## Edge Cases
- Was passiert bei falscher Email? -> Generische Fehlermeldung (kein Hinweis ob Email existiert)
- Was passiert bei falschem Passwort? -> Generische Fehlermeldung
- Was passiert bei Netzwerkfehler? -> Fehlermeldung + Retry möglich
- Was passiert wenn User bereits eingeloggt ist und Login-Seite aufruft? -> Redirect zum Dashboard
- Was passiert wenn Session abläuft? -> Redirect zum Login mit Hinweis
- Was passiert bei Brute-Force-Versuchen? -> Rate Limiting (Standard: 5 Versuche pro Minute)

## Abhängigkeiten
- Benötigt: PROJ-1 (User Registration) -- für existierende User-Accounts

## Technische Anforderungen
- Performance: Login < 1s Response Time
- Security: Rate Limiting (5 Versuche/Minute), generische Fehlermeldungen, Session-Token sicher speichern
- Accessibility: Formular ist keyboard-navigierbar, Screen-Reader kompatibel

## Tech-Design (Solution Architect)

### Component-Struktur
```
/login (Login-Seite)
├── App Header (Logo + Link zur Registrierung)
├── Login-Card (zentriert)
│   ├── Titel: "Willkommen zurück"
│   ├── Login-Formular
│   │   ├── Email-Feld (Eingabe)
│   │   ├── Passwort-Feld (Eingabe mit Sichtbarkeits-Toggle)
│   │   ├── "Passwort vergessen?"-Link → /reset-password
│   │   ├── Fehlermeldung (generisch, bei falschen Credentials)
│   │   └── "Einloggen"-Button (mit Lade-Spinner)
│   └── Footer-Link: "Noch kein Account? Hier registrieren" → /register
└── Toast-Benachrichtigungen (Fehler)

/dashboard (Geschützte Seite)
├── Header mit Navigation
│   ├── Logo
│   ├── Navigation-Links
│   └── User-Bereich (Name + Logout-Button)
└── Dashboard-Inhalt (Platzhalter für zukünftige Features)
```

### Daten-Model
```
Für Login werden verwendet:
- Email + Passwort → Supabase Auth prüft Credentials
- Session-Token → automatisch von Supabase verwaltet
- Session bleibt im Browser gespeichert (Supabase nutzt localStorage)

Keine neuen Tabellen nötig!
Supabase Auth managt Sessions automatisch.
```

### Tech-Entscheidungen
```
Warum Supabase Auth für Session-Management?
→ Sessions werden automatisch im Browser gespeichert und bei jedem
  Request mitgesendet. Kein manueller Token-Refresh nötig.

Warum Next.js Middleware für geschützte Seiten?
→ Middleware prüft bei jedem Seitenaufruf, ob ein gültiger
  Session-Token existiert. Nicht-eingeloggte User werden automatisch
  zum Login weitergeleitet. Zentral an einer Stelle konfiguriert.

Warum generische Fehlermeldung bei Login?
→ Sicherheit: "Email oder Passwort falsch" verrät nicht, ob die
  Email existiert. Schützt vor Account-Enumeration-Angriffen.

Warum Rate Limiting über Supabase?
→ Supabase hat eingebautes Rate Limiting für Auth-Endpoints.
  Kein eigener Code nötig.
```

### Seitenstruktur
```
Neue Seiten:
- /login → Login-Formular
- /dashboard → Geschützte Hauptseite (Platzhalter)

Neue Komponenten:
- AuthProvider → Stellt Auth-Status für die ganze App bereit
- ProtectedRoute → Leitet nicht-eingeloggte User zum Login um

Neue Infrastruktur:
- Middleware → Prüft Auth-Status bei geschützten Routen
- Supabase Client (aktiviert) → Browser + Server Client

Wiederverwendete shadcn/ui Komponenten:
- Card, Input, Button, Form, Label, Toast
```

### Dependencies
```
Keine neuen Packages nötig!
Alles bereits vorhanden:
- @supabase/supabase-js (Auth + Session)
- react-hook-form + zod (Formulare + Validierung)
- shadcn/ui Komponenten (UI)
```

## QA Test-Report

### Test-Datum: 2026-02-05
### Getestete Dateien:
- `src/app/login/page.tsx`
- `src/app/dashboard/page.tsx`
- `src/lib/supabase-middleware.ts`
- `src/middleware.ts`

### Acceptance Criteria Ergebnisse

| # | Acceptance Criteria | Status | Details |
|---|---|---|---|
| AC-1 | Login-Formular enthält Felder: Email, Passwort | PASS | Input-Felder mit type="email" und type="password" vorhanden |
| AC-2 | Bei korrekten Credentials → Dashboard-Redirect | PASS | `signInWithPassword` + `window.location.href = '/dashboard'` |
| AC-3 | Bei falschen Credentials → generische Fehlermeldung | PASS | "Email oder Passwort falsch" — keine Email-Existenz-Hinweise |
| AC-4 | Session bleibt nach Browser-Reload erhalten | PASS | Cookie-basierte Session via `@supabase/ssr` + Middleware Token-Refresh |
| AC-5 | Ladezustand während Login (Button disabled + Spinner) | PASS | `disabled={isLoading}` + `Loader2` Spinner |
| AC-6 | Link zur Registrierung vorhanden | PASS | "Noch kein Account? Hier registrieren" → `/register` |
| AC-7 | Link zum Passwort-Reset vorhanden | PASS | "Passwort vergessen?" → `/reset-password` |
| AC-8 | Geschützte Seiten leiten zum Login weiter | PASS | Middleware + Server-Side `redirect('/login')` in Dashboard |
| AC-9 | Nach Login-Redirect zum Dashboard | PASS | `window.location.href = '/dashboard'` |

### Edge Case Ergebnisse

| Edge Case | Status | Details |
|---|---|---|
| Falsche Email | PASS | Generische Fehlermeldung via Supabase Auth Error |
| Falsches Passwort | PASS | Gleiche generische Fehlermeldung |
| Netzwerkfehler | PASS | try/catch mit "Verbindungsfehler..." Meldung, finally setzt Loading zurück |
| Bereits eingeloggt + Login-Seite | PASS | Middleware leitet verifizierte User zu `/dashboard` weiter |
| Session abläuft | MINOR | Redirect zu `/login` funktioniert, aber kein "Session abgelaufen"-Hinweis (Spec sagt "mit Hinweis") |
| Brute-Force-Versuche | PASS | Supabase Built-in Rate Limiting |

### Gefundene Bugs

| Bug-ID | Schwere | Beschreibung | Betroffene Datei |
|---|---|---|---|
| BUG-1 | Low | Kein "Session abgelaufen"-Hinweis bei Redirect zum Login nach Session-Ablauf. Middleware leitet still zu `/login` weiter ohne URL-Parameter oder Meldung. | `src/lib/supabase-middleware.ts` |

### Security-Analyse
- **Email-Enumeration**: Geschützt durch generische Fehlermeldung
- **XSS**: Kein dangerouslySetInnerHTML, React auto-escaping aktiv
- **Password-Toggle**: Vorhanden mit aria-labels für Accessibility
- **Session-Management**: Cookie-basiert via `@supabase/ssr`, Token-Refresh in Middleware

### Gesamtergebnis
- **Acceptance Criteria**: 9/9 PASS
- **Edge Cases**: 5/6 PASS, 1 MINOR
- **Bugs**: 1 (Low-Severity)
- **Status**: PRODUCTION-READY (Low-Bug ist kosmetisch, keine Funktionseinschränkung)
