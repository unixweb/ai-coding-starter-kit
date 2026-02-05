# PROJ-1: User Registration

## Status: Planned

## Beschreibung
Neue User können sich mit Email und Passwort registrieren, um einen Account zu erstellen.

## Zielgruppe
Kleine Teams (2-10 Personen), Startup-Teams

## User Stories
- Als neuer User möchte ich mich mit Email und Passwort registrieren, um einen Account zu erstellen
- Als neuer User möchte ich meinen Namen angeben können, damit andere Teammitglieder mich erkennen
- Als neuer User möchte ich klare Fehlermeldungen sehen, wenn meine Eingaben ungültig sind
- Als neuer User möchte ich die Passwort-Anforderungen sehen, damit ich ein gültiges Passwort wählen kann
- Als neuer User möchte ich nach erfolgreicher Registrierung zum Dashboard weitergeleitet werden

## Acceptance Criteria
- [ ] Registrierungsformular enthält Felder: Name, Email, Passwort, Passwort bestätigen
- [ ] Passwort-Validierung: Min. 8 Zeichen + Groß/Kleinbuchstaben + mindestens 1 Zahl
- [ ] Passwort-Anforderungen werden dem User visuell angezeigt (z.B. Checkliste)
- [ ] Bei bereits registrierter Email wird Error Message angezeigt: "Email bereits verwendet"
- [ ] Email-Format wird clientseitig validiert
- [ ] Passwort und Passwort-Bestätigung müssen übereinstimmen
- [ ] Nach erfolgreicher Registrierung wird User-Account in der Datenbank erstellt
- [ ] Passwort wird gehasht gespeichert (niemals Klartext)
- [ ] Nach erfolgreicher Registrierung wird der User zum Dashboard weitergeleitet
- [ ] Formular zeigt Ladezustand während der Registrierung (Button disabled + Spinner)
- [ ] Link zum Login für bestehende User vorhanden ("Bereits registriert? Hier einloggen")

## Edge Cases
- Was passiert bei doppelter Email? -> Error Message "Email bereits verwendet"
- Was passiert bei schwachem Passwort? -> Validierungsfehler mit konkreten Hinweisen
- Was passiert bei Netzwerkfehler während Registrierung? -> Fehlermeldung + Retry möglich
- Was passiert bei SQL-Injection-Versuch in Email/Name? -> Input wird sanitized, Fehler angezeigt
- Was passiert wenn Passwort und Bestätigung nicht übereinstimmen? -> Validierungsfehler
- Was passiert bei sehr langem Namen/Email? -> Max-Length Validierung

## Abhängigkeiten
- Keine (Erstes Feature)

## Technische Anforderungen
- Performance: Registrierung < 2s Response Time
- Security: Passwort-Hashing, Input Sanitization, CSRF-Schutz
- Accessibility: Formular ist keyboard-navigierbar, Screen-Reader kompatibel
