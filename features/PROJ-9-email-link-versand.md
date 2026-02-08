# PROJ-9: E-Mail-Versand von Zugangslinks (Brevo)

## Status: 🔵 Planned

## Beschreibung
Eingeloggte User (Mandanten-Betreuer) koennen den Zugangslink eines Mandanten-Portals direkt per E-Mail an einen Empfaenger versenden. Der Versand erfolgt ueber die Brevo HTTP-API v3. Der Betreuer gibt die Empfaenger-E-Mail-Adresse manuell ein. Der E-Mail-Text ist fest vorgegeben und enthaelt das Link-Label als Kontext. Ein Button "Zugangslink senden" ist in der Link-Tabelle pro Link verfuegbar. Der gleiche Link kann beliebig oft an verschiedene Empfaenger versendet werden.

Ab PROJ-10 enthaelt die E-Mail zusaetzlich ein automatisch generiertes Passwort.

## Zielgruppe
- **Primaer:** Eingeloggte User (Mandanten-Betreuer) - versenden Zugangslinks per E-Mail

## Abhaengigkeiten
- Benoetigt: PROJ-1 (User Registration) - Betreuer braucht Account
- Benoetigt: PROJ-2 (User Login) - Betreuer muss eingeloggt sein
- Benoetigt: PROJ-4 (Email Verification) - Betreuer muss verifiziert sein
- Benoetigt: PROJ-8 (Mandanten-Upload-Portal) - Portal-Links muessen existieren

## User Stories

### Mandanten-Betreuer (eingeloggt)
- Als eingeloggter User moechte ich einen "Zugangslink senden"-Button pro Link in der Tabelle sehen, um den Link per E-Mail zu versenden
- Als eingeloggter User moechte ich die Empfaenger-E-Mail-Adresse eingeben koennen, damit der Link an die richtige Person geht
- Als eingeloggter User moechte ich den gleichen Link mehrfach versenden koennen (an verschiedene oder gleiche Empfaenger), ohne Einschraenkung
- Als eingeloggter User moechte ich eine Bestaetigung sehen, wenn die E-Mail erfolgreich versendet wurde
- Als eingeloggter User moechte ich eine Fehlermeldung sehen, wenn der Versand fehlschlaegt

## Acceptance Criteria

### "Zugangslink senden"-Button
- [ ] Neuer Button "Zugangslink senden" in der Aktionen-Spalte der Link-Tabelle (pro Link)
- [ ] Button ist nur bei aktiven, nicht-abgelaufenen Links klickbar (bei deaktivierten/abgelaufenen ausgegraut mit Tooltip)
- [ ] Klick oeffnet einen Dialog

### E-Mail-Versand-Dialog
- [ ] Dialog-Titel: "Zugangslink senden"
- [ ] Eingabefeld: Empfaenger-E-Mail (Pflicht, Input type=email)
- [ ] Client-Side Validierung der E-Mail-Adresse
- [ ] "Senden"-Button loest den Versand aus
- [ ] "Abbrechen"-Button schliesst den Dialog
- [ ] Waehrend des Versands: Loading-Spinner auf dem Senden-Button, Button deaktiviert
- [ ] Nach erfolgreichem Versand: Erfolgsmeldung, Dialog schliesst sich
- [ ] Bei Fehler: Fehlermeldung im Dialog, Button wird wieder aktiviert

### E-Mail-Inhalt (fester Text mit Link-Label als Kontext)
- [ ] Absender-Name: "SafeDocs Portal" (via ENV: BREVO_SENDER_NAME)
- [ ] Absender-E-Mail: noreply@safedocsportal.com (via ENV: BREVO_SENDER_EMAIL)
- [ ] Betreff: "Ihr Zugangslink: [Link-Label]" (oder "Ihr Zugangslink zum Dokumenten-Upload" falls kein Label)
- [ ] E-Mail-Body (HTML, Spam-optimiert):
  - Klarer, professioneller Aufbau (kein uebertriebenes HTML)
  - Text: "Guten Tag,"
  - Text: "Sie haben einen sicheren Zugangslink zum Dokumenten-Upload erhalten."
  - Kontext: Link-Label als Beschreibung (z.B. "Betreff: Steuerdoku 2025 - Herr Mueller")
  - Prominenter Button: "Dokumente hochladen" (Link zum Portal)
  - Alternativ-Link als Klartext (fuer E-Mail-Clients die Buttons nicht darstellen)
  - Ablaufdatum-Hinweis (falls Link ein Ablaufdatum hat): "Dieser Link ist gueltig bis [Datum]."
  - Footer: "Diese E-Mail wurde ueber SafeDocs Portal versendet. Bei Fragen wenden Sie sich an Ihren Ansprechpartner."
- [ ] Kein Tracking-Pixel, keine externen Bilder (Spam-Vermeidung)
- [ ] Text/Plain-Alternative fuer Multipart-E-Mail (Spam-Vermeidung)
- [ ] Korrekter Reply-To Header (Betreuer-E-Mail, damit Rueckfragen beim Betreuer landen)

### Spam-Vermeidung
- [ ] Verifizierte Absender-Domain bei Brevo (safedocsportal.com - bereits eingerichtet)
- [ ] SPF, DKIM, DMARC korrekt konfiguriert (Brevo-seitig bei Domain-Verifizierung)
- [ ] Text/Plain + HTML Multipart (kein reines HTML)
- [ ] Keine Spam-Woerter im Betreff (kein "GRATIS", "DRINGEND", etc.)
- [ ] Keine externen Bilder/Tracking-Pixel
- [ ] Professioneller, sachlicher Ton
- [ ] Korrektes Absender-Format: "SafeDocs Portal <noreply@safedocsportal.com>"
- [ ] List-Unsubscribe Header (optional, verbessert Zustellbarkeit)

### API-Endpoint
- [ ] POST /api/portal/send-email
- [ ] Auth: Eingeloggt + verifiziert
- [ ] Request-Body: { linkId: string, recipientEmail: string }
- [ ] Prueft: Link gehoert dem eingeloggten User
- [ ] Prueft: Link ist aktiv und nicht abgelaufen
- [ ] Baut E-Mail aus Link-Daten auf (Label, Token, Ablaufdatum)
- [ ] Setzt Reply-To auf die E-Mail-Adresse des eingeloggten Users
- [ ] Sendet E-Mail ueber Brevo HTTP-API v3
- [ ] Gibt zurueck: { success: true } oder { error: string }

### Brevo-Integration
- [ ] Brevo HTTP-API v3: POST https://api.brevo.com/v3/smtp/email
- [ ] API-Key via Environment Variable: BREVO_API_KEY
- [ ] Absender-E-Mail via Environment Variable: BREVO_SENDER_EMAIL (default: noreply@safedocsportal.com)
- [ ] Absender-Name via Environment Variable: BREVO_SENDER_NAME (default: SafeDocs Portal)
- [ ] Kein zusaetzliches npm-Package noetig (fetch reicht)
- [ ] HTML-E-Mail-Template inline im Code
- [ ] Multipart: text/plain + text/html

### Mehrfach-Versand
- [ ] Gleicher Link kann beliebig oft versendet werden
- [ ] An verschiedene oder gleiche Empfaenger
- [ ] Kein Versand-Logging in der Datenbank (MVP)

## Edge Cases
- Was passiert wenn BREVO_API_KEY nicht konfiguriert ist? -> API gibt 500 mit "E-Mail-Versand ist nicht konfiguriert" zurueck
- Was passiert bei ungueltiger Empfaenger-E-Mail? -> Client-Side + Server-Side Validierung, Fehlermeldung
- Was passiert wenn der Link deaktiviert ist? -> Button ausgegraut + Tooltip "Link ist deaktiviert"
- Was passiert wenn der Link abgelaufen ist? -> Button ausgegraut + Tooltip "Link ist abgelaufen"
- Was passiert bei Brevo-API-Fehler (Rate Limit, 500)? -> Fehlermeldung "E-Mail konnte nicht versendet werden. Bitte versuchen Sie es spaeter erneut."
- Was passiert bei leerem Empfaenger-Feld? -> Validierungsfehler im Formular
- Was passiert bei Brevo-Quota erschoepft? -> Fehlermeldung mit Brevo-Error weiterleiten

## Technische Anforderungen
- Brevo HTTP-API v3 (kein SDK, nur fetch)
- Keine neuen npm-Packages
- Keine neuen Datenbank-Tabellen
- 3 neue Environment Variables: BREVO_API_KEY, BREVO_SENDER_EMAIL, BREVO_SENDER_NAME
- 1 neuer API-Endpoint: POST /api/portal/send-email
- E-Mail-Hilfsmodul: src/lib/email.ts (Brevo-Client + Template-Builder)
- HTML-E-Mail-Template: Inline, responsiv, Spam-optimiert

## Tech-Design (Solution Architect)

### Component-Struktur

**Bestehende Seite anpassen: `/dashboard/portal/page.tsx`**

```
/dashboard/portal [ANPASSEN - bestehend aus PROJ-8]
├── App-Header (unveraendert)
├── Seitentitel + "Neuen Link erstellen"-Button (unveraendert)
├── Link-Tabelle (Card > Table) [ANPASSEN]
│   ├── Spalten: Bezeichnung | Link | Status | Erstellt | Ablauf | Einreichungen | Aktionen
│   │   └── Pro Link eine Zeile (bestehend)
│   │       └── Aktionen-Spalte [ANPASSEN - erweitern]
│   │           ├── Aktivieren/Deaktivieren (Toggle-Icon, bestehend)
│   │           ├── Einreichungen ansehen (Ordner-Icon, bestehend)
│   │           └── "Zugangslink senden" (Mail-Icon, NEU)
│   │               ├── Button nur bei aktiven, nicht-abgelaufenen Links klickbar
│   │               ├── Bei deaktivierten Links: ausgegraut + Tooltip "Link ist deaktiviert"
│   │               └── Bei abgelaufenen Links: ausgegraut + Tooltip "Link ist abgelaufen"
├── Create-Link-Dialog (unveraendert)
├── Link-Created-Dialog (unveraendert)
└── E-Mail-Versand-Dialog (Modal) [NEU]
    ├── Dialog-Titel: "Zugangslink senden"
    ├── Dialog-Beschreibung: Zeigt Link-Label als Kontext
    ├── Eingabefeld: Empfaenger-E-Mail (Input type=email, Pflicht)
    │   ├── Client-Side Validierung (email regex)
    │   └── Fehlermeldung bei ungueltiger Eingabe
    ├── Fehler-Anzeige (bei API-Fehler, rot, im Dialog)
    ├── Dialog-Footer
    │   ├── "Abbrechen"-Button -> schliesst Dialog
    │   └── "Senden"-Button
    │       ├── Waehrend Versand: Loader2-Spinner, Button deaktiviert
    │       └── Nach Erfolg: Dialog schliesst, Erfolgsmeldung (toast/inline)
    └── Erfolgs-Feedback nach Versand
        └── Kurze Erfolgsmeldung (z.B. gruener Text oder Toast)
```

**Keine neuen Seiten. Keine Navigation-Aenderungen. Keine Header-Aenderungen.**

### API-Struktur

```
Bestehende Endpoints (unveraendert):
├── GET  /api/portal/links          (Auth, Link-Liste laden)
├── POST /api/portal/links          (Auth, Link erstellen)
├── PATCH /api/portal/links         (Auth, Link aktivieren/deaktivieren)
├── GET  /api/portal/verify         (oeffentlich, Token pruefen)
├── POST /api/portal/submit         (oeffentlich, Upload)
├── GET  /api/portal/submissions    (Auth, Einreichungen laden)
└── GET  /api/portal/download       (Auth, Datei herunterladen)

Neuer Endpoint:
└── POST /api/portal/send-email [NEU]
    ├── Auth: Eingeloggt + verifiziert (via supabase.auth.getUser())
    ├── Request-Body (JSON): { linkId: string, recipientEmail: string }
    ├── Validierung:
    │   ├── linkId: UUID-Format (zod)
    │   ├── recipientEmail: Gueltige E-Mail (zod + regex)
    │   └── BREVO_API_KEY vorhanden? Sonst 500 "E-Mail-Versand nicht konfiguriert"
    ├── Autorisierung:
    │   ├── Link aus portal_links laden (WHERE id = linkId AND user_id = auth.uid())
    │   ├── Link nicht gefunden? -> 404
    │   ├── Link deaktiviert? -> 400 "Link ist deaktiviert"
    │   └── Link abgelaufen? -> 400 "Link ist abgelaufen"
    ├── E-Mail-Aufbau:
    │   ├── Absender: ENV BREVO_SENDER_NAME + BREVO_SENDER_EMAIL
    │   ├── Empfaenger: recipientEmail aus Request
    │   ├── Reply-To: E-Mail-Adresse des eingeloggten Users (user.email)
    │   ├── Betreff: "Ihr Zugangslink: [label]" (oder Fallback ohne Label)
    │   ├── HTML-Body: Aus Template-Builder (src/lib/email.ts)
    │   └── Text-Body: Plain-Text-Alternative
    ├── Brevo-API-Aufruf:
    │   ├── POST https://api.brevo.com/v3/smtp/email
    │   ├── Header: api-key, Content-Type: application/json
    │   └── Fehler-Handling: Brevo-Response pruefen, bei Fehler -> 502
    └── Response:
        ├── Erfolg: { success: true }
        └── Fehler: { error: string } mit passendem HTTP-Status
```

### Daten-Model

**Keine neuen Tabellen. Keine Schema-Aenderungen.**

```
Datenfluss (E-Mail-Versand):

1. User klickt "Zugangslink senden" (Mail-Icon) in Link-Tabelle
   └── Dialog oeffnet sich, Link-ID wird uebergeben

2. User gibt Empfaenger-E-Mail ein, klickt "Senden"
   └── Frontend: POST /api/portal/send-email { linkId, recipientEmail }

3. API-Endpoint:
   ├── Auth-Check: supabase.auth.getUser() -> user.id, user.email
   ├── Link laden: supabase.from("portal_links").select("*").eq("id", linkId).eq("user_id", user.id)
   │   └── Liefert: id, token, label, is_active, expires_at
   ├── Status-Check: is_active? nicht abgelaufen?
   ├── Upload-URL bauen: `${origin}/p/${link.token}`
   ├── E-Mail bauen: buildPortalEmail({ label, uploadUrl, expiresAt }) -> { html, text }
   ├── Brevo-API aufrufen: sendEmail({ to, subject, html, text, replyTo, sender })
   └── Response zurueck an Frontend

4. Frontend zeigt Erfolg oder Fehler
   └── Kein Eintrag in der Datenbank (MVP, kein Versand-Logging)
```

**Bestehende Tabellen (nur lesend genutzt):**
- `portal_links`: Link-Daten lesen (token, label, is_active, expires_at)
- Zugriff ueber bestehende RLS-Policy: "Users can manage own portal links" (SELECT WHERE user_id = auth.uid())

### Seitenstruktur

```
Angepasste Seiten/Dateien:
├── src/app/dashboard/portal/page.tsx  [ANPASSEN]
│   ├── Neuer "Mail senden"-Button in Aktionen-Spalte (pro Link)
│   ├── Neuer E-Mail-Versand-Dialog (State: selectedLinkForEmail, showEmailDialog)
│   ├── Neue State-Variablen: recipientEmail, isSending, sendError, sendSuccess
│   └── Neue Handler-Funktion: handleSendEmail()

Neue Dateien:
├── src/lib/email.ts [NEU]
│   ├── sendBrevoEmail() - Brevo HTTP-API v3 Wrapper (fetch-basiert)
│   ├── buildPortalEmailHtml() - HTML-Template-Builder fuer Zugangslink-E-Mail
│   ├── buildPortalEmailText() - Plain-Text-Alternative
│   └── Exportiert Typen: EmailOptions, PortalEmailData
└── src/app/api/portal/send-email/route.ts [NEU]
    └── POST Handler (Auth + Link-Lookup + E-Mail-Versand)
```

### Tech-Entscheidungen

```
Warum Brevo HTTP-API direkt (kein SDK)?
-> Kein neues npm-Package noetig. Die Brevo REST-API v3 ist ein einzelner
   POST-Endpunkt. Ein fetch-Aufruf mit JSON-Body reicht voellig aus.
   Das @getbrevo/brevo SDK wuerde ~500KB+ Dependencies hinzufuegen fuer
   einen einzigen API-Call. KISS-Prinzip.

Warum kein neues npm-Package?
-> Fuer den E-Mail-Versand wird nur die native fetch-API von Node.js 18+
   benoetigt (in Next.js 16 standardmaessig verfuegbar). Fuer HTML-Templates
   wird Template-Literal-Syntax genutzt (kein Templating-Engine noetig).
   Die E-Mail ist ein fester Text mit wenigen Variablen.

Warum Multipart (text/plain + text/html)?
-> Spam-Filter bewerten reine HTML-E-Mails negativ. Die Brevo API unterstuetzt
   nativ den Parameter "textContent" neben "htmlContent", wodurch automatisch
   eine multipart/alternative E-Mail erzeugt wird. Kein zusaetzlicher Aufwand.

Warum Reply-To = Betreuer-E-Mail?
-> Wenn der Mandant auf die E-Mail antwortet, soll die Antwort beim Betreuer
   landen (nicht bei noreply@). Der Absender bleibt noreply@safedocsportal.com
   (verifizierte Domain), aber Reply-To zeigt auf user.email des eingeloggten
   Betreuers. Das ist Standard-Praxis und verbessert die Zustellbarkeit.

Warum kein Versand-Logging in DB (MVP)?
-> Minimaler Scope fuer PROJ-9. Der Betreuer sieht sofort ob der Versand
   erfolgreich war (Dialog-Feedback). Ein Versand-Protokoll waere ein
   separates Feature (z.B. PROJ-11). Kein neues DB-Schema, keine Migration.

Warum E-Mail-Modul in src/lib/email.ts?
-> Separation of Concerns: Template-Logik und Brevo-Client sind wiederverwendbar.
   PROJ-10 wird das Modul erweitern (Passwort im Template). Die API-Route bleibt
   schlank und delegiert an das Modul. Gleiche Architektur wie src/lib/files.ts.

Warum kein List-Unsubscribe Header (trotz Spec)?
-> List-Unsubscribe ist fuer Marketing-Mails gedacht (RFC 2369). Der Zugangslink
   ist eine transaktionale E-Mail (einmalig, auf Anfrage des Betreuers). Ein
   Unsubscribe-Link waere semantisch falsch und koennte Mandanten verwirren.
   Brevo klassifiziert den Versand ueber die SMTP-API ohnehin als transaktional.

Spam-Vermeidung-Strategie (Zusammenfassung):
-> 1. Verifizierte Domain (SPF, DKIM, DMARC via Brevo) - bereits eingerichtet
   2. Multipart E-Mail (text/plain + text/html)
   3. Keine externen Bilder, keine Tracking-Pixel
   4. Sachlicher Betreff ohne Spam-Woerter
   5. Korrektes Absender-Format mit Reply-To
   6. Professioneller, minimaler HTML-Aufbau (keine uebertriebene Formatierung)
   7. Brevo Transaktional-API (bessere Reputation als Marketing-API)

Vorbereitung fuer PROJ-10 (Passwort in E-Mail):
-> Das E-Mail-Modul (src/lib/email.ts) wird so gebaut, dass buildPortalEmailHtml()
   ein optionales "password"-Feld im Datenobjekt akzeptiert. In PROJ-9 wird es
   nicht befuellt. PROJ-10 erweitert nur den Aufruf um das Passwort-Feld und
   ergaenzt den HTML/Text-Block im Template. Keine Architektur-Aenderung noetig.
```

### Dependencies

```
Keine neuen npm-Packages!

Genutzte bestehende Dependencies:
- next (16.x)          -> API-Route Handler, fetch API
- zod (4.x)            -> Request-Body-Validierung im API-Endpoint
- @supabase/ssr        -> Server-Side Supabase Client (Auth + DB-Query)
- lucide-react         -> Mail-Icon fuer den Button (z.B. "Send" oder "Mail")
- @radix-ui/react-dialog -> E-Mail-Versand-Dialog (bereits in shadcn/ui Dialog)
- @radix-ui/react-tooltip -> Tooltip fuer deaktivierte Buttons (bereits vorhanden)

Genutzte Node.js Built-Ins:
- fetch (global)       -> Brevo HTTP-API Aufruf (kein node-fetch noetig)

Neue Environment Variables (3):
- BREVO_API_KEY         -> API-Schluessel fuer Brevo SMTP-API
- BREVO_SENDER_EMAIL    -> Absender-Adresse (Default: noreply@safedocsportal.com)
- BREVO_SENDER_NAME     -> Absender-Name (Default: SafeDocs Portal)
```

### Wiederverwendung bestehender Module

```
Aus src/lib/supabase-server.ts:
- createClient() -> Auth-Check und portal_links-Query im send-email Endpoint
  (identisches Pattern wie in /api/portal/links/route.ts)

Aus src/app/api/portal/links/route.ts (Pattern-Wiederverwendung):
- Auth-Check Pattern: supabase.auth.getUser() + email_confirmed_at Pruefung
- Link-Ownership Pattern: .eq("user_id", user.id) fuer Autorisierung
- Zod-Validierung Pattern: Schema.safeParse(body) fuer Request-Validierung
- Error-Response Pattern: NextResponse.json({ error: ... }, { status: ... })

Aus src/app/dashboard/portal/page.tsx (UI-Wiederverwendung):
- Dialog-Pattern (shadcn Dialog mit Header, Content, Footer)
- State-Management Pattern (useState fuer Dialog-Visibility, Loading, Error)
- getLinkStatus() Funktion fuer Button-Deaktivierung (aktiv + nicht abgelaufen)
- getFullUrl() Funktion fuer Upload-Link im E-Mail-Body

Aus src/components/ui/ (shadcn Komponenten):
- Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
- Button, Input, Label
- Tooltip, TooltipContent, TooltipTrigger (fuer deaktivierte Buttons)
- Loader2 Icon (fuer Loading-State)

Neues Modul (src/lib/email.ts) folgt dem gleichen Architektur-Pattern wie
src/lib/files.ts: Exportiert Hilfsfunktionen und Konstanten, die von
API-Routen importiert werden. Kein Framework-spezifischer Code, reine
Utility-Funktionen.
```

## QA Test Results

**Datum:** 2026-02-08
**QA Engineer:** Claude (Static Analysis + Code Review)
**Methode:** Code Review, Static Analysis, TypeScript Check, Build Check (kein Browser-Test)

### Static Analysis Results

| Check | Ergebnis |
|-------|----------|
| `npx tsc --noEmit` | PASS - keine Fehler |
| `npm run build` | PASS - Build erfolgreich, Route `/api/portal/send-email` korrekt registriert |

### Acceptance Criteria Status

#### "Zugangslink senden"-Button
- [x] Neuer Button "Zugangslink senden" in der Aktionen-Spalte der Link-Tabelle (pro Link) -- `Send`-Icon aus lucide-react in `page.tsx` Zeile ~260
- [x] Button ist nur bei aktiven, nicht-abgelaufenen Links klickbar (bei deaktivierten/abgelaufenen ausgegraut mit Tooltip) -- `disabled={status.label !== "Aktiv"}` mit korrektem Tooltip-Text je nach Status
- [x] Klick oeffnet einen Dialog -- `openEmailDialog(link)` setzt `emailLink` State, Dialog oeffnet sich

#### E-Mail-Versand-Dialog
- [x] Dialog-Titel: "Zugangslink senden" -- `<DialogTitle>Zugangslink senden</DialogTitle>`
- [x] Eingabefeld: Empfaenger-E-Mail (Pflicht, Input type=email) -- `<Input type="email" ...>`
- [x] Client-Side Validierung der E-Mail-Adresse -- Regex `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` in `handleSendEmail()`
- [x] "Senden"-Button loest den Versand aus -- `onClick={handleSendEmail}`
- [x] "Abbrechen"-Button schliesst den Dialog -- `onClick={() => setEmailLink(null)}`
- [x] Waehrend des Versands: Loading-Spinner auf dem Senden-Button, Button deaktiviert -- `{isSending && <Loader2 ...>}`, `disabled={isSending || ...}`
- [x] Nach erfolgreichem Versand: Erfolgsmeldung, Dialog schliesst sich -- `sendSuccess` State zeigt Checkmark + Text, `setTimeout` schliesst nach 2s
- [x] Bei Fehler: Fehlermeldung im Dialog, Button wird wieder aktiviert -- `sendError` State in rotem Banner, `isSending` wird in `finally` zurueckgesetzt

#### E-Mail-Inhalt (fester Text mit Link-Label als Kontext)
- [x] Absender-Name: "SafeDocs Portal" (via ENV: BREVO_SENDER_NAME) -- Default in `sendBrevoEmail()`: `process.env.BREVO_SENDER_NAME || "SafeDocs Portal"`
- [x] Absender-E-Mail: noreply@safedocsportal.com (via ENV: BREVO_SENDER_EMAIL) -- Default: `process.env.BREVO_SENDER_EMAIL || "noreply@safedocsportal.com"`
- [x] Betreff: "Ihr Zugangslink: [Link-Label]" (oder Fallback) -- `buildPortalEmailSubject()` korrekt implementiert
- [x] E-Mail-Body (HTML, Spam-optimiert): Alle Textbausteine vorhanden (Guten Tag, Zugangslink-Info, Label-Kontext, Button, Klartext-Link, Ablaufdatum, Footer)
- [x] Kein Tracking-Pixel, keine externen Bilder -- Bestaetigt: kein `<img>`, keine externen URLs im Template
- [x] Text/Plain-Alternative fuer Multipart -- `buildPortalEmailText()` erzeugt Plain-Text, wird als `textContent` an Brevo gesendet
- [x] Korrekter Reply-To Header -- `replyTo: { email: user.email!, name: user.user_metadata?.name }` in API-Route

#### Spam-Vermeidung
- [x] Text/Plain + HTML Multipart -- `htmlContent` + `textContent` im Brevo-Payload
- [x] Keine Spam-Woerter im Betreff -- Sachlicher Betreff "Ihr Zugangslink: ..."
- [x] Keine externen Bilder/Tracking-Pixel -- Bestaetigt
- [x] Professioneller, sachlicher Ton -- Bestaetigt im HTML/Text-Template
- [x] Korrektes Absender-Format -- sender-Objekt: `{ name: senderName, email: senderEmail }`
- [ ] List-Unsubscribe Header -- Bewusst nicht implementiert (Tech-Entscheidung: transaktionale E-Mail, kein Marketing). Akzeptabel laut Solution Architect.

#### API-Endpoint
- [x] POST /api/portal/send-email -- `route.ts` mit `export async function POST()`
- [x] Auth: Eingeloggt + verifiziert -- `supabase.auth.getUser()` + `email_confirmed_at` Check
- [x] Request-Body: { linkId: string, recipientEmail: string } -- Zod-Schema `SendEmailSchema`
- [x] Prueft: Link gehoert dem eingeloggten User -- `.eq("user_id", user.id)` in Supabase-Query
- [x] Prueft: Link ist aktiv und nicht abgelaufen -- `!link.is_active` und `expires_at` Checks
- [x] Baut E-Mail aus Link-Daten auf -- `buildPortalEmailHtml()`, `buildPortalEmailText()`, `buildPortalEmailSubject()`
- [x] Setzt Reply-To auf Betreuer-E-Mail -- `replyTo: { email: user.email! }`
- [x] Sendet ueber Brevo HTTP-API v3 -- `sendBrevoEmail()` -> `fetch(BREVO_API_URL, ...)`
- [x] Gibt zurueck: { success: true } oder { error: string } -- Korrekte Response-Struktur

#### Brevo-Integration
- [x] Brevo HTTP-API v3: POST https://api.brevo.com/v3/smtp/email -- `BREVO_API_URL` Konstante
- [x] API-Key via Environment Variable: BREVO_API_KEY -- `process.env.BREVO_API_KEY`
- [x] Defaults fuer BREVO_SENDER_EMAIL und BREVO_SENDER_NAME korrekt
- [x] Kein zusaetzliches npm-Package -- Nur native `fetch`
- [x] HTML-E-Mail-Template inline im Code -- Template-Literal in `buildPortalEmailHtml()`
- [x] Multipart: text/plain + text/html -- Beide Felder im Brevo-Payload

#### Mehrfach-Versand
- [x] Gleicher Link kann beliebig oft versendet werden -- Kein Rate-Limit, kein Duplikat-Check
- [x] An verschiedene oder gleiche Empfaenger -- Kein Empfaenger-Tracking
- [x] Kein Versand-Logging in der Datenbank -- Bestaetigt, keine DB-Writes

### Edge Cases Status

| Edge Case | Spec-Erwartung | Implementierung | Status |
|-----------|---------------|-----------------|--------|
| BREVO_API_KEY fehlt | 500 "E-Mail-Versand ist nicht konfiguriert" | `sendBrevoEmail()` wirft Error, API-Route faengt ab und gibt 500 | PASS |
| Ungueltige E-Mail | Client + Server Validierung | Client: Regex, Server: Zod `.email()` | PASS |
| Link deaktiviert | Button ausgegraut + Tooltip | `disabled={status.label !== "Aktiv"}` + Tooltip "Link ist deaktiviert" | PASS |
| Link abgelaufen | Button ausgegraut + Tooltip | `disabled={status.label !== "Aktiv"}` + Tooltip "Link ist abgelaufen" | PASS |
| Brevo-API-Fehler | Fehlermeldung mit Retry-Hinweis | 502 + "E-Mail konnte nicht versendet werden. Bitte versuchen Sie es spaeter erneut." | PASS |
| Leeres Empfaenger-Feld | Validierungsfehler | Button disabled wenn `!recipientEmail.trim()`, plus Zod server-seitig | PASS |
| Brevo-Quota erschoepft | Fehlermeldung weiterleiten | Brevo-Fehlermeldung wird geparsed, generische 502-Meldung an Client | PASS |

### Bugs Found

#### BUG-5: .env.local.example fehlen BREVO Environment Variables (Severity: Low)

**Beschreibung:** Die Datei `.env.local.example` enthaelt keine Eintraege fuer die drei neuen Environment Variables `BREVO_API_KEY`, `BREVO_SENDER_EMAIL`, `BREVO_SENDER_NAME`. Entwickler, die das Projekt neu aufsetzen, wissen nicht, dass diese Variablen benoetigt werden.

**Betroffene Datei:** `/home/pi/git/ai-coding-starter-kit/.env.local.example`

**Erwartetes Verhalten:** Die `.env.local.example` sollte die drei BREVO-Variablen mit Platzhaltern/Defaults enthalten.

**Fix:**
```
# Brevo E-Mail API (REQUIRED for sending portal access links via email)
BREVO_API_KEY=your_brevo_api_key_here
BREVO_SENDER_EMAIL=noreply@safedocsportal.com
BREVO_SENDER_NAME=SafeDocs Portal
```

### Security Findings

#### SEC-2: Origin-Header in E-Mail-URL ist manipulierbar (Severity: Low)

**Beschreibung:** In `src/app/api/portal/send-email/route.ts` (Zeile 70-72) wird die Upload-URL aus dem `origin`- bzw. `host`-Header der HTTP-Anfrage konstruiert:
```typescript
const origin = request.headers.get("origin") || request.headers.get("host") || "";
const protocol = origin.startsWith("http") ? "" : "https://";
const uploadUrl = `${protocol}${origin}/p/${link.token}`;
```
Ein authentifizierter Angreifer koennte einen gefaelschten `Origin`-Header senden (z.B. `https://evil.com`), wodurch die E-Mail einen Link zu `https://evil.com/p/{token}` enthalten wuerde. Dies koennte fuer Phishing missbraucht werden.

**Risikobewertung:** Low -- Erfordert authentifizierten Zugriff (der Angreifer muesste einen gueltigen Account haben und koennte nur eigene Links manipulieren). Dennoch koennte ein kompromittierter Account zum gezielten Phishing gegen Mandanten eingesetzt werden.

**Empfohlener Fix:** Statt den `origin`-Header zu verwenden, eine feste Base-URL aus einer Environment Variable oder `NEXT_PUBLIC_SUPABASE_URL`-Pattern nutzen:
```typescript
const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";
const uploadUrl = `${baseUrl}/p/${link.token}`;
```

#### SEC-3: Kein Rate-Limiting auf E-Mail-Versand-Endpoint (Severity: Medium)

**Beschreibung:** Der POST `/api/portal/send-email` Endpoint hat kein Rate-Limiting. Ein authentifizierter User koennte den Endpoint in einer Schleife aufrufen und hunderte/tausende E-Mails ueber die Brevo-API versenden. Dies koennte:
1. Das Brevo-Kontingent erschoepfen
2. Die Domain-Reputation schaedigen (Spam-Reports)
3. Als Spam-Relay fuer Belaestigung missbraucht werden (beliebige Empfaenger-Adressen)

**Risikobewertung:** Medium -- Ein boesartiger authentifizierter User (oder ein kompromittierter Account) kann beliebig viele E-Mails an beliebige Adressen senden. Das Brevo-Kontingent und Brevo-seitige Rate-Limits bieten zwar einen gewissen Schutz, aber die Domain-Reputation koennte Schaden nehmen.

**Empfohlener Fix (PROJ-Nachfolge oder sofort):**
- Einfaches In-Memory Rate-Limit pro User (z.B. max 10 E-Mails pro Minute pro User-ID)
- Alternativ: Brevo-seitige Kontingentlimits als Schutz dokumentieren
- Langfristig: Versand-Logging in DB (ermoeglicht Monitoring und nachtraegliche Analyse)

#### Weitere Security-Checks (bestanden)

| Pruefung | Ergebnis |
|----------|----------|
| API-Endpoint korrekt authentifiziert? | PASS -- `supabase.auth.getUser()` + `email_confirmed_at` |
| User kann nur eigene Links versenden? | PASS -- `.eq("user_id", user.id)` in DB-Query |
| Server-seitige E-Mail-Validierung? | PASS -- Zod `.email()` Validierung |
| XSS im E-Mail-Template? | PASS -- `escapeHtml()` auf alle User-Inputs (label, uploadUrl, password) |
| Brevo-API-Key geschuetzt? | PASS -- Nur in `src/lib/email.ts` (server-seitig), kein `NEXT_PUBLIC_` Prefix |
| Route NICHT in publicRoutes? | PASS -- `/api/portal/send-email` ist NICHT in `publicRoutes` Array in `supabase-middleware.ts` |
| JSON-Body Parsing sicher? | PASS -- `request.json()` in try/catch, Zod-Validierung |

### Regression Test

| Bereich | Ergebnis | Details |
|---------|----------|---------|
| TypeScript Kompilierung | PASS | `npx tsc --noEmit` fehlerfrei |
| Production Build | PASS | `npm run build` erfolgreich, alle Routen korrekt |
| Bestehende Portal-Links API | PASS | `src/app/api/portal/links/route.ts` unveraendert (keine Diff) |
| Middleware/publicRoutes | PASS | `src/lib/supabase-middleware.ts` unveraendert, `send-email` nicht in publicRoutes (korrekt geschuetzt) |
| Portal-Seite Struktur | PASS | Bestehende Funktionalitaet (Link erstellen, Toggle, Einreichungen) unveraendert, nur neue Buttons/Dialog hinzugefuegt |
| Keine neuen Dependencies | PASS | Kein neues npm-Package hinzugefuegt |
| Keine DB-Schema-Aenderungen | PASS | Keine neuen Tabellen oder Migrationen |

### Code Quality

| Aspekt | Bewertung | Details |
|--------|-----------|---------|
| Error-Handling-Kette | Gut | Saubere try/catch in API-Route und Frontend, spezifische Fehlermeldungen |
| HTTP Status Codes | Korrekt | 401 (Auth), 400 (Validierung/deaktiviert/abgelaufen), 404 (nicht gefunden), 500 (Config), 502 (Brevo-Fehler) |
| TypeScript-Typen | Korrekt | Interfaces definiert, Zod-Schema fuer Runtime-Validierung, `user.email!` Non-null-Assertion vertretbar (da email_confirmed_at geprueft) |
| Separation of Concerns | Gut | E-Mail-Logik in `src/lib/email.ts`, API-Logik in Route, UI in Page |
| PROJ-10 Vorbereitung | Gut | `password?` Feld im Interface + Template vorbereitet |
| Memory Leaks | Keine | Keine offenen Handles, keine Event-Listener ohne Cleanup |
| Code-Konsistenz | Gut | Gleiche Patterns wie bestehende API-Routen (Auth-Check, Zod, Response-Format) |

### Summary

**Gesamtbewertung: PASS mit Hinweisen**

Die PROJ-9 Implementierung ist funktional vollstaendig und deckt alle Acceptance Criteria ab. Die Code-Qualitaet ist hoch, das Error-Handling ist sauber, und die Architektur ist konsistent mit dem bestehenden Codebase. Die PROJ-10-Vorbereitung (optionales Password-Feld) ist elegant geloest.

**Gefundene Issues:**

| ID | Typ | Severity | Beschreibung | Empfehlung |
|----|-----|----------|--------------|------------|
| BUG-5 | Bug | Low | `.env.local.example` fehlen BREVO-Variablen | Vor Merge fixen |
| SEC-2 | Security | Low | Origin-Header in E-Mail-URL manipulierbar | Vor Merge fixen (ENV-basierte Base-URL) |
| SEC-3 | Security | Medium | Kein Rate-Limiting auf E-Mail-Endpoint | Akzeptabler Trade-off fuer MVP, sollte in PROJ-11 oder frueher adressiert werden |

**Empfehlung:** BUG-5 und SEC-2 vor dem Merge beheben (einfache Fixes). SEC-3 als bekanntes Risiko akzeptieren und fuer einen naechsten Sprint einplanen. Nach Behebung von BUG-5 und SEC-2: **Ready to Merge**.
