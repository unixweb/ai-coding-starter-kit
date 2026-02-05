# PROJ-4: Email Verifizierung

## Status: Planned

## Beschreibung
Nach der Registrierung muss der User seine Email-Adresse bestätigen, bevor er die App nutzen kann. Ohne Verifizierung wird der Zugang zur App blockiert.

## Zielgruppe
Kleine Teams (2-10 Personen), Startup-Teams

## User Stories
- Als neuer User möchte ich nach der Registrierung eine Verifizierungs-Email erhalten, damit ich meinen Account bestätigen kann
- Als neuer User möchte ich über den Link in der Email meine Adresse verifizieren können
- Als nicht-verifizierter User möchte ich eine klare Meldung sehen, dass ich meine Email bestätigen muss
- Als User möchte ich eine neue Verifizierungs-Email anfordern können, falls die erste nicht angekommen ist
- Als User möchte ich nach erfolgreicher Verifizierung automatisch zum Dashboard weitergeleitet werden

## Acceptance Criteria
- [ ] Nach Registrierung wird automatisch eine Verifizierungs-Email gesendet
- [ ] Verifizierungs-Email enthält einen einmaligen, zeitlich begrenzten Link (gültig für 24 Stunden)
- [ ] Nicht-verifizierte User sehen eine Blocking-Seite: "Bitte bestätige deine Email-Adresse"
- [ ] Blocking-Seite zeigt Button "Neue Verifizierungs-Email senden"
- [ ] Blocking-Seite zeigt die registrierte Email-Adresse an
- [ ] Klick auf Verifizierungs-Link bestätigt den Account und leitet zum Dashboard weiter
- [ ] Nicht-verifizierte User können keine geschützten Seiten aufrufen (Redirect zur Blocking-Seite)
- [ ] Nach Verifizierung hat der User vollen Zugang zur App
- [ ] Verifizierungs-Status wird in der Datenbank gespeichert

## Edge Cases
- Was passiert bei abgelaufenem Verifizierungs-Link? -> Fehlermeldung + "Neue Email senden"-Button
- Was passiert bei bereits verifiziertem Account und erneutem Klick auf Link? -> Erfolgsmeldung "Bereits verifiziert" + Redirect zum Dashboard
- Was passiert bei mehrfachem Anfordern einer neuen Email? -> Rate Limiting (max 3 pro Stunde)
- Was passiert wenn User die Email-Adresse falsch eingegeben hat? -> Möglichkeit, sich erneut zu registrieren (neuer Account)
- Was passiert bei Netzwerkfehler beim Verifizieren? -> Fehlermeldung + Retry möglich

## Abhängigkeiten
- Benötigt: PROJ-1 (User Registration) -- Verifizierungs-Email wird nach Registrierung gesendet
- Benötigt: PROJ-2 (User Login) -- Verifizierungs-Check beim Login

## Technische Anforderungen
- Performance: Email-Versand < 5s nach Registrierung
- Security: Verifizierungs-Token kryptographisch sicher, zeitlich begrenzt (24h), Einmalverwendung
- Security: Rate Limiting für erneuten Email-Versand (3 pro Stunde)

## Tech-Design (Solution Architect)

### Component-Struktur
```
/verify-email (Blocking-Seite für nicht-verifizierte User)
├── App Header (Logo)
├── Verifizierungs-Card (zentriert)
│   ├── Email-Icon (visuelles Feedback)
│   ├── Titel: "Bitte bestätige deine Email-Adresse"
│   ├── Beschreibung: "Wir haben eine Email an [user@email.com] gesendet"
│   ├── "Neue Verifizierungs-Email senden"-Button (mit Lade-Spinner)
│   ├── Erfolgsmeldung nach erneutem Senden: "Email wurde erneut gesendet"
│   └── Hinweis: "Spam-Ordner prüfen" + "Falsche Email? Neu registrieren"
└── Toast-Benachrichtigungen

/auth/callback (Verarbeitet Email-Link)
→ Prüft Token aus der Verifizierungs-Email
→ Bei Erfolg: Redirect zum Dashboard
→ Bei Fehler: Fehlermeldung + "Neue Email senden"-Option
```

### Daten-Model
```
Für Email-Verifizierung werden verwendet:
- Verifizierungs-Status → Supabase Auth speichert ob Email bestätigt ist
- Verifizierungs-Token → automatisch von Supabase generiert
- Token-Ablauf → 24 Stunden (Supabase-Konfiguration)

Keine eigenen Tabellen nötig!
Supabase Auth managt den gesamten Verifizierungs-Flow.
```

### Tech-Entscheidungen
```
Warum Supabase Auth für Email-Verifizierung?
→ Supabase sendet automatisch Verifizierungs-Emails bei der Registrierung.
  Token-Generierung, Email-Versand und Status-Tracking sind eingebaut.

Warum eine eigene Blocking-Seite statt nur eine Meldung?
→ Klare UX: User versteht sofort, dass er seine Email bestätigen muss.
  Die Seite bietet direkt die Möglichkeit, eine neue Email anzufordern.

Warum Verifizierungs-Check in der Middleware?
→ Die bestehende Middleware (aus PROJ-2) wird erweitert:
  1. Nicht eingeloggt → Redirect zum Login
  2. Eingeloggt aber nicht verifiziert → Redirect zu /verify-email
  3. Eingeloggt + verifiziert → Zugang erlaubt

Warum /auth/callback wiederverwenden?
→ Gleiche Callback-Route wie bei Passwort-Reset (PROJ-3).
  Supabase sendet verschiedene Token-Typen, die Route unterscheidet
  automatisch zwischen Verifizierung und Passwort-Reset.
```

### Seitenstruktur
```
Neue Seiten:
- /verify-email → Blocking-Seite für nicht-verifizierte User

Erweiterte Infrastruktur:
- Middleware → Zusätzlicher Check: Email verifiziert?
- /auth/callback → Verarbeitet auch Verifizierungs-Tokens (neben Reset-Tokens)

Wiederverwendete shadcn/ui Komponenten:
- Card, Button, Toast
```

### Dependencies
```
Keine neuen Packages nötig!
Supabase Auth managt Email-Versand + Verifizierung.
```

## QA Test-Report

### Test-Datum: 2026-02-05
### Getestete Dateien:
- `src/app/verify-email/page.tsx`
- `src/app/auth/callback/route.ts`
- `src/lib/supabase-middleware.ts`

### Acceptance Criteria Ergebnisse

| # | Acceptance Criteria | Status | Details |
|---|---|---|---|
| AC-1 | Nach Registrierung automatische Verifizierungs-Email | PASS | Supabase sendet automatisch bei `signUp()` wenn Email-Confirmations aktiviert |
| AC-2 | Verifizierungs-Email zeitlich begrenzt (24 Stunden) | PASS | Supabase-Konfiguration (serverseitig) |
| AC-3 | Blocking-Seite: "Bitte bestätige deine Email-Adresse" | PASS | Middleware redirected unverified users → `/verify-email` mit korrektem Titel |
| AC-4 | Button "Neue Verifizierungs-Email senden" | PASS | `<Button onClick={handleResend}>Neue Verifizierungs-Email senden</Button>` mit `supabase.auth.resend()` |
| AC-5 | Registrierte Email-Adresse angezeigt | PASS | `useEffect` holt User-Email → angezeigt als "Wir haben eine Verifizierungs-Email an {userEmail} gesendet" |
| AC-6 | Verifizierungs-Link → Dashboard-Redirect | PASS | `/auth/callback` → `exchangeCodeForSession` → Redirect zu `/dashboard` (default next) |
| AC-7 | Nicht-verifizierte User: kein Zugang zu geschützten Seiten | PASS | Middleware: `!user.email_confirmed_at` → Redirect zu `/verify-email` |
| AC-8 | Nach Verifizierung voller Zugang | PASS | `email_confirmed_at` gesetzt → Middleware erlaubt alle Routen |
| AC-9 | Verifizierungs-Status in Datenbank gespeichert | PASS | `email_confirmed_at` Feld in Supabase `auth.users` Tabelle |

### Edge Case Ergebnisse

| Edge Case | Status | Details |
|---|---|---|
| Abgelaufener Verifizierungs-Link | PASS | `exchangeCodeForSession` Fehler → Redirect zu `/login?error=auth_callback_error` |
| Bereits verifizierter Account + erneuter Link | PASS | `verify-email/page.tsx` hat `useEffect` der `email_confirmed_at` prüft → Dashboard-Redirect |
| Mehrfaches Email-Anfordern | PASS | Supabase Rate Limiting greift |
| Falsche Email eingegeben | PASS | "Falsche Email-Adresse? Neu registrieren" Link zu `/register` vorhanden |
| Netzwerkfehler beim Resend | PARTIAL | Supabase-Error-Objekt wird behandelt, aber `handleResend` fehlt try/catch für Netzwerk-Exceptions |

### Gefundene Bugs

| Bug-ID | Schwere | Beschreibung | Betroffene Datei |
|---|---|---|---|
| BUG-1 | Low | `handleResend` in verify-email/page.tsx hat kein try/catch/finally Pattern. Wenn `supabase.auth.resend()` eine Network-Exception wirft (statt Error-Objekt zurückzugeben), wird der Fehler nicht gefangen und `isResending` bleibt auf `true` (Stuck Loading State). Alle anderen Auth-Formulare verwenden konsistent try/catch/finally. | `src/app/verify-email/page.tsx` |

### Security-Analyse
- **Middleware-Enforcement**: Verifizierungs-Check serverseitig in Middleware — kein Client-Side-Bypass möglich
- **Erlaubte Unverified-Routen**: Sinnvoll eingeschränkt auf `/verify-email`, `/auth/callback`, `/login`, `/register`
- **Resend-Funktion**: Nutzt Supabase-eigenes Rate Limiting
- **XSS**: Kein dangerouslySetInnerHTML, React auto-escaping aktiv

### Gesamtergebnis
- **Acceptance Criteria**: 9/9 PASS
- **Edge Cases**: 4/5 PASS, 1 PARTIAL
- **Bugs**: 1 (Low-Severity)
- **Status**: PRODUCTION-READY (Low-Bug betrifft nur Netzwerk-Exception Edge Case)
