# PROJ-10: Passwortschutz fuer Mandanten-Upload-Portal

## Status: 🔵 Planned

## Beschreibung
Das oeffentliche Upload-Portal (/p/[token]) wird durch ein automatisch generiertes Passwort geschuetzt. Beim Erstellen eines Portal-Links wird ein 12-Zeichen-Passwort (Buchstaben + Zahlen) generiert und in der Datenbank gespeichert. Der Mandant erhaelt Link + Passwort in einer gemeinsamen E-Mail (via PROJ-9). Beim Oeffnen des Links muss der Mandant zuerst das Passwort eingeben, bevor er das Upload-Formular sieht. Nach 5 Fehlversuchen wird der Link gesperrt. Der Betreuer kann im Dashboard ein neues Passwort generieren.

## Zielgruppe
- **Primaer:** Externe Mandanten/Kunden - muessen Passwort eingeben vor Upload
- **Sekundaer:** Eingeloggte User (Mandanten-Betreuer) - sehen/regenerieren Passwort im Dashboard

## Abhaengigkeiten
- Benoetigt: PROJ-8 (Mandanten-Upload-Portal) - Portal-Links und /p/[token] muessen existieren
- Benoetigt: PROJ-9 (E-Mail-Versand mit Brevo) - Passwort wird per E-Mail versendet

## User Stories

### Mandant/Kunde (extern, kein Login)
- Als Mandant moechte ich beim Oeffnen des Upload-Links ein Passwort eingeben, damit meine Dokumente geschuetzt sind
- Als Mandant moechte ich eine klare Fehlermeldung sehen, wenn ich das falsche Passwort eingebe
- Als Mandant moechte ich informiert werden, wenn mein Zugang nach 5 Fehlversuchen gesperrt wurde
- Als Mandant moechte ich das Passwort aus der E-Mail kopieren und einfuegen koennen

### Mandanten-Betreuer (eingeloggt)
- Als eingeloggter User moechte ich, dass beim Erstellen eines Links automatisch ein sicheres Passwort generiert wird
- Als eingeloggter User moechte ich das Passwort im Dashboard sehen koennen, falls ein Mandant es erneut benoetigt
- Als eingeloggter User moechte ich ein neues Passwort generieren koennen, falls das alte kompromittiert wurde
- Als eingeloggter User moechte ich, dass bei Neugenerierung die Fehlversuche zurueckgesetzt werden (Entsperrung)
- Als eingeloggter User moechte ich, dass Link + Passwort gemeinsam in einer E-Mail versendet werden (via PROJ-9)

## Acceptance Criteria

### Passwort-Generierung
- [ ] Beim Erstellen eines Portal-Links wird automatisch ein 12-Zeichen-Passwort generiert
- [ ] Passwort besteht aus Buchstaben (Gross + Klein) und Zahlen (keine Sonderzeichen)
- [ ] Passwort wird als Hash (bcrypt oder SHA-256 mit Salt) in der Datenbank gespeichert
- [ ] Klartext-Passwort wird NICHT in der Datenbank gespeichert
- [ ] Klartext-Passwort wird einmalig im Erfolgs-Dialog nach Link-Erstellung angezeigt (kopierbar)

### Passwort-Eingabe (/p/[token])
- [ ] Beim Oeffnen von /p/[token] wird zuerst ein Passwort-Eingabe-Screen angezeigt (nicht das Upload-Formular)
- [ ] Passwort-Screen: SafeDocs-Branding, Titel "Passwort eingeben", Passwort-Feld, "Weiter"-Button
- [ ] Passwort-Feld: Input type=password, Paste erlaubt
- [ ] Nach korrektem Passwort: Upload-Formular wird angezeigt
- [ ] Bei falschem Passwort: Fehlermeldung "Falsches Passwort. Sie haben noch X Versuche."
- [ ] Verbleibende Versuche werden angezeigt (z.B. "Noch 3 Versuche")

### Sperrung nach 5 Fehlversuchen
- [ ] Fehlversuche werden pro Link in der Datenbank gezaehlt
- [ ] Nach 5 Fehlversuchen: Link wird automatisch gesperrt
- [ ] Gesperrter Link zeigt: "Dieser Zugang wurde aus Sicherheitsgruenden gesperrt. Bitte kontaktieren Sie Ihren Ansprechpartner."
- [ ] Kein weiterer Passwort-Versuch moeglich nach Sperrung
- [ ] Sperrung ist unabhaengig von Deaktivierung (eigener Status)

### Passwort im Dashboard
- [ ] In der Link-Detail-Ansicht oder Link-Tabelle: Passwort wird NICHT im Klartext angezeigt (es ist gehasht)
- [ ] Button "Neues Passwort generieren" pro Link
- [ ] Klick generiert ein neues 12-Zeichen-Passwort
- [ ] Neues Passwort wird einmalig im Dialog angezeigt (kopierbar)
- [ ] Altes Passwort-Hash wird ueberschrieben
- [ ] Fehlversuche-Zaehler wird auf 0 zurueckgesetzt (Entsperrung)
- [ ] Hinweis: "Das neue Passwort muss dem Mandanten erneut mitgeteilt werden"

### Integration mit PROJ-9 (E-Mail-Versand)
- [ ] "Zugangslink senden"-E-Mail enthaelt zusaetzlich das Passwort
- [ ] E-Mail-Text: "Ihr Passwort: [Passwort]" (gut sichtbar, kopierbar)
- [ ] Beim Versand wird ein NEUES Passwort generiert (damit der Betreuer das aktuelle Passwort kennt)
- [ ] Das neue Passwort wird in der E-Mail mitgesendet und in der DB aktualisiert
- [ ] Fehlversuche werden bei neuem Passwort zurueckgesetzt

### Passwort-Validierung (API)
- [ ] POST /api/portal/verify-password
- [ ] Auth: KEINE (oeffentlich, wie /api/portal/verify)
- [ ] Request-Body: { token: string, password: string }
- [ ] Prueft: Token gueltig, Link aktiv, nicht abgelaufen, nicht gesperrt
- [ ] Prueft: Passwort-Hash stimmt ueberein
- [ ] Bei Erfolg: Gibt Session-Token (JWT oder signierter Cookie) zurueck, der fuer den Upload benoetigt wird
- [ ] Bei Fehler: Inkrementiert Fehlversuche-Zaehler, gibt Fehlermeldung + verbleibende Versuche zurueck
- [ ] Bei 5. Fehlversuch: Sperrt den Link (setzt locked=true)
- [ ] Oeffentliche Route in Middleware registrieren

### Datenbank-Aenderungen
- [ ] Neue Spalten in portal_links:
  - password_hash TEXT NOT NULL (bcrypt-Hash des Passworts)
  - failed_attempts INTEGER NOT NULL DEFAULT 0
  - is_locked BOOLEAN NOT NULL DEFAULT false
- [ ] Neue Migration: supabase/migrations/003_add_portal_password.sql
- [ ] RLS-Policy fuer anonymen Zugriff auf password_hash, failed_attempts, is_locked anpassen

### Upload-Schutz
- [ ] POST /api/portal/submit prueft zusaetzlich: Session-Token aus Passwort-Validierung
- [ ] Ohne gueltigen Session-Token: Upload wird abgelehnt (401)
- [ ] Session-Token ist zeitlich begrenzt (z.B. 60 Minuten)

## Edge Cases
- Was passiert bei 5 Fehlversuchen? -> Link wird gesperrt, Meldung "Zugang gesperrt"
- Was passiert wenn gesperrter Link entsperrt werden soll? -> Betreuer generiert neues Passwort (setzt Zaehler zurueck + locked=false)
- Was passiert wenn Mandant Passwort vergessen hat? -> Betreuer generiert neues Passwort und sendet erneut per E-Mail
- Was passiert bei Brute-Force ueber verschiedene IPs? -> Fehlversuche sind pro Link (nicht pro IP), also trotzdem nach 5 Versuchen gesperrt
- Was passiert wenn Betreuer Passwort sehen will? -> Nicht moeglich (nur Hash gespeichert), aber neues generieren ist moeglich
- Was passiert bei bestehenden Links ohne Passwort (Migration)? -> Migration generiert Passwoerter fuer bestehende Links, oder: bestehende Links funktionieren weiterhin ohne Passwort (Uebergangsphase)
- Was passiert wenn Session-Token ablaeuft waehrend Upload? -> Upload schlaegt fehl, Mandant muss Passwort erneut eingeben
- Was passiert bei gleichzeitigen Passwort-Versuchen? -> Atomarer Zaehler-Inkrement (UPDATE ... SET failed_attempts = failed_attempts + 1)

## Technische Anforderungen
- Passwort: 12 Zeichen, [A-Za-z0-9], kryptographisch sicher generiert
- Passwort-Hash: bcrypt (oder alternativ SHA-256 + Salt via crypto)
- Session-Token: JWT oder HMAC-signierter Token mit Ablauf (60 Min)
- Neue DB-Spalten: password_hash, failed_attempts, is_locked
- Neue Migration: 003_add_portal_password.sql
- Neuer API-Endpoint: POST /api/portal/verify-password (oeffentlich)
- Anpassung: POST /api/portal/submit (Session-Token-Pruefung)
- Anpassung: PROJ-9 E-Mail-Template (Passwort einfuegen)
- npm-Package: bcryptjs (fuer Passwort-Hashing) oder Node.js crypto
- Middleware: /api/portal/verify-password als oeffentliche Route
