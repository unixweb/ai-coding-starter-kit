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
