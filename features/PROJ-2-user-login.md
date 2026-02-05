# PROJ-2: User Login

## Status: Planned

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
