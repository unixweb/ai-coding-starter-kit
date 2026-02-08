# PROJ-10: Passwortschutz fuer Mandanten-Upload-Portal

## Status: Tech-Design Reviewed

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
- Als eingeloggter User moechte ich das Klartext-Passwort einmalig nach der Erstellung sehen und kopieren koennen
- Als eingeloggter User moechte ich ein neues Passwort generieren koennen, falls das alte kompromittiert wurde
- Als eingeloggter User moechte ich, dass bei Neugenerierung die Fehlversuche zurueckgesetzt werden (Entsperrung)
- Als eingeloggter User moechte ich, dass Link + Passwort gemeinsam in einer E-Mail versendet werden (via PROJ-9)

## Acceptance Criteria

### Passwort-Generierung
- [ ] Beim Erstellen eines Portal-Links wird automatisch ein 12-Zeichen-Passwort generiert
- [ ] Passwort besteht aus Buchstaben (Gross + Klein) und Zahlen (keine Sonderzeichen)
- [ ] Passwort wird kryptographisch sicher generiert (crypto.randomBytes)
- [ ] Passwort wird als Hash (crypto.scrypt mit Salt) in der Datenbank gespeichert
- [ ] Klartext-Passwort wird NICHT in der Datenbank gespeichert
- [ ] Klartext-Passwort wird einmalig im API-Response nach Link-Erstellung zurueckgegeben
- [ ] Klartext-Passwort wird im Erfolgs-Dialog nach Link-Erstellung angezeigt (kopierbar)

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
- [ ] In der Link-Detail-Ansicht (/dashboard/portal/[linkId]): Button "Neues Passwort generieren"
- [ ] Passwort wird NICHT im Klartext angezeigt (es ist gehasht)
- [ ] Klick auf "Neues Passwort generieren" generiert ein neues 12-Zeichen-Passwort
- [ ] Neues Passwort wird einmalig im Dialog angezeigt (kopierbar)
- [ ] Altes Passwort-Hash wird ueberschrieben
- [ ] Fehlversuche-Zaehler wird auf 0 zurueckgesetzt (Entsperrung)
- [ ] is_locked wird auf false gesetzt
- [ ] Hinweis: "Das neue Passwort muss dem Mandanten erneut mitgeteilt werden"
- [ ] In der Link-Tabelle (/dashboard/portal): Status-Badge "Gesperrt" (orange/gelb) bei is_locked=true

### Integration mit PROJ-9 (E-Mail-Versand)
- [ ] "Zugangslink senden"-E-Mail enthaelt zusaetzlich das Passwort
- [ ] E-Mail-Text: "Ihr Passwort: [Passwort]" (gut sichtbar, kopierbar) - bereits vorbereitet in src/lib/email.ts
- [ ] Beim Versand ueber "Zugangslink senden" wird ein NEUES Passwort generiert
- [ ] Das neue Passwort wird in der E-Mail mitgesendet und in der DB aktualisiert (Hash)
- [ ] Fehlversuche werden bei neuem Passwort zurueckgesetzt
- [ ] is_locked wird auf false gesetzt

### Passwort-Validierung (API)
- [ ] POST /api/portal/verify-password (neuer Endpoint)
- [ ] Auth: KEINE (oeffentlich, wie /api/portal/verify)
- [ ] Request-Body: { token: string, password: string }
- [ ] Prueft: Token gueltig, Link aktiv, nicht abgelaufen, nicht gesperrt (is_locked)
- [ ] Prueft: Passwort-Hash stimmt ueberein (crypto.scrypt Vergleich)
- [ ] Bei Erfolg: Gibt Session-Token (HMAC-signiert via crypto.createHmac) zurueck
- [ ] Session-Token enthaelt: link_id, Ablaufzeit (60 Minuten)
- [ ] Bei Fehler: Inkrementiert Fehlversuche-Zaehler (atomar via Security-Definer-Funktion), gibt Fehlermeldung + verbleibende Versuche zurueck
- [ ] Bei 5. Fehlversuch: Sperrt den Link (setzt is_locked=true via Security-Definer-Funktion)
- [ ] Oeffentliche Route in Middleware registrieren

### Passwort-Regenerierung (API)
- [ ] POST /api/portal/regenerate-password (neuer Endpoint)
- [ ] Auth: Eingeloggt + verifiziert
- [ ] Request-Body: { linkId: string }
- [ ] Prueft: Link gehoert dem eingeloggten User
- [ ] Generiert neues 12-Zeichen-Passwort
- [ ] Speichert neuen Hash in DB
- [ ] Setzt failed_attempts auf 0
- [ ] Setzt is_locked auf false
- [ ] Gibt Klartext-Passwort einmalig im Response zurueck

### Datenbank-Aenderungen
- [ ] Neue Spalten in portal_links:
  - password_hash TEXT (NULLABLE fuer Uebergangsphase bestehender Links)
  - password_salt TEXT (NULLABLE, Salt fuer crypto.scrypt)
  - failed_attempts INTEGER NOT NULL DEFAULT 0
  - is_locked BOOLEAN NOT NULL DEFAULT false
- [ ] Neue Migration: supabase/migrations/003_add_portal_password.sql
- [ ] Security-Definer-Funktion: verify_portal_password(lookup_token TEXT)
  - Gibt zurueck: id, password_hash, password_salt, failed_attempts, is_locked, is_active, expires_at
  - Nur exakter Token-Lookup (wie verify_portal_token)
- [ ] Security-Definer-Funktion: increment_failed_attempts(link_uuid UUID)
  - Atomarer Inkrement von failed_attempts
  - Setzt is_locked=true wenn failed_attempts >= 5
  - Gibt neue Werte zurueck (failed_attempts, is_locked)
- [ ] Bestehende verify_portal_token-Funktion: um is_locked erweitern (damit gesperrte Links im Verify-Schritt erkannt werden)
- [ ] Keine neue RLS-Policy noetig (alle anonymen DB-Zugriffe laufen ueber Security-Definer-Funktionen)

### Upload-Schutz
- [ ] POST /api/portal/submit prueft zusaetzlich: Session-Token aus Passwort-Validierung
- [ ] Session-Token wird als Custom-Header mitgesendet: X-Portal-Session
- [ ] Ohne gueltigen Session-Token: Upload wird abgelehnt (401)
- [ ] Session-Token ist zeitlich begrenzt (60 Minuten)
- [ ] Session-Token wird mit HMAC (crypto.createHmac, SHA-256) signiert
- [ ] Signing-Secret: Neue ENV-Variable PORTAL_SESSION_SECRET (oder Fallback auf SUPABASE_SERVICE_ROLE_KEY)
- [ ] Bestehende Links ohne password_hash (Uebergangsphase): Upload weiterhin ohne Session-Token erlaubt

### Anpassung bestehender Endpunkte
- [ ] POST /api/portal/links: Passwort generieren, Hash+Salt speichern, Klartext im Response
- [ ] GET /api/portal/verify: Prueft zusaetzlich is_locked (gesperrte Links = ungueltig)
- [ ] POST /api/portal/submit: Session-Token-Pruefung (wenn password_hash vorhanden)
- [ ] POST /api/portal/send-email: Neues Passwort generieren, Hash in DB aktualisieren, Passwort in E-Mail einfuegen

## Edge Cases
- Was passiert bei 5 Fehlversuchen? -> Link wird gesperrt, Meldung "Zugang gesperrt"
- Was passiert wenn gesperrter Link entsperrt werden soll? -> Betreuer generiert neues Passwort (setzt Zaehler zurueck + is_locked=false)
- Was passiert wenn Mandant Passwort vergessen hat? -> Betreuer generiert neues Passwort und sendet erneut per E-Mail
- Was passiert bei Brute-Force ueber verschiedene IPs? -> Fehlversuche sind pro Link (nicht pro IP), also trotzdem nach 5 Versuchen gesperrt
- Was passiert wenn Betreuer Passwort sehen will? -> Nicht moeglich (nur Hash gespeichert), aber neues generieren ist moeglich
- Was passiert bei bestehenden Links ohne Passwort (Migration)? -> password_hash ist NULLABLE. Links ohne Passwort funktionieren weiterhin ohne Passwort-Eingabe (Uebergangsphase). Upload-Endpoint laesst Session-Token-Pruefung aus wenn kein password_hash vorhanden. Verify-Endpoint gibt zusaetzlich `passwordRequired: true/false` zurueck.
- Was passiert wenn Session-Token ablaeuft waehrend Upload? -> Upload schlaegt fehl (401), Mandant muss Passwort erneut eingeben
- Was passiert bei gleichzeitigen Passwort-Versuchen? -> Atomarer Zaehler-Inkrement via Security-Definer-Funktion (UPDATE ... SET failed_attempts = failed_attempts + 1)
- Was passiert wenn PORTAL_SESSION_SECRET nicht gesetzt ist? -> Fallback auf SUPABASE_SERVICE_ROLE_KEY als Signing-Secret
- Was passiert wenn ein gesperrter Link per E-Mail versendet wird? -> send-email generiert neues Passwort, setzt is_locked=false und failed_attempts=0, dann erst Versand
- Was passiert wenn submit mit FormData gesendet wird und X-Portal-Session als Header? -> FormData-Requests unterstuetzen Custom-Headers via fetch API problemlos (kein CORS-Problem, da Same-Origin)
- Was passiert bei Passwort-Eingabe fuer einen Link ohne Passwort (Altlink)? -> Verify-Endpoint gibt passwordRequired=false zurueck, Frontend springt direkt zu "form"-State, Passwort-Screen wird uebersprungen

## Technische Anforderungen
- Passwort: 12 Zeichen, [A-Za-z0-9], kryptographisch sicher generiert (crypto.randomBytes)
- Passwort-Hash: Node.js crypto.scrypt (64 Byte Output, 16 Byte Random Salt)
- Session-Token: HMAC-SHA256 signiert via crypto.createHmac, Payload: link_id + Ablauf-Timestamp
- Signing-Secret: ENV PORTAL_SESSION_SECRET (Fallback: SUPABASE_SERVICE_ROLE_KEY)
- Neue DB-Spalten: password_hash (TEXT, NULLABLE), password_salt (TEXT, NULLABLE), failed_attempts (INT, DEFAULT 0), is_locked (BOOL, DEFAULT false)
- Neue Migration: 003_add_portal_password.sql (HINWEIS: Keine SQL-Migrationen im Repo vorhanden; Migrationen werden direkt in Supabase Dashboard/CLI ausgefuehrt)
- Neue Security-Definer-Funktionen: verify_portal_password(), increment_failed_attempts()
- Erweiterte Security-Definer-Funktion: verify_portal_token() (um is_locked + has_password)
- Neuer API-Endpoint: POST /api/portal/verify-password (oeffentlich)
- Neuer API-Endpoint: POST /api/portal/regenerate-password (geschuetzt)
- Anpassung: POST /api/portal/links (Passwort-Generierung)
- Anpassung: GET /api/portal/verify (is_locked Pruefung, passwordRequired Flag)
- Anpassung: POST /api/portal/submit (Session-Token-Pruefung)
- Anpassung: POST /api/portal/send-email (Passwort-Generierung + E-Mail-Erweiterung)
- Anpassung: /p/[token] Frontend (Passwort-Screen + Session-Token-Handling)
- Anpassung: /dashboard/portal Frontend (Gesperrt-Badge)
- Anpassung: /dashboard/portal/[linkId] Frontend (Passwort-Regenerierung-Button)
- npm-Package: KEINE neuen Packages (nur Node.js crypto Built-In)
- Middleware: /api/portal/verify-password als oeffentliche Route hinzufuegen
- ENV: PORTAL_SESSION_SECRET (optional, empfohlen fuer Production)

## Tech-Design (Solution Architect)

### Tech-Design Review Findings

**Reviewer:** Solution Architect
**Datum:** 2026-02-08
**Methode:** Vergleich der Spec gegen den tatsaechlichen Codestand aller relevanten Dateien

---

#### BESTAETIGT (Annahmen die korrekt sind)

1. **E-Mail-Template password-Feld:** `src/lib/email.ts` hat `password?: string` im `PortalEmailData`-Interface (Zeile 20) und bedingte Sections in `buildPortalEmailHtml()` (Zeile 33-34) und `buildPortalEmailText()` (Zeile 86-87). Die Spec-Annahme "bereits vorbereitet" ist korrekt.

2. **publicRoutes-Array:** Das Array in `src/lib/supabase-middleware.ts` (Zeile 47-54) enthaelt bereits `/p/`, `/api/portal/submit` und `/api/portal/verify`. Das Hinzufuegen von `/api/portal/verify-password` ist korrekt geplant und passt ins Pattern.

3. **Middleware-Matching:** Die `publicRoutes`-Pruefung nutzt `pathname.startsWith(route)`, daher wuerde `/api/portal/verify-password` korrekt matchen wenn als eigenstaendiger Eintrag hinzugefuegt.

4. **Auth-Check-Pattern:** Alle geschuetzten Endpoints nutzen das gleiche Pattern: `supabase.auth.getUser()` + `!user.email_confirmed_at` -> 401. Das ist konsistent in `links/route.ts` und `send-email/route.ts`. Die neuen Endpoints sollten dieses Pattern uebernehmen.

5. **Zod-Validierung:** Wird in `links/route.ts` (z.B. `CreateLinkSchema`, `UpdateLinkSchema`) und `send-email/route.ts` (`SendEmailSchema`) verwendet. Import: `import { z } from "zod"`. Zod v4.3.5 ist installiert. Die geplanten Schemas fuer verify-password und regenerate-password passen.

6. **shadcn/ui-Komponenten:** Alle referenzierten Komponenten sind installiert: Card, Button, Input, Dialog, Badge, Tooltip, Label, Separator, Progress. Die Spec referenziert keine fehlenden Komponenten.

7. **Lucide-Icons:** `lucide-react` v0.562.0 ist installiert. Alle geplanten Icons (Lock, KeyRound, RefreshCw, Shield) sind verfuegbar. `Shield` wird bereits in `/p/[token]/page.tsx` verwendet.

8. **Keine neuen npm-Packages:** Korrekt. `crypto` ist ein Node.js Built-In. Alle anderen Abhaengigkeiten sind bereits vorhanden.

9. **Error-Response-Pattern:** Alle Endpoints nutzen `NextResponse.json({ error: ... }, { status: ... })` fuer Fehler und `NextResponse.json({ success: true, ... })` oder `NextResponse.json({ link: ... })` fuer Erfolg. Konsistent.

10. **send-email URL-Bau:** Die Spec nimmt korrekt an, dass `send-email/route.ts` die Upload-URL aus ENV-Variablen baut. Tatsaechlich: `process.env.NEXT_PUBLIC_APP_URL` als primaere Quelle, dann `VERCEL_URL`, dann `origin`/`host` Header als Fallback. Der SEC-2 Fix aus PROJ-9 QA wurde bereits umgesetzt.

11. **verify_portal_token RPC-Aufruf:** Wird an zwei Stellen verwendet (verify/route.ts Zeile 20, submit/route.ts Zeile 62), jeweils mit `.rpc("verify_portal_token", { lookup_token: token }).single<{...}>()`. Das Erweiterungsmuster (zusaetzliche Felder im Return-Typ) ist korrekt geplant.

12. **Portal-Upload-Seite PageState:** Aktueller Type ist `"loading" | "form" | "success" | "error"`. Die Erweiterung um `"password"` ist sauber und passt in das bestehende State-Maschinen-Muster.

---

#### KORREKTUR (Anpassungen an der Spec noetig)

**K-1: Kein `createServiceClient()` als separate Funktion**

Die Spec referenziert unter "Wiederverwendung bestehender Module" ein Pattern `createServiceClient() fuer DB-Writes`. Im tatsaechlichen Code gibt es KEINE eigenstaendige Funktion `createServiceClient()`. Stattdessen wird in `submit/route.ts` der Service-Role-Client inline erstellt:

```typescript
import { createClient as createServiceClient } from "@supabase/supabase-js";
// ...
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAdmin = serviceRole
  ? createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceRole)
  : null;
const db = supabaseAdmin || supabase;
```

**Fix fuer die Implementierung:** Neue Endpoints die DB-Writes brauchen (verify-password fuer increment_failed_attempts, send-email fuer Passwort-Update) muessen denselben Inline-Pattern verwenden. Alternativ: Das Pattern in `src/lib/portal-auth.ts` oder eine neue `src/lib/supabase-admin.ts` Hilfsfunktion auslagern (empfohlen bei 4+ Nutzungen).

**K-2: verify_portal_token() gibt aktuell KEIN `is_locked` und KEIN `has_password` zurueck**

Die bestehenden RPC-Aufrufe tippen den Return-Wert als:
```typescript
.single<{
  id: string;
  is_active: boolean;
  expires_at: string | null;
  label: string;
}>()
```

Die Spec plant korrekt, `verify_portal_token()` um `is_locked` und `has_password` zu erweitern. Aber der TypeScript-Typ an **beiden** Aufrufstellen (verify/route.ts UND submit/route.ts) muss ebenfalls aktualisiert werden.

**Fix:** Bei der Implementierung muessen die `.single<{...}>()` Typ-Annotationen in verify/route.ts (Zeile 21-26) und submit/route.ts (Zeile 63-68) um `is_locked: boolean` und `has_password: boolean` erweitert werden.

**K-3: send-email braucht Service-Role-Client fuer DB-UPDATE**

Die Spec plant, dass `send-email/route.ts` den Passwort-Hash in der DB aktualisiert (UPDATE portal_links SET password_hash=..., password_salt=..., failed_attempts=0, is_locked=false). Aktuell nutzt `send-email/route.ts` NUR den normalen Supabase-Client (via `createClient()` aus `supabase-server.ts`), weil es bisher nur SELECT-Queries macht:

```typescript
const { data: link, error: linkError } = await supabase
  .from("portal_links")
  .select("id, token, label, is_active, expires_at")
  .eq("id", parsed.data.linkId)
  .eq("user_id", user.id)
  .single();
```

Da der User eingeloggt ist und die UPDATE-Query `.eq("user_id", user.id)` nutzen kann, KOENNTE der normale Client mit passender RLS-Policy funktionieren. ABER: Die bestehende RLS-Policy fuer portal_links erlaubt nur UPDATE auf `is_active` (basierend auf der PATCH-Route in links/route.ts). Eine neue RLS-Policy muesste password_hash, password_salt, failed_attempts, is_locked einschliessen.

**Fix (zwei Optionen):**
- Option A (einfacher): Service-Role-Client in send-email einbauen (gleiches Pattern wie submit/route.ts). Dann sind keine RLS-Aenderungen noetig.
- Option B (sauberer): Bestehende RLS-Policy "Users can manage own portal links" erlaubt vermutlich alle Spalten-Updates. Zu verifizieren in Supabase Dashboard. Falls ja, reicht der normale Client.
- **Empfehlung:** Option A, da es das etablierte Pattern fuer DB-Writes ist und keine RLS-Abhaengigkeit schafft.

**K-4: regenerate-password braucht ebenfalls Service-Role-Client oder RLS-Pruefung**

Gleicher Punkt wie K-3. Der neue `regenerate-password/route.ts` Endpoint macht einen UPDATE auf portal_links. Da der User eingeloggt ist und die Ownership-Pruefung `.eq("user_id", user.id)` nutzt, haengt es von der RLS-Policy ab. Gleiche Empfehlung wie K-3: Service-Role-Client verwenden.

**K-5: PortalLink-Interface in dashboard/portal/page.tsx**

Die Spec referenziert die Erweiterung des `PortalLink`-Interfaces. Das bestehende Interface ist:

```typescript
interface PortalLink {
  id: string;
  token: string;
  label: string;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
  submission_count: number;
}
```

**Wichtig:** Dieses Interface wird im Frontend definiert und aus dem API-Response befuellt. Der GET /api/portal/links Endpoint mappt die DB-Felder in Zeile 29-36:

```typescript
const result = (links || []).map((link) => ({
  id: link.id,
  token: link.token,
  label: link.label,
  is_active: link.is_active,
  expires_at: link.expires_at,
  created_at: link.created_at,
  submission_count: link.portal_submissions?.[0]?.count ?? 0,
}));
```

**Fix:** BEIDE Stellen muessen angepasst werden:
1. Das `result`-Mapping in GET /api/portal/links muss `is_locked` und ggf. `has_password` (aus `password_hash IS NOT NULL`) einschliessen
2. Das Frontend-Interface `PortalLink` muss um `is_locked: boolean` erweitert werden

**K-6: LinkInfo-Interface in dashboard/portal/[linkId]/page.tsx**

Analog zu K-5 muss das `LinkInfo`-Interface erweitert werden. Aktuell:

```typescript
interface LinkInfo {
  id: string;
  token: string;
  label: string;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
}
```

**Fix:** Um `is_locked: boolean`, `failed_attempts: number` und `has_password: boolean` erweitern. Auch der API-Endpoint GET /api/portal/submissions muss diese Felder im `link`-Objekt zurueckgeben.

**K-7: GET /api/portal/links SELECT-Query erweitern**

Die bestehende SELECT-Query in `links/route.ts` Zeile 17 ist:
```typescript
.select("*, portal_submissions(count)")
```

Das `*` wuerde die neuen Spalten automatisch einschliessen, ABER das Mapping in Zeile 29-36 filtert die Felder explizit. Daher muss das Mapping-Objekt um `is_locked` erweitert werden.

**K-8: copied-State ist global (Single-State fuer Link und Passwort)**

In `dashboard/portal/page.tsx` gibt es nur einen einzigen `copied`-State (Boolean) der fuer ALLE Kopier-Aktionen geteilt wird. Wenn ein "Passwort kopieren"-Button hinzugefuegt wird, wuerde ein Klick auf "Passwort kopieren" auch den "Link kopieren"-Button als "kopiert" anzeigen.

**Fix:** Entweder separaten `passwordCopied`-State einfuehren, oder den `copied`-State auf einen String umstellen der anzeigt WAS kopiert wurde (z.B. `copied: "link" | "password" | null`).

**K-9: Migrationen existieren nicht als Dateien im Repo**

Die Spec referenziert `supabase/migrations/003_add_portal_password.sql`. Im Repo existiert KEIN `supabase/`-Verzeichnis und keine SQL-Migrationsdateien. Die bisherigen Migrationen (001, 002) wurden offensichtlich direkt im Supabase Dashboard oder via CLI ausgefuehrt, ohne die SQL-Dateien zu committen.

**Fix:** Die Spec sollte klarstellen, dass die Migration entweder:
- Als SQL-Datei im Repo erstellt UND im Supabase Dashboard/CLI ausgefuehrt wird (empfohlen)
- Oder wie bisher direkt im Supabase Dashboard ausgefuehrt wird (Ist-Zustand)
- Der Dateiname 003_add_portal_password.sql ist als Referenz sinnvoll, auch wenn die Datei ggf. nur als Dokumentation dient

**K-10: Zod v4 API-Kompatibilitaet**

Die Spec referenziert `z.string().uuid()` und `z.string().min(1)`. Zod v4 (installiert: v4.3.5) hat eine leicht andere API als Zod v3. Insbesondere:
- `z.string().uuid()` -> In Zod v4 moeglicherweise `z.string().check(z.uuid())` oder aequivalent
- Die bestehenden Endpoints nutzen Zod v4 erfolgreich (z.B. `z.string().max(200)`, `z.string().datetime()`, `z.string().email()` in send-email)

**Fix:** Bei der Implementierung die tatsaechliche Zod v4 API fuer UUID-Validierung pruefen. Ggf. `z.string().uuid()` oder `z.uuid()` verwenden, je nach Zod v4 Syntax. Die bestehenden Patterns in `links/route.ts` und `send-email/route.ts` als Referenz nehmen.

---

#### ERGAENZUNG (Fehlende Details)

**E-1: GET /api/portal/submissions muss ebenfalls angepasst werden**

Die Spec erwaehnt `/dashboard/portal/[linkId]/page.tsx` soll `is_locked`, `failed_attempts` und `has_password` anzeigen. Diese Daten kommen vom Endpoint `GET /api/portal/submissions?linkId=xxx`. Dieser Endpoint wird in der Spec NICHT als anzupassender Endpoint aufgefuehrt.

**Ergaenzung:** GET /api/portal/submissions muss die Link-Daten um `is_locked`, `failed_attempts` und `has_password` (berechnet aus `password_hash IS NOT NULL`) erweitern.

**E-2: verify-password braucht Service-Role-Client fuer increment_failed_attempts()**

Der neue `verify-password/route.ts` Endpoint muss `increment_failed_attempts()` als RPC aufrufen. Da dies ein oeffentlicher Endpoint ohne Auth ist, braucht er den Service-Role-Client (oder die Security-Definer-Funktion muss fuer `anon` aufrufbar sein).

**Ergaenzung:** Die Security-Definer-Funktionen `verify_portal_password()` und `increment_failed_attempts()` muessen als `GRANT EXECUTE ... TO anon` konfiguriert werden (wie die bestehende `verify_portal_token()`). Alternativ: Service-Role-Client verwenden. Da der bestehende verify-Endpoint den normalen Client mit anon-Berechtigung nutzt (`.rpc("verify_portal_token", ...)`), sollten die neuen Funktionen ebenfalls `anon`-aufrufbar sein. Kein Service-Role-Client noetig fuer RPC-Aufrufe von Security-Definer-Funktionen.

**E-3: submit/route.ts - hat_password-Pruefung benoetigt Zugriff auf password_hash**

Die Spec plant, dass der submit-Endpoint die Session-Token-Pruefung nur durchfuehrt wenn `password_hash` vorhanden ist. Aktuell gibt `verify_portal_token()` KEIN `has_password`-Feld zurueck. Der submit-Endpoint muesste entweder:
- Die erweiterte `verify_portal_token()` verwenden (hat dann `has_password`)
- Oder den Session-Token selbst validieren und darin die link_id pruefen

**Ergaenzung:** Der submit-Endpoint sollte die erweiterte `verify_portal_token()` mit `has_password`-Feld verwenden. Wenn `has_password=true` -> Session-Token pruefen. Wenn `has_password=false` -> Session-Token-Pruefung ueberspringen.

**E-4: FormData-Submit mit Custom-Header**

Der bestehende `/p/[token]/page.tsx` Submit-Code sendet `FormData` mit `fetch()`:

```typescript
const res = await fetch("/api/portal/submit", {
  method: "POST",
  body: formData,
});
```

Fuer PROJ-10 muss der `X-Portal-Session`-Header hinzugefuegt werden:

```typescript
const res = await fetch("/api/portal/submit", {
  method: "POST",
  headers: { "X-Portal-Session": sessionToken || "" },
  body: formData,
});
```

**Wichtig:** Bei FormData darf KEIN `Content-Type`-Header manuell gesetzt werden (der Browser setzt automatisch `multipart/form-data` mit Boundary). Das Hinzufuegen eines Custom-Headers ist davon unabhaengig und funktioniert problemlos.

**E-5: createdLink-State muss um Passwort erweitert werden**

In `dashboard/portal/page.tsx` speichert der State `createdLink` nur die URL als String:
```typescript
const [createdLink, setCreatedLink] = useState<string | null>(null);
```

Fuer PROJ-10 muss auch das Passwort gespeichert werden. Der State muss auf ein Objekt umgestellt werden:
```typescript
const [createdLink, setCreatedLink] = useState<{ url: string; password: string } | null>(null);
```

Dies hat Auswirkungen auf alle Stellen die `createdLink` verwenden (Dialog, Copy-Button).

**E-6: .env.local.example muss PORTAL_SESSION_SECRET enthalten**

Analog zum PROJ-9 BUG-5 Finding fehlt `PORTAL_SESSION_SECRET` in `.env.local.example`. Auch `SUPABASE_SERVICE_ROLE_KEY` fehlt dort (wird bereits von submit/route.ts benoetigt).

**Ergaenzung:** `.env.local.example` erweitern:
```
# Supabase Service Role (REQUIRED for portal submissions)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Portal Session Secret (optional, recommended for production)
PORTAL_SESSION_SECRET=your_random_secret_here
```

**E-7: Submissions-API Endpoint Pfad**

Die Link-Detail-Seite `/dashboard/portal/[linkId]/page.tsx` laedt Daten von:
```typescript
const res = await fetch(`/api/portal/submissions?linkId=${encodeURIComponent(linkId)}`);
```

Die Spec erwaehnt diesen Endpoint nicht unter "Anpassung bestehender Endpunkte". Der Endpoint muss um `is_locked`, `failed_attempts` in der Link-Info erweitert werden.

**E-8: Service-Role-Client Auslagerung empfohlen**

Der Service-Role-Client wird aktuell nur in submit/route.ts inline erstellt. Mit PROJ-10 wird er in mindestens 3 weiteren Endpoints benoetigt (verify-password, regenerate-password, send-email). Empfehlung: Eine Hilfsfunktion erstellen.

**Ergaenzung zu portal-auth.ts (oder separate Datei src/lib/supabase-admin.ts):**
```typescript
export function createAdminClient() {
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRole) return null;
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceRole);
}
```

---

#### RISIKO (Potenzielle Probleme)

**R-1: PORTAL_SESSION_SECRET Fallback auf SUPABASE_SERVICE_ROLE_KEY**

Die Spec plant einen Fallback: Wenn `PORTAL_SESSION_SECRET` nicht gesetzt ist, wird `SUPABASE_SERVICE_ROLE_KEY` als HMAC-Signing-Secret verwendet. Das funktioniert technisch, aber:
- Der Service-Role-Key ist ein Supabase-Admin-Schluessel mit vollen DB-Rechten
- Wenn der HMAC-signierte Token irgendwie geleakt wird, verraet er indirekt Information ueber den Service-Role-Key (obwohl HMAC nicht reversibel ist)
- Bei Key-Rotation des Service-Role-Keys werden alle Session-Tokens ungueltig

**Empfehlung:** Expliziten Fallback dokumentieren und in der Implementierung eine Warnung loggen wenn `PORTAL_SESSION_SECRET` nicht gesetzt ist. Fuer Production immer ein eigenes Secret setzen.

**R-2: Keine Migrationen-Dateien im Repo**

Es gibt keine `supabase/`-Verzeichnis-Struktur im Repo. Migrationen wurden bisher direkt in Supabase ausgefuehrt. Das bedeutet:
- Kein versioniertes DB-Schema
- Keine reproduzierbare Umgebung (Dev/Staging/Production)
- Risiko von Schema-Drift zwischen Umgebungen

**Empfehlung:** Die PROJ-10 Migration als SQL-Datei im Repo ablegen (auch wenn sie manuell ausgefuehrt wird). Das dient als Dokumentation und ermoeglicht spaetere Automatisierung.

**R-3: publicRoutes Matching koennte verify-password und verify verwechseln**

Das `publicRoutes`-Array nutzt `pathname.startsWith(route)`. Aktuell ist `/api/portal/verify` drin. Wenn `/api/portal/verify-password` hinzugefuegt wird, wuerde `/api/portal/verify` bereits `/api/portal/verify-password` matchen (da startsWith).

**Analyse:** `/api/portal/verify` im publicRoutes-Array matcht `pathname.startsWith("/api/portal/verify")`. Das wuerde AUCH `/api/portal/verify-password` matchen. Daher ist `/api/portal/verify-password` BEREITS implizit eine oeffentliche Route!

**Fix:** Entweder:
- Explizit hinzufuegen fuer Klarheit (redundant aber dokumentierend)
- Oder in einem Kommentar vermerken, dass es implizit gematchted wird
- **Wichtig:** Dieses Verhalten muss bewusst sein. Wenn ein zukuenftiger geschuetzter Endpoint unter `/api/portal/verify-something` angelegt wuerde, waere er versehentlich oeffentlich!

**R-4: Race-Condition bei gleichzeitiger Passwort-Neugenerierung und Passwort-Versuch**

Szenario: Betreuer generiert ein neues Passwort (setzt failed_attempts=0, neuen Hash) WAEHREND ein Mandant gerade das alte Passwort eingibt. Der Mandant wuerde:
1. verify_portal_password() aufrufen -> bekommt den ALTEN Hash
2. Passwort-Vergleich schlaegt fehl (oder passt, je nach Timing)
3. increment_failed_attempts() wird aufgerufen -> setzt Zaehler auf 1 (der Betreuer hat ihn gerade auf 0 gesetzt)

**Bewertung:** Geringes Risiko. In der Praxis wird dies extrem selten auftreten. Der Mandant kann einfach das neue Passwort verwenden. Kein Datenverlust.

**R-5: Zod v4 Breaking Changes**

Das Projekt nutzt Zod v4.3.5. Zod v4 hat einige API-Aenderungen gegenueber v3. Bestehende Nutzungen im Code (z.B. `z.string().max(200)`, `z.string().datetime()`, `z.string().email()`, `z.object({...})`, `.safeParse()`) funktionieren offensichtlich. Aber bei der Implementierung sollte die aktuelle Zod v4 Dokumentation konsultiert werden fuer:
- UUID-Validierung (`z.string().uuid()` vs andere Syntax)
- Error-Handling (.flatten() etc.)

---

### Component-Struktur

**Angepasste Seite: `/p/[token]/page.tsx`**

```
/p/[token] [ANPASSEN - bestehend aus PROJ-8]
├── SafeDocs-Header (unveraendert)
├── Loading-State (unveraendert)
├── Error-State (unveraendert, erweitert um "Gesperrt"-Meldung)
├── Passwort-Eingabe-State [NEU - zwischen Loading und Form]
│   ├── Shield/Lock-Icon
│   ├── Titel: "Passwort eingeben"
│   ├── Beschreibung: "Bitte geben Sie das Passwort ein, das Sie erhalten haben."
│   ├── Card
│   │   ├── Passwort-Feld (Input type=password, Paste erlaubt)
│   │   ├── Fehlermeldung (bei falschem Passwort, mit Anzahl verbleibender Versuche)
│   │   └── "Weiter"-Button
│   └── Hinweis: "Passwort nicht erhalten? Kontaktieren Sie Ihren Ansprechpartner."
├── Form-State (unveraendert, aber nur nach Passwort-Erfolg)
│   └── Submit sendet Session-Token als X-Portal-Session Header mit
└── Success-State (unveraendert)

Bestehender PageState: type PageState = "loading" | "form" | "success" | "error"
Neuer PageState:       type PageState = "loading" | "password" | "form" | "success" | "error"
                                                     ^^^^^^^^ NEU

Neuer State (zusaetzlich zu bestehenden States):
- sessionToken: string | null (nach Passwort-Validierung gesetzt)
- passwordError: string | null (Fehlermeldung bei falschem Passwort)
- remainingAttempts: number | null (verbleibende Versuche)
- isVerifyingPassword: boolean (Loading-State fuer Passwort-Pruefung)
- passwordValue: string (kontrolliertes Input-Feld)

Aenderungen am bestehenden validateToken()-Callback:
- Verify-Response enthaelt neu: passwordRequired: boolean
- Wenn passwordRequired=true -> setPageState("password")
- Wenn passwordRequired=false -> setPageState("form") (wie bisher)
- Wenn is_locked (HTTP 423) -> setErrorMessage("Zugang gesperrt..."), setPageState("error")

Aenderungen am bestehenden handleSubmit():
- headers-Objekt hinzufuegen: { "X-Portal-Session": sessionToken || "" }
- KEIN Content-Type-Header setzen (FormData boundary automatisch)
```

**Angepasste Seite: `/dashboard/portal/page.tsx`**

```
/dashboard/portal [ANPASSEN - bestehend]
├── PortalLink Interface [ANPASSEN]
│   └── Neue Felder: is_locked: boolean
│
├── getLinkStatus() [ANPASSEN]
│   └── Neue Pruefung VOR is_active: if (link.is_locked) return { label: "Gesperrt", variant: "destructive" as const }
│       ACHTUNG: Badge variant "destructive" ist derselbe wie "Abgelaufen".
│       Alternative: variant "outline" oder "secondary" mit orangem Text via className
│
├── Link-Tabelle [ANPASSEN]
│   └── Einreichungen-Spalte: Zeigt zusaetzlich "Gesperrt" Badge
│
├── createdLink-State [ANPASSEN]
│   └── Von string | null auf { url: string; password: string } | null umstellen
│   └── Alle Referenzen auf createdLink anpassen (Dialog, Copy-Button)
│
├── Link-Erstellt-Dialog [ANPASSEN]
│   └── Zeigt zusaetzlich das generierte Passwort (kopierbar)
│       ├── "Link kopieren"-Button (bestehend)
│       └── "Passwort kopieren"-Button [NEU]
│       └── Hinweis: "Speichern Sie das Passwort jetzt - es kann spaeter nicht mehr angezeigt werden."
│   └── BEACHTE: copied-State ist global (K-8). Separaten passwordCopied-State einfuehren.
│
├── handleCreate() [ANPASSEN]
│   └── Response enthaelt jetzt { link: {...}, password: "..." }
│   └── setCreatedLink({ url: getFullUrl(data.link.token), password: data.password })
│
└── E-Mail-Versand-Dialog [ANPASSEN]
    └── Hinweis: "Beim Senden wird ein neues Passwort fuer diesen Link generiert."
```

**Angepasste Seite: `/dashboard/portal/[linkId]/page.tsx`**

```
/dashboard/portal/[linkId] [ANPASSEN - bestehend]
├── LinkInfo Interface [ANPASSEN]
│   └── Neue Felder: is_locked: boolean, failed_attempts: number, has_password: boolean
│
├── getLinkStatusBadge() [ANPASSEN]
│   └── Neue Pruefung: if (link.is_locked) return <Badge variant="destructive">Gesperrt</Badge>
│
├── Link-Info-Karte [ANPASSEN]
│   ├── Bestehende Infos (Link, Erstellt am, Ablauf, etc.)
│   ├── Status: Zeigt "Gesperrt" Badge wenn is_locked=true
│   ├── Fehlversuche-Anzeige: "X von 5 Fehlversuchen" [NEU]
│   └── Button "Neues Passwort generieren" [NEU]
│       ├── Klick oeffnet Bestaetigungs-Dialog (neuer Dialog-State)
│       ├── Nach Bestaetigung: API-Aufruf POST /api/portal/regenerate-password
│       ├── Neues Passwort wird einmalig im Dialog angezeigt (kopierbar)
│       ├── Hinweis: "Das neue Passwort muss dem Mandanten erneut mitgeteilt werden."
│       └── Fehlversuche und Sperrung werden zurueckgesetzt
│
├── Neue State-Variablen:
│   ├── showPasswordDialog: boolean
│   ├── newPassword: string | null (einmalig nach Regenerierung)
│   ├── isRegenerating: boolean
│   ├── regenerateError: string | null
│   └── passwordCopied: boolean
│
└── Neue Imports: KeyRound, RefreshCw aus lucide-react; Dialog-Komponenten
```

### API-Struktur

```
Bestehende Endpoints (ANPASSEN):
├── GET /api/portal/links [ANPASSEN]
│   ├── Neu: result-Mapping um is_locked erweitern (Zeile 29-36)
│   └── Response pro Link: { ...bestehendeFelder, is_locked: boolean }
│
├── POST /api/portal/links [ANPASSEN]
│   ├── Neu: import { generatePassword, hashPassword } from "@/lib/portal-auth"
│   ├── Neu: Generiert 12-Zeichen-Passwort
│   ├── Neu: Erstellt Hash + Salt (crypto.scrypt, 16 Byte Salt, 64 Byte Output)
│   ├── Neu: Speichert password_hash + password_salt in portal_links INSERT
│   │   Bestehender INSERT: { user_id, token, label, expires_at }
│   │   Neuer INSERT: { user_id, token, label, expires_at, password_hash, password_salt }
│   └── Neu: Response: { link: {...}, password: "AbC123..." }
│       Bestehende Response: { link: {...} }
│
├── GET /api/portal/verify [ANPASSEN]
│   ├── Neu: verify_portal_token() gibt jetzt auch is_locked und has_password zurueck
│   ├── Neu: TypeScript-Typ erweitern: .single<{ ..., is_locked: boolean, has_password: boolean }>()
│   ├── Neu: Wenn is_locked=true -> 423 "Dieser Zugang wurde gesperrt"
│   └── Neu: Erfolg-Response: { valid: true, label?, passwordRequired: boolean }
│       Bestehende Response: { valid: true, label? }
│
├── POST /api/portal/submit [ANPASSEN]
│   ├── Neu: verify_portal_token() TypeScript-Typ erweitern (has_password)
│   ├── Neu: Wenn has_password=true: X-Portal-Session Header lesen
│   ├── Neu: import { verifySessionToken } from "@/lib/portal-auth"
│   ├── Neu: Session-Token validieren (HMAC-Signatur + Ablaufzeit pruefen)
│   ├── Neu: Wenn has_password=true und Token ungueltig/fehlend -> 401
│   ├── Neu: Wenn has_password=false -> Session-Token-Pruefung ueberspringen
│   └── Bestehender Code ab Token-Validierung bleibt unveraendert
│
├── POST /api/portal/send-email [ANPASSEN]
│   ├── Neu: import { generatePassword, hashPassword } from "@/lib/portal-auth"
│   ├── Neu: Service-Role-Client hinzufuegen (wie submit/route.ts Pattern) [K-3]
│   ├── Neu: Generiert neues 12-Zeichen-Passwort
│   ├── Neu: UPDATE portal_links SET password_hash, password_salt, failed_attempts=0, is_locked=false
│   ├── Neu: emailData.password = plainPassword (an buildPortalEmailHtml/Text uebergeben)
│   └── Bestehender E-Mail-Versand-Code bleibt unveraendert
│
└── GET /api/portal/submissions [ANPASSEN - in Spec gefehlt! E-1]
    ├── Neu: Link-Abfrage um is_locked, failed_attempts, password_hash erweitern
    └── Neu: Link-Response um is_locked, failed_attempts, has_password erweitern

Neue Endpoints:
├── POST /api/portal/verify-password [NEU - oeffentlich]
│   ├── Auth: KEINE (oeffentlich!)
│   ├── Request-Body: { token: string, password: string }
│   ├── Validierung: Zod-Schema (token: z.string(), password: z.string().min(1))
│   ├── DB-Zugriff: Normaler Supabase-Client reicht (RPC auf Security-Definer-Funktion) [E-2]
│   ├── Schritt 1: Token-Lookup via verify_portal_password() RPC (anon-aufrufbar)
│   │   └── Gibt: id, password_hash, password_salt, failed_attempts, is_locked, is_active, expires_at
│   ├── Schritt 2: Status-Checks (gleiche Reihenfolge wie verify/route.ts)
│   │   ├── Link nicht gefunden -> 404 "Dieser Link ist ungueltig"
│   │   ├── is_locked -> 423 "Dieser Zugang wurde gesperrt"
│   │   ├── !is_active -> 410 "Dieser Link ist nicht mehr gueltig"
│   │   └── abgelaufen -> 410 "Dieser Link ist abgelaufen"
│   ├── Schritt 3: Passwort pruefen (import { verifyPassword, createSessionToken } from portal-auth)
│   │   ├── Korrekt: Session-Token erstellen + zurueckgeben
│   │   └── Falsch: increment_failed_attempts() RPC aufrufen (anon-aufrufbar)
│   │       ├── Gibt neue failed_attempts und is_locked zurueck
│   │       ├── Berechne remainingAttempts = 5 - failed_attempts
│   │       └── Bei is_locked=true: locked=true im Response
│   ├── Erfolg-Response: { success: true, sessionToken: "..." }
│   └── Fehler-Response: { error: "Falsches Passwort", remainingAttempts: 3 }
│       oder: { error: "Zugang gesperrt", locked: true }
│
└── POST /api/portal/regenerate-password [NEU - geschuetzt]
    ├── Auth: Eingeloggt + verifiziert (Standard-Pattern)
    ├── Request-Body: { linkId: string }
    ├── Validierung: Zod-Schema (linkId: z.string().uuid() -- Zod v4 Syntax pruefen [K-10])
    ├── DB-Zugriff: Service-Role-Client empfohlen [K-4] oder normaler Client mit RLS
    ├── Prueft: Link gehoert dem User (.eq("user_id", user.id))
    ├── Generiert: Neues 12-Zeichen-Passwort
    ├── UPDATE: password_hash, password_salt, failed_attempts=0, is_locked=false
    └── Response: { success: true, password: "NeuesPw123..." }
```

### Daten-Model

```
Tabelle portal_links (ANPASSEN - bestehend):

Bestehende Spalten (aus Code abgeleitet, keine SQL-Datei vorhanden):
- id UUID PRIMARY KEY DEFAULT gen_random_uuid()
- user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
- token TEXT NOT NULL UNIQUE
- label TEXT DEFAULT ''
- is_active BOOLEAN NOT NULL DEFAULT true
- expires_at TIMESTAMPTZ
- created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()

Neue Spalten:
- password_hash TEXT         (NULLABLE - null fuer bestehende Links ohne Passwort)
- password_salt TEXT         (NULLABLE - null fuer bestehende Links ohne Passwort)
- failed_attempts INTEGER NOT NULL DEFAULT 0
- is_locked BOOLEAN NOT NULL DEFAULT false

Entscheidung: password_hash + password_salt sind NULLABLE
Grund: Bestehende Links (vor PROJ-10) haben kein Passwort. Diese sollen
       weiterhin funktionieren (Uebergangsphase). Das Frontend prueft
       "passwordRequired" vom Verify-Endpoint und zeigt den Passwort-Screen
       nur wenn noetig.

Session-Token (kein DB-Eintrag):
- Signiert via HMAC-SHA256
- Payload: link_id + Ablauf-Timestamp (Unix, 60 Min in der Zukunft)
- Format: base64url(payload) + "." + base64url(hmac_signature)
- Gespeichert: Nur im Client (State/Memory), gesendet als X-Portal-Session Header
```

```
Security-Definer-Funktionen (NEU in Migration 003):

1. verify_portal_password(lookup_token TEXT)
   -> RETURNS TABLE(id UUID, password_hash TEXT, password_salt TEXT,
                    failed_attempts INT, is_locked BOOLEAN,
                    is_active BOOLEAN, expires_at TIMESTAMPTZ)
   -> SELECT id, password_hash, password_salt, failed_attempts, is_locked,
             is_active, expires_at
      FROM portal_links WHERE token = lookup_token
   -> SECURITY DEFINER (umgeht RLS)
   -> GRANT EXECUTE ON FUNCTION verify_portal_password TO anon, authenticated

2. increment_failed_attempts(link_uuid UUID)
   -> RETURNS TABLE(failed_attempts INT, is_locked BOOLEAN)
   -> UPDATE portal_links
      SET failed_attempts = failed_attempts + 1,
          is_locked = CASE WHEN failed_attempts + 1 >= 5 THEN true ELSE is_locked END
      WHERE id = link_uuid
      RETURNING failed_attempts, is_locked
   -> SECURITY DEFINER (umgeht RLS)
   -> GRANT EXECUTE ON FUNCTION increment_failed_attempts TO anon, authenticated
   -> Atomarer Inkrement (Race-Condition-sicher)

3. verify_portal_token(lookup_token TEXT) [ANPASSEN - bestehend]
   -> Bestehender Return: id, is_active, expires_at, label
   -> Neuer Return: id, is_active, expires_at, label, is_locked,
                    (password_hash IS NOT NULL) AS has_password
   -> Damit der Verify-Endpoint pruefen kann ob Passwort noetig ist und ob gesperrt
   -> ACHTUNG: Alle bestehenden Aufrufer (verify/route.ts, submit/route.ts)
      muessen ihre TypeScript-Typen aktualisieren [K-2]
```

### Seitenstruktur

```
Angepasste Seiten/Dateien:
├── src/app/p/[token]/page.tsx [ANPASSEN]
│   ├── Neuer PageState "password" (zwischen loading und form)
│   ├── Neue State-Variablen (sessionToken, passwordError, remainingAttempts, isVerifyingPassword, passwordValue)
│   ├── validateToken() Callback anpassen (passwordRequired + is_locked Handling)
│   ├── Passwort-Eingabe-UI (Card mit Input + Button)
│   ├── handleSubmit() anpassen: X-Portal-Session Header hinzufuegen [E-4]
│   └── Uebergangsphase: Wenn passwordRequired=false -> direkt zu "form"
│
├── src/app/dashboard/portal/page.tsx [ANPASSEN]
│   ├── PortalLink Interface: + is_locked: boolean
│   ├── getLinkStatus(): "Gesperrt" Check VOR is_active
│   ├── createdLink State: Von string auf { url, password } Objekt umstellen [E-5]
│   ├── handleCreate(): Response-Verarbeitung anpassen (password aus Response)
│   ├── Link-Erstellt-Dialog: Passwort + Kopier-Button + Warnhinweis
│   ├── Separater passwordCopied State (wegen globalem copied-State) [K-8]
│   └── E-Mail-Dialog: Hinweis auf Passwort-Neugenerierung
│
├── src/app/dashboard/portal/[linkId]/page.tsx [ANPASSEN]
│   ├── LinkInfo Interface: + is_locked, failed_attempts, has_password
│   ├── getLinkStatusBadge(): "Gesperrt" Badge
│   ├── Fehlversuche-Anzeige in Link-Info-Karte
│   ├── "Neues Passwort generieren"-Button + Dialog
│   └── Neue State-Variablen + Imports
│
├── src/app/api/portal/links/route.ts [ANPASSEN]
│   ├── GET: result-Mapping um is_locked erweitern [K-5, K-7]
│   └── POST: Passwort generieren + Hash speichern + Klartext im Response
│
├── src/app/api/portal/verify/route.ts [ANPASSEN]
│   ├── TypeScript-Typ fuer verify_portal_token erweitern [K-2]
│   ├── is_locked Check -> 423
│   └── passwordRequired im Response
│
├── src/app/api/portal/submit/route.ts [ANPASSEN]
│   ├── TypeScript-Typ fuer verify_portal_token erweitern [K-2]
│   └── Session-Token-Pruefung (wenn has_password=true) [E-3]
│
├── src/app/api/portal/send-email/route.ts [ANPASSEN]
│   ├── Service-Role-Client hinzufuegen [K-3]
│   └── Neues Passwort generieren + Hash in DB + Passwort in E-Mail
│
├── src/app/api/portal/submissions/route.ts [ANPASSEN - in Spec gefehlt! E-1]
│   └── Link-Response um is_locked, failed_attempts, has_password erweitern
│
├── src/lib/supabase-middleware.ts [ANPASSEN]
│   └── /api/portal/verify-password zu publicRoutes hinzufuegen
│       HINWEIS: Technisch bereits durch /api/portal/verify gematchted [R-3]
│       Trotzdem explizit hinzufuegen fuer Klarheit und Dokumentation

Neue Dateien:
├── src/lib/portal-auth.ts [NEU]
│   ├── generatePassword(length: number): string
│   │   └── crypto.randomBytes + Filterung auf [A-Za-z0-9]
│   ├── hashPassword(password: string): Promise<{ hash: string, salt: string }>
│   │   └── crypto.randomBytes(16) fuer Salt, crypto.scrypt(password, salt, 64)
│   ├── verifyPassword(password: string, hash: string, salt: string): Promise<boolean>
│   │   └── crypto.scrypt + crypto.timingSafeEqual
│   ├── createSessionToken(linkId: string, secret: string): string
│   │   └── base64url(JSON.stringify({linkId, exp})) + "." + base64url(hmac)
│   ├── verifySessionToken(token: string, secret: string): { linkId: string } | null
│   │   └── HMAC-Signatur pruefen + Ablaufzeit pruefen
│   └── getSigningSecret(): string
│       └── process.env.PORTAL_SESSION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY
│       └── Warnung loggen wenn Fallback verwendet wird [R-1]
│
├── src/lib/supabase-admin.ts [NEU - empfohlen, E-8]
│   └── createAdminClient(): SupabaseClient | null
│       └── Zentraler Service-Role-Client (statt Inline-Duplikation in 4+ Endpoints)
│
├── src/app/api/portal/verify-password/route.ts [NEU]
│   └── POST Handler (Token-Lookup + Passwort-Pruefung + Session-Token)
│
├── src/app/api/portal/regenerate-password/route.ts [NEU]
│   └── POST Handler (Auth + Passwort-Regenerierung)
│
└── supabase/migrations/003_add_portal_password.sql [NEU - als Referenz/Dokumentation]
    ├── ALTER TABLE portal_links ADD COLUMN password_hash TEXT
    ├── ALTER TABLE portal_links ADD COLUMN password_salt TEXT
    ├── ALTER TABLE portal_links ADD COLUMN failed_attempts INTEGER NOT NULL DEFAULT 0
    ├── ALTER TABLE portal_links ADD COLUMN is_locked BOOLEAN NOT NULL DEFAULT false
    ├── CREATE OR REPLACE FUNCTION verify_portal_password(lookup_token TEXT) ...
    ├── CREATE OR REPLACE FUNCTION increment_failed_attempts(link_uuid UUID) ...
    ├── ALTER verify_portal_token() -> is_locked + has_password hinzufuegen
    ├── GRANT EXECUTE ON FUNCTION verify_portal_password TO anon, authenticated
    └── GRANT EXECUTE ON FUNCTION increment_failed_attempts TO anon, authenticated
    HINWEIS: Keine SQL-Dateien im Repo vorhanden (Migrationen werden direkt
    in Supabase ausgefuehrt). Diese Datei dient als Dokumentation. [R-2]
```

### Tech-Entscheidungen

```
Warum crypto.scrypt statt bcryptjs?
-> Kein neues npm-Package noetig. crypto.scrypt ist ein Node.js Built-In
   (verfuegbar seit Node 10), das PBKDF2-aehnliche Key-Derivation bietet.
   Es ist speziell fuer Passwort-Hashing geeignet (memory-hard).
   Passt zum Projekt-Stil: PROJ-9 nutzt auch kein Brevo SDK sondern fetch.
   bcryptjs wuerde ~200KB hinzufuegen fuer eine Funktion die Node.js
   nativ bietet.

Warum HMAC-signierter Session-Token statt JWT?
-> Kein neues npm-Package noetig (kein jsonwebtoken, kein jose).
   crypto.createHmac ist ein Node.js Built-In.
   Der Token hat nur zwei Claims: link_id + expiry. Dafuer ist ein
   vollstaendiges JWT ueberdimensioniert. HMAC-Signatur reicht voellig aus.
   Der Token wird nie an Dritte weitergegeben (nur Client <-> Server).

Warum Security-Definer-Funktionen statt RLS-Policies?
-> Anonyme User (ohne auth.uid()) brauchen Zugriff auf password_hash,
   failed_attempts, is_locked. Breite SELECT-Policies waeren ein
   Sicherheitsrisiko (SEC-1 aus PROJ-8 QA). Security-Definer-Funktionen
   erlauben gezielten Zugriff ohne die Tabelle komplett zu oeffnen.
   Gleiches Pattern wie die bestehende verify_portal_token() Funktion.

Warum password_hash NULLABLE statt NOT NULL?
-> Bestehende Links (vor PROJ-10) haben kein Passwort. Eine NOT NULL
   Constraint wuerde die Migration fehlschlagen lassen oder wuerde
   erfordern, dass fuer alle bestehenden Links ein Passwort generiert
   wird (das niemand kennt). NULLABLE mit Uebergangsphase ist sauberer:
   Alte Links funktionieren weiterhin, neue Links bekommen automatisch
   ein Passwort. Der Betreuer kann ueber "Neues Passwort generieren"
   auch alte Links nachtraeglich schuetzen.

Warum X-Portal-Session Header statt Cookie?
-> Cookies erfordern SameSite/Secure/HttpOnly-Konfiguration und
   funktionieren nicht immer zuverlaessig in eingebetteten Kontexten
   (iframes, etc.). Ein Custom-Header ist einfacher, expliziter und
   wird programmatisch vom Frontend gesetzt. Da der Token nur waehrend
   einer Session lebt (State in der React-Komponente), ist ein Header
   ausreichend. FormData-Requests unterstuetzen Custom-Headers via
   fetch API problemlos.

Warum 60 Minuten Session-Dauer?
-> Lang genug fuer einen normalen Upload-Vorgang (auch bei langsamer
   Verbindung oder vielen Dateien). Kurz genug um bei kompromittiertem
   Token keinen dauerhaften Zugang zu geben. Der Mandant kann bei
   Ablauf einfach das Passwort erneut eingeben.

Warum separate Datei src/lib/portal-auth.ts?
-> Separation of Concerns: Passwort-Logik (Generierung, Hashing,
   Verifizierung) und Session-Token-Logik werden von mehreren
   API-Routen genutzt (links, verify-password, regenerate-password,
   send-email, submit). Ein zentrales Modul verhindert Duplikation.
   Gleiches Architektur-Pattern wie src/lib/files.ts und src/lib/email.ts.

Warum src/lib/supabase-admin.ts? [NEU - E-8]
-> Der Service-Role-Client wird bisher nur in submit/route.ts inline erstellt.
   Mit PROJ-10 brauchen mindestens 3 weitere Endpoints diesen Client
   (send-email, regenerate-password, ggf. verify-password). Eine zentrale
   Hilfsfunktion vermeidet 4-fache Code-Duplikation und stellt sicher,
   dass das Pattern konsistent ist. Zudem kann submit/route.ts auf die
   neue Hilfsfunktion umgestellt werden (Refactoring).
```

### Dependencies

```
Keine neuen npm-Packages!

Genutzte bestehende Dependencies:
- next (16.x)          -> API-Route Handler
- zod (4.x)            -> Request-Body-Validierung [K-10: v4 API beachten]
- @supabase/ssr        -> Server-Side Supabase Client (Cookie-basiert)
- @supabase/supabase-js -> Service-Role-Client (fuer DB-Writes)
                           Import-Pattern: import { createClient as createServiceClient } from "@supabase/supabase-js"
- lucide-react         -> Lock, KeyRound, RefreshCw, Shield Icons (alle in v0.562.0 verfuegbar)
- shadcn/ui            -> Card, Button, Input, Dialog, Badge, Tooltip, Label, Separator
                           Alle installiert in src/components/ui/

Genutzte Node.js Built-Ins:
- crypto.randomBytes   -> Passwort-Generierung + Salt-Generierung
- crypto.scrypt        -> Passwort-Hashing (memory-hard KDF)
- crypto.createHmac    -> Session-Token-Signierung (HMAC-SHA256)
- crypto.timingSafeEqual -> Timing-sichere Hash-Vergleich

Neue Environment Variables:
- PORTAL_SESSION_SECRET (optional, empfohlen fuer Production)
  -> Signing-Secret fuer Session-Tokens
  -> Fallback: SUPABASE_SERVICE_ROLE_KEY [R-1: Warnung loggen]
  -> In .env.local.example aufnehmen [E-6]

Bestehende Environment Variables (bereits benoetigt, aber teils nicht in .env.local.example):
- SUPABASE_SERVICE_ROLE_KEY (bereits von submit/route.ts benoetigt)
  -> In .env.local.example aufnehmen [E-6]
```

### Wiederverwendung bestehender Module

```
Aus src/lib/supabase-server.ts:
- createClient() -> Auth-Check und DB-Queries (wie bestehende Endpoints)
- ACHTUNG: Gibt Cookie-basierten Client zurueck (nutzt ANON_KEY)
- Fuer DB-Writes in oeffentlichen/geschuetzten Endpoints: Service-Role-Client noetig [K-3, K-4]

Aus src/lib/email.ts:
- sendBrevoEmail() -> E-Mail-Versand (unveraendert)
- buildPortalEmailHtml(data) -> Bereits password?-Feld vorbereitet (Zeile 20, 33-34)
- buildPortalEmailText(data) -> Bereits password?-Feld vorbereitet (Zeile 86-87)
- buildPortalEmailSubject() -> Unveraendert
- Typ PortalEmailData -> Hat bereits password?: string

Aus bestehenden API-Routes (Pattern-Wiederverwendung):
- Auth-Check Pattern: supabase.auth.getUser() + !user.email_confirmed_at -> 401
  Verwendet in: links/route.ts, send-email/route.ts, submissions/route.ts
- Link-Ownership Pattern: .eq("user_id", user.id)
- Zod-Validierung Pattern: Schema.safeParse(body) + parsed.error
- Error-Response Pattern: NextResponse.json({ error: ... }, { status: ... })
- Service-Role-Client Pattern (aus submit/route.ts):
  import { createClient as createServiceClient } from "@supabase/supabase-js"
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY
  const supabaseAdmin = serviceRole ? createServiceClient(URL, serviceRole) : null
  const db = supabaseAdmin || supabase

Aus src/app/p/[token]/page.tsx (UI-Wiederverwendung):
- SafeDocs-Header (identisch, Shield-Icon)
- Card-Layout (identisch)
- Error-State (erweitert um Sperr-Meldung mit HTTP 423 Handling)
- Loading-State (identisch)
- validateToken() Callback-Pattern (erweitern, nicht ersetzen)

Aus src/app/dashboard/portal/page.tsx (UI-Wiederverwendung):
- Dialog-Pattern (shadcn Dialog mit Header, Content, Footer)
- State-Management Pattern (useState-basiert)
- getLinkStatus() Funktion (erweitern um "Gesperrt"-Check)
- handleCopy() Funktion (wiederverwendbar, aber separater State noetig [K-8])

Aus src/app/dashboard/portal/[linkId]/page.tsx (UI-Wiederverwendung):
- getLinkStatusBadge() Funktion (erweitern um "Gesperrt"-Badge)
- LinkInfo Interface (erweitern um neue Felder)
- Card-Layout fuer Link-Info (erweitern um Fehlversuche + Button)
```

### Implementierungs-Reihenfolge (empfohlen)

```
Phase 1: Infrastruktur (keine UI-Aenderungen)
1. SQL-Migration erstellen und in Supabase ausfuehren
   - Neue Spalten + Security-Definer-Funktionen
   - verify_portal_token() erweitern
2. src/lib/portal-auth.ts erstellen
   - generatePassword, hashPassword, verifyPassword
   - createSessionToken, verifySessionToken, getSigningSecret
3. src/lib/supabase-admin.ts erstellen (optional, empfohlen)
   - createAdminClient()

Phase 2: API-Endpoints (Backend)
4. POST /api/portal/links anpassen (Passwort generieren bei Link-Erstellung)
5. GET /api/portal/verify anpassen (is_locked + passwordRequired)
6. POST /api/portal/verify-password erstellen (neuer oeffentlicher Endpoint)
7. POST /api/portal/regenerate-password erstellen (neuer geschuetzter Endpoint)
8. POST /api/portal/submit anpassen (Session-Token-Pruefung)
9. POST /api/portal/send-email anpassen (Passwort-Generierung + E-Mail)
10. GET /api/portal/submissions anpassen (is_locked, failed_attempts in Response) [E-1]
11. Middleware: publicRoutes aktualisieren

Phase 3: Frontend
12. /p/[token]/page.tsx anpassen (Passwort-Screen + Session-Token)
13. /dashboard/portal/page.tsx anpassen (Gesperrt-Badge + Passwort im Dialog)
14. /dashboard/portal/[linkId]/page.tsx anpassen (Passwort-Regenerierung)

Phase 4: Cleanup
15. .env.local.example aktualisieren [E-6]
16. submit/route.ts auf createAdminClient() umstellen (optionales Refactoring)
```
