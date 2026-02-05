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
