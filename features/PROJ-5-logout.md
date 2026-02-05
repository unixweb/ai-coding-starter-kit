# PROJ-5: Logout

## Status: Planned

## Beschreibung
Eingeloggte User können sich über einen Button im Header/Navigation ausloggen. Die Session wird dabei vollständig beendet.

## Zielgruppe
Kleine Teams (2-10 Personen), Startup-Teams

## User Stories
- Als eingeloggter User möchte ich einen Logout-Button im Header sehen, damit ich mich jederzeit abmelden kann
- Als User möchte ich nach dem Logout zur Login-Seite weitergeleitet werden
- Als User möchte ich sicher sein, dass nach dem Logout meine Session vollständig beendet ist
- Als User möchte ich nach dem Logout nicht mehr auf geschützte Seiten zugreifen können

## Acceptance Criteria
- [ ] Logout-Button ist im Header/Navigation sichtbar für eingeloggte User
- [ ] Klick auf Logout beendet die Session serverseitig
- [ ] Nach Logout wird der User zur Login-Seite weitergeleitet
- [ ] Nach Logout sind geschützte Seiten nicht mehr zugänglich (Redirect zum Login)
- [ ] Session-Token/Cookies werden beim Logout gelöscht
- [ ] Logout-Button ist nur für eingeloggte User sichtbar
- [ ] Browser-Zurück-Button nach Logout zeigt keine geschützten Inhalte (Cache invalidiert)

## Edge Cases
- Was passiert bei Netzwerkfehler während Logout? -> Lokale Session wird trotzdem gelöscht, User wird zum Login weitergeleitet
- Was passiert wenn User auf mehreren Tabs eingeloggt ist? -> Alle Tabs werden ausgeloggt (Session serverseitig beendet)
- Was passiert wenn Session bereits abgelaufen ist und User auf Logout klickt? -> Redirect zum Login ohne Fehler

## Abhängigkeiten
- Benötigt: PROJ-1 (User Registration) -- für existierende User-Accounts
- Benötigt: PROJ-2 (User Login) -- für aktive Sessions

## Technische Anforderungen
- Performance: Logout < 1s
- Security: Session wird serverseitig vollständig invalidiert
- UX: Kein Bestätigungs-Dialog nötig (1-Click Logout)

## Tech-Design (Solution Architect)

### Component-Struktur
```
Header/Navigation (auf allen geschützten Seiten)
├── Logo (Link zum Dashboard)
├── Navigation-Links
└── User-Bereich (rechts)
    ├── User-Name angezeigt
    └── "Abmelden"-Button (Logout)

Logout-Ablauf:
1. User klickt "Abmelden"
2. Session wird bei Supabase beendet
3. Lokale Tokens/Cookies werden gelöscht
4. Redirect zur Login-Seite
```

### Daten-Model
```
Für Logout werden verwendet:
- Session-Token → wird bei Supabase invalidiert
- Lokaler Speicher → wird gelöscht (Cookies + localStorage)

Keine Tabellen-Änderungen nötig!
```

### Tech-Entscheidungen
```
Warum Logout-Button im Header statt in einem Dropdown?
→ Direkter Zugang, immer sichtbar. Einfacher für MVP.
  Kann später in ein User-Dropdown-Menü verschoben werden.

Warum serverseitiges Session-Invalidieren?
→ Nur lokale Tokens löschen reicht nicht. Der Server muss die
  Session als ungültig markieren, damit andere Tabs und Geräte
  ebenfalls ausgeloggt werden.

Warum kein Bestätigungs-Dialog?
→ Logout ist eine risikoarme Aktion. 1-Click ist schneller
  und weniger nervig für den User.

Warum lokale Session auch bei Netzwerkfehler löschen?
→ User erwartet nach Klick auf "Abmelden" ausgeloggt zu sein.
  Auch wenn der Server nicht erreichbar ist, wird der User
  lokal ausgeloggt und zum Login weitergeleitet.
```

### Seitenstruktur
```
Keine neuen Seiten nötig!

Neue/erweiterte Komponenten:
- Header-Komponente → Enthält Navigation + User-Bereich + Logout-Button
  (wird auf allen geschützten Seiten angezeigt, z.B. Dashboard aus PROJ-2)

Wiederverwendete shadcn/ui Komponenten:
- Button, Separator
```

### Dependencies
```
Keine neuen Packages nötig!
Supabase Auth hat eine eingebaute signOut()-Funktion.
```

## QA Test-Report

### Test-Datum: 2026-02-05
### Getestete Dateien:
- `src/components/app-header.tsx`
- `src/app/dashboard/page.tsx`
- `src/lib/supabase-middleware.ts`

### Acceptance Criteria Ergebnisse

| # | Acceptance Criteria | Status | Details |
|---|---|---|---|
| AC-1 | Logout-Button im Header sichtbar | PASS | `<Button variant="ghost">... Abmelden</Button>` mit `LogOut`-Icon in AppHeader |
| AC-2 | Klick beendet Session serverseitig | PASS | `supabase.auth.signOut()` ruft Supabase-Server auf zur Session-Invalidierung |
| AC-3 | Redirect zur Login-Seite nach Logout | PASS | `window.location.href = '/login'` — wird auch bei Fehler ausgeführt |
| AC-4 | Geschützte Seiten nicht mehr zugänglich | PASS | Middleware: `!user` → Redirect zu `/login` + Dashboard Server-Side Check |
| AC-5 | Session-Token/Cookies gelöscht | PASS | `signOut()` löscht Cookies + localStorage, Hard-Navigation erzwingt Neuladen |
| AC-6 | Logout-Button nur für eingeloggte User sichtbar | PASS | AppHeader wird nur auf geschützten Seiten (Dashboard) gerendert, unauth Users werden vorher redirected |
| AC-7 | Browser-Zurück-Button zeigt keine geschützten Inhalte | PASS | Hard-Navigation (`window.location.href`) statt Client-Side Router; Dashboard ist Server Component mit Auth-Check |

### Edge Case Ergebnisse

| Edge Case | Status | Details |
|---|---|---|
| Netzwerkfehler während Logout | PASS | try/catch fängt Fehler ab (empty catch = intentional), Redirect erfolgt trotzdem |
| Mehrere Tabs eingeloggt | PASS | `signOut()` invalidiert Session serverseitig → andere Tabs verlieren Auth beim nächsten Request |
| Session bereits abgelaufen + Logout | PASS | `signOut()` kann fehlschlagen (gefangen), Redirect zu `/login` erfolgt trotzdem |

### Gefundene Bugs

Keine Bugs gefunden.

### Security-Analyse
- **Serverseitige Invalidierung**: `signOut()` revoked Session bei Supabase — nicht nur lokal
- **Error-Resilient**: Logout funktioniert auch bei Netzwerkfehler (lokale Bereinigung + Redirect)
- **Hard-Navigation**: Verhindert Client-Side-Cache-Probleme nach Logout
- **1-Click Logout**: Kein Bestätigungs-Dialog (wie spezifiziert), schnelle UX

### Gesamtergebnis
- **Acceptance Criteria**: 7/7 PASS
- **Edge Cases**: 3/3 PASS
- **Bugs**: 0
- **Status**: PRODUCTION-READY
