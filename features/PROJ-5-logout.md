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
