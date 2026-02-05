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
- [ ] Nach erfolgreicher Registrierung wird der User zur Email-Verifizierung weitergeleitet (/verify-email)
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

## Tech-Design (Solution Architect)

### Component-Struktur
```
/register (Registrierungs-Seite)
├── App Header (Logo + Link zum Login)
├── Registrierungs-Card (zentriert)
│   ├── Titel: "Account erstellen"
│   ├── Registrierungs-Formular
│   │   ├── Name-Feld (Eingabe)
│   │   ├── Email-Feld (Eingabe)
│   │   ├── Passwort-Feld (Eingabe mit Sichtbarkeits-Toggle)
│   │   ├── Passwort-Anforderungen (Checkliste, live-aktualisiert)
│   │   │   ├── ✓/✗ Mindestens 8 Zeichen
│   │   │   ├── ✓/✗ Groß- und Kleinbuchstaben
│   │   │   └── ✓/✗ Mindestens eine Zahl
│   │   ├── Passwort bestätigen-Feld (Eingabe)
│   │   ├── Fehlermeldungen (inline, pro Feld)
│   │   └── "Registrieren"-Button (mit Lade-Spinner)
│   └── Footer-Link: "Bereits registriert? Hier einloggen" → /login
└── Toast-Benachrichtigungen (Erfolg/Fehler)
```

### Daten-Model
```
Jeder User hat:
- Eindeutige ID (automatisch von Supabase vergeben)
- Name (max 100 Zeichen)
- Email (eindeutig, max 255 Zeichen)
- Passwort (gehasht von Supabase, nie als Klartext)
- Email-Verifizierungs-Status (ja/nein)
- Erstellungszeitpunkt

Gespeichert in: Supabase Authentication (eingebaute User-Verwaltung)
Zusätzliche User-Daten (Name): Supabase "profiles" Tabelle
```

### Tech-Entscheidungen
```
Warum Supabase Auth statt eigene Lösung?
→ Supabase SDK ist bereits installiert. Passwort-Hashing, Session-Management
  und Email-Versand sind eingebaut. Sicherer als Eigenentwicklung.

Warum react-hook-form + zod für Formulare?
→ Beide bereits installiert. react-hook-form für performante Formulare,
  zod für Validierungsregeln (Passwort-Stärke, Email-Format).

Warum shadcn/ui Card + Form + Input?
→ Bereits vorhanden. Einheitliches Design, Accessibility eingebaut,
  Formular-Fehler werden automatisch angezeigt.

Warum eine eigene "profiles" Tabelle?
→ Supabase Auth speichert nur Email + Passwort. Der Name und weitere
  User-Daten kommen in eine separate "profiles" Tabelle.
```

### Seitenstruktur
```
Neue Seiten:
- /register → Registrierungs-Formular

Neue Komponenten:
- PasswordStrengthIndicator → Zeigt live Passwort-Anforderungen als Checkliste

Wiederverwendete shadcn/ui Komponenten:
- Card, Input, Button, Form, Label, Toast
```

### Dependencies
```
Keine neuen Packages nötig!
Alles bereits vorhanden:
- @supabase/supabase-js (Backend + Auth)
- react-hook-form (Formulare)
- zod (Validierung)
- shadcn/ui Komponenten (UI)
- sonner (Toast-Benachrichtigungen)
```

---

## QA Test Results

**Tested:** 2026-02-05
**Methode:** Code-Review gegen Acceptance Criteria, Security-Analyse, Responsive-Check
**Getestete Dateien:** `src/app/register/page.tsx`, `src/components/password-strength-indicator.tsx`, `src/lib/supabase-middleware.ts`, `src/middleware.ts`, `supabase/migrations/001_create_profiles.sql`

## Acceptance Criteria Status

### AC-1: Registrierungsformular enthält Felder: Name, Email, Passwort, Passwort bestätigen
- [x] Name-Feld vorhanden (type="text", autoComplete="name")
- [x] Email-Feld vorhanden (type="email", autoComplete="email")
- [x] Passwort-Feld vorhanden (type="password", autoComplete="new-password")
- [x] Passwort bestätigen-Feld vorhanden (type="password", autoComplete="new-password")

### AC-2: Passwort-Validierung: Min. 8 Zeichen + Gross/Kleinbuchstaben + Zahl
- [x] Zod-Schema mit `refine(validatePassword)` validiert alle 3 Regeln
- [x] `validatePassword` prueft: length >= 8, /[a-z]/ + /[A-Z]/, /\d/

### AC-3: Passwort-Anforderungen werden visuell angezeigt (Checkliste)
- [x] PasswordStrengthIndicator zeigt 3 Regeln als Live-Checkliste
- [x] Gruene Checks/Rote X Icons mit Farbwechsel

### AC-4: Bei bereits registrierter Email Error Message "Email bereits verwendet"
- [x] Code prueft `authError.message.includes('already registered')`
- [ ] BUG-1: Supabase gibt bei aktivierter Email-Confirmation nicht immer "already registered" zurueck. Bei manchen Konfigurationen wird ein "fake" User-Objekt zurueckgegeben (user ohne Session), statt einem Error. Die Pruefung greift dann nicht.

### AC-5: Email-Format wird clientseitig validiert
- [x] Zod `.email()` validiert Email-Format client-seitig
- [x] Input type="email" bietet zusaetzliche Browser-Validierung

### AC-6: Passwort und Passwort-Bestaetigung muessen uebereinstimmen
- [x] Zod `.refine()` vergleicht password === confirmPassword
- [x] Fehlermeldung: "Passwoerter stimmen nicht ueberein"

### AC-7: Nach Registrierung wird User-Account in Datenbank erstellt
- [x] `supabase.auth.signUp()` erstellt User in auth.users
- [x] Trigger `handle_new_user` erstellt automatisch profiles-Eintrag

### AC-8: Passwort wird gehasht gespeichert
- [x] Supabase Auth hasht Passwoerter automatisch (bcrypt)
- [x] Kein Klartext-Passwort im Frontend-Code gespeichert

### AC-9: Nach Registrierung Redirect zum Dashboard
- [ ] BUG-2: Redirect geht zu `/verify-email`, nicht `/dashboard`. Die Spec sagt "Dashboard", aber PROJ-4 (Email Verifizierung) verlangt Blocking vor Login. Das ist ein Widerspruch in der Spec -- technisch korrekt implementiert (verify-email ist der richtige Flow), aber die Spec muesste angepasst werden.

### AC-10: Ladezustand waehrend Registrierung (Button disabled + Spinner)
- [x] `isLoading` State disabled den Button
- [x] Loader2 Spinner-Icon wird bei isLoading angezeigt

### AC-11: Link zum Login vorhanden
- [x] "Bereits registriert? Hier einloggen" Link zu /login vorhanden

## Edge Cases Status

### EC-1: Doppelte Email
- [x] Error-Handling vorhanden fuer `already registered`
- [ ] Siehe BUG-1: Nicht in allen Supabase-Konfigurationen zuverlaessig

### EC-2: Schwaches Passwort
- [x] PasswordStrengthIndicator zeigt konkrete fehlende Anforderungen
- [x] Zod-Validierung verhindert Submit bei schwachem Passwort

### EC-3: Netzwerkfehler waehrend Registrierung
- [x] catch-Block zeigt `authError.message` an
- [ ] BUG-3: Kein expliziter try/catch um den gesamten `onSubmit`. Bei Netzwerk-Ausfall (kein Supabase erreichbar) wird ein unhandled Promise Rejection geworfen, der Loading-State bleibt haengen.

### EC-4: SQL-Injection in Email/Name
- [x] Supabase SDK verwendet parametrisierte Queries (kein SQL-Injection moeglich)
- [x] Zod validiert Eingaben vor dem Senden

### EC-5: Passwort und Bestaetigung stimmen nicht ueberein
- [x] Zod-Validierung mit klarer Fehlermeldung

### EC-6: Sehr langer Name/Email
- [x] Name: max 100 Zeichen (Zod)
- [x] Email: max 255 Zeichen (Zod)
- [ ] BUG-4: Kein `maxLength` Attribut auf den HTML-Input-Feldern. User kann ueber die max-Laenge tippen, bekommt den Fehler erst bei Submit. Besser waere ein visueller Stopp direkt beim Tippen.

## Bugs Found

### BUG-1: Doppelte Email wird nicht zuverlaessig erkannt
- **Severity:** High
- **Datei:** `src/app/register/page.tsx:60-62`
- **Beschreibung:** Bei aktivierter Email-Confirmation gibt Supabase bei bereits registrierter Email nicht immer einen Error zurueck. Stattdessen wird ein User-Objekt ohne Session zurueckgegeben (signUp "succeeds" mit `user` aber ohne `session`). Die Pruefung `authError.message.includes('already registered')` greift dann nicht.
- **Steps to Reproduce:**
  1. Supabase: Email Confirmations aktivieren
  2. Registriere User mit test@example.com
  3. Registriere erneut mit test@example.com
  4. Expected: Error "Email bereits verwendet"
  5. Actual: Redirect zu /verify-email (kein Error sichtbar)
- **Fix-Vorschlag:** Zusaetzlich pruefen ob `authData.user` existiert aber `authData.user.identities` leer ist (Supabase-Indikator fuer bereits existierende Email).
- **Priority:** High

### BUG-2: Redirect nach Registrierung geht zu /verify-email statt /dashboard
- **Severity:** Low (Spec-Widerspruch)
- **Datei:** `src/app/register/page.tsx:68`
- **Beschreibung:** AC-9 sagt "Redirect zum Dashboard", aber PROJ-4 (Email Verifizierung) verlangt Blocking. Der Redirect zu /verify-email ist technisch korrekt. Die Feature Spec PROJ-1 sollte angepasst werden: "Nach erfolgreicher Registrierung wird der User zur Email-Verifizierung weitergeleitet".
- **Priority:** Low (Spec-Update, kein Code-Fix noetig)

### BUG-3: Kein try/catch fuer Netzwerkfehler
- **Severity:** Medium
- **Datei:** `src/app/register/page.tsx:44-70`
- **Beschreibung:** Die `onSubmit` Funktion hat keinen try/catch Block. Wenn Supabase nicht erreichbar ist (DNS-Fehler, Server down), wird ein unhandled Promise Rejection geworfen. Der Button bleibt im Loading-State haengen und der User sieht keine Fehlermeldung.
- **Steps to Reproduce:**
  1. Setze NEXT_PUBLIC_SUPABASE_URL auf einen ungueltigen Wert
  2. Versuche zu registrieren
  3. Expected: Fehlermeldung + Button reset
  4. Actual: Button bleibt bei "Wird geladen..." haengen
- **Fix-Vorschlag:** Gesamten API-Call in try/catch wrappen mit finally { setIsLoading(false) }
- **Priority:** Medium

### BUG-4: Kein maxLength auf HTML-Input-Feldern
- **Severity:** Low
- **Datei:** `src/app/register/page.tsx:91,101`
- **Beschreibung:** Name und Email Inputs haben kein `maxLength` HTML-Attribut. Zod validiert zwar beim Submit, aber der User kann beliebig lange Strings tippen und bekommt den Fehler erst beim Absenden.
- **Fix-Vorschlag:** `maxLength={100}` auf Name-Input, `maxLength={255}` auf Email-Input
- **Priority:** Low (UX-Verbesserung)

### BUG-5: Passwort-Sichtbarkeits-Toggle fehlt
- **Severity:** Low
- **Datei:** `src/app/register/page.tsx:120-128`
- **Beschreibung:** Laut Tech-Design (Solution Architect) sollte ein Sichtbarkeits-Toggle (Auge-Icon) am Passwort-Feld sein. Dieser wurde nicht implementiert. Beide Passwort-Felder sind immer type="password" ohne Toggle-Option.
- **Priority:** Low (UX, gemaess Tech-Design vorgesehen)

## Security Analysis (Red Team)

### SEC-1: SQL-Injection
- [x] **Kein Risiko.** Supabase SDK nutzt parametrisierte Queries. Kein direktes SQL im Frontend.

### SEC-2: XSS (Cross-Site Scripting)
- [x] **Kein Risiko.** React escaped automatisch alle Ausgaben. Kein `dangerouslySetInnerHTML` verwendet.

### SEC-3: CSRF (Cross-Site Request Forgery)
- [x] **Geringes Risiko.** Supabase Auth nutzt token-basierte Authentifizierung (kein session cookie CSRF-Vektor). Next.js Middleware refresht Tokens.

### SEC-4: Passwort-Speicherung
- [x] **Sicher.** Supabase Auth hasht mit bcrypt. Kein Klartext.

### SEC-5: Rate Limiting bei Registrierung
- [ ] **Kein eigenes Rate Limiting implementiert.** Supabase hat eingebautes Rate Limiting fuer Auth-Endpoints, aber kein zusaetzliches Limit im Frontend/Middleware. Bei sehr aggressiven Angriffen koennten Supabase API-Quotas erreicht werden.
- **Severity:** Medium (abhaengig von Supabase-Plan-Limits)

### SEC-6: Email Enumeration
- [ ] **Teilweise verwundbar.** Bei doppelter Registrierung zeigt die App "Email bereits verwendet" (AC-4). Dies erlaubt Angreifern zu pruefen, ob eine Email registriert ist. Ein sichererer Ansatz waere eine generische Meldung.
- **Severity:** Low (bewusste Design-Entscheidung aus der Spec, aber Risiko dokumentiert)

### SEC-7: User Metadata Injection
- [x] **Geringes Risiko.** Der Name wird als `raw_user_meta_data` gespeichert. Zod validiert max. 100 Zeichen. Supabase sanitized die Daten.

## Responsive Design

- [x] `max-w-md` Card zentriert sich auf Desktop
- [x] `px-4 py-12` Padding fuer Mobile
- [x] `w-full` Inputs fuellem die volle Breite
- [x] `min-h-screen` mit `flex items-center justify-center` fuer vertikale Zentrierung
- [x] Keine hardcoded Pixel-Werte, responsive-sicher

## Regression Test

- [x] Landing Page `/` funktioniert weiterhin (keine Aenderungen)
- [x] Build laeuft erfolgreich durch (keine TypeScript-Fehler)
- [x] Keine bestehenden Features betroffen (erstes Feature)

## Summary
- 9/11 Acceptance Criteria passed
- 5 Bugs found (1 High, 1 Medium, 3 Low)
- 1 Security Issue dokumentiert (Email Enumeration -- bewusste Spec-Entscheidung)
- Feature ist **NICHT production-ready** (BUG-1 High, BUG-3 Medium muessen gefixt werden)

## Recommendation
**Fix vor Deployment (MUSS):**
1. BUG-1 (High): Doppelte Email zuverlaessig erkennen (identities-Check)
2. BUG-3 (Medium): try/catch fuer Netzwerkfehler

**Fix empfohlen (SOLLTE):**
3. BUG-4 (Low): maxLength auf Input-Feldern
4. BUG-5 (Low): Passwort-Sichtbarkeits-Toggle

**Spec-Update:**
5. BUG-2 (Low): AC-9 anpassen -- Redirect zu /verify-email ist korrekt
