# PROJ-13: Portal-Detail-Seite Redesign

## Status: Planned

## Beschreibung
Die Portal-Detail-Seite (`/dashboard/portal/[linkId]`) wird nach dem Vorbild von demo.safedocsportal.de komplett umgestaltet. Das aktuelle Design zeigt eine einfache Link-Info-Card und darunter eine Einreichungs-Liste (gruppiert nach Einreicher). Das neue Design hat ein zweispaltiges Layout: Links ein Hauptbereich mit Portal-Einstellungen und einer flachen Datei-Liste, rechts eine Sidebar mit Portal-Link, Aktions-Buttons und Statistiken. Die Seite wird dadurch deutlich uebersichtlicher und funktionaler.

## Zielgruppe
- **Primaer:** Eingeloggte User (Steuerberater/Mandanten-Betreuer) - verwalten ein einzelnes Portal und dessen hochgeladene Dateien

## Abhaengigkeiten
- Benoetigt: PROJ-8 (Mandanten-Upload-Portal) - Portal-Links, Einreichungen, Dateien
- Benoetigt: PROJ-10 (Portal-Passwortschutz) - Passwort-Verwaltung im Portal
- Benoetigt: PROJ-12 (Dashboard-Redesign) - Sidebar-Layout, kein eigener Header noetig
- Optional: PROJ-9 (E-Mail-Versand) - "Zugangsdaten senden" Button

## Ist-Zustand (aktuell)

Die aktuelle Seite `/dashboard/portal/[linkId]/page.tsx` hat folgendes Layout:
1. **Zurueck-Link** zur Portal-Uebersicht
2. **Link-Info-Card** (einspaltig, volle Breite):
   - Label als Titel + Status-Badge
   - Erstellt am / Ablaufdatum
   - Kopierbarer Link mit Input-Feld
   - Passwortschutz-Bereich (wenn Passwort vorhanden): Fehlversuche-Anzeige, "Neues Passwort"-Button
   - Anzahl Einreichungen als Text
3. **Einreichungs-Liste** (einspaltig, volle Breite):
   - Pro Einreichung eine aufklappbare Card
   - Header: Name, E-Mail, Datum, Datei-Anzahl
   - Aufgeklappt: Notiz + Datei-Liste mit Download-Buttons
4. **Passwort-Regenerierungs-Dialog** (Modal)

### Defizite des Ist-Zustands
- Kein Weg, Portal-Name oder Beschreibung zu aendern
- Kein Weg, das Portal zu loeschen
- Kein Weg, das Portal zu (de)aktivieren (nur ueber Portal-Uebersicht moeglich)
- Kein Weg, ein neues Passwort direkt zu setzen (nur automatische Generierung)
- Dateien sind nach Einreichung gruppiert (umstaendlich, wenn man alle Dateien durchsehen will)
- Kein "Alle herunterladen"-Button
- Keine Moeglichkeit, einzelne Dateien zu loeschen
- Keine Statistiken-Uebersicht (Status, Upload-Anzahl, Erstellt-Datum, etc.)
- Kein direkter "Zugangsdaten senden"-Button auf dieser Seite
- Kein "Portal oeffnen"-Button fuer Vorschau

## Soll-Zustand (nach Redesign)

### Zweispaltiges Layout

**Linke Seite (Hauptbereich, ca. 2/3 der Breite):**

1. **Portal-Einstellungen Card**
2. **Uploads-Section mit flacher Datei-Liste**

**Rechte Seite (Sidebar, ca. 1/3 der Breite):**

3. **Portal-Link Card**
4. **Statistiken Card**

Auf mobilen Geraeten werden die Spalten untereinander gestapelt (responsive).

## User Stories

### Portal-Einstellungen bearbeiten
- Als Steuerberater moechte ich den Namen eines Portals nachtraeglich aendern koennen, damit ich Portale besser organisieren kann (z.B. nach Mandanten-Wechsel oder Tippfehler-Korrektur)
- Als Steuerberater moechte ich eine optionale Beschreibung fuer ein Portal hinterlegen koennen, um mir zusaetzliche Notizen zu einem Mandanten zu merken
- Als Steuerberater moechte ich ein Portal direkt auf der Detail-Seite aktivieren oder deaktivieren koennen, ohne zur Uebersicht zurueckzukehren
- Als Steuerberater moechte ich ein Portal-Passwort manuell setzen koennen (statt nur automatisch generieren), damit ich ein einfach zu kommunizierendes Passwort waehlen kann
- Als Steuerberater moechte ich ein Portal loeschen koennen, wenn es nicht mehr benoetigt wird

### Dateien verwalten
- Als Steuerberater moechte ich alle hochgeladenen Dateien eines Portals in einer flachen, chronologischen Liste sehen, um schnell einen Ueberblick zu bekommen
- Als Steuerberater moechte ich bei jeder Datei sehen, von wem sie hochgeladen wurde ("von Max Mueller"), wann und wie gross sie ist
- Als Steuerberater moechte ich einzelne Dateien direkt herunterladen koennen
- Als Steuerberater moechte ich alle Dateien eines Portals auf einmal herunterladen koennen, um sie lokal zu archivieren
- Als Steuerberater moechte ich einzelne Dateien loeschen koennen, die nicht mehr benoetigt werden oder versehentlich hochgeladen wurden
- Als Steuerberater moechte ich mehrere Dateien gleichzeitig auswaehlen und loeschen koennen

### Portal-Link und Aktionen
- Als Steuerberater moechte ich den Portal-Link jederzeit kopieren koennen
- Als Steuerberater moechte ich den Portal-Link im Browser oeffnen koennen, um zu pruefen wie er fuer den Mandanten aussieht
- Als Steuerberater moechte ich direkt auf der Portal-Detail-Seite die Zugangsdaten (Link + Passwort) per E-Mail an den Mandanten senden koennen

### Statistiken
- Als Steuerberater moechte ich auf einen Blick den Status meines Portals sehen (Aktiv/Deaktiviert/Gesperrt)
- Als Steuerberater moechte ich die Gesamtzahl der hochgeladenen Dateien sehen
- Als Steuerberater moechte ich das Erstellungsdatum des Portals sehen

## Acceptance Criteria

### AC-1: Zweispaltiges Layout
- [ ] Die Seite nutzt ein zweispaltiges Grid-Layout (Hauptbereich + Sidebar)
- [ ] Auf Desktop: Hauptbereich ca. 2/3, Sidebar ca. 1/3 (z.B. `grid-cols-1 lg:grid-cols-3` mit `lg:col-span-2` + `lg:col-span-1`)
- [ ] Auf Mobile (< lg Breakpoint): Einspaltig, Sidebar-Cards unter dem Hauptbereich
- [ ] Zurueck-Link zur Portal-Uebersicht bleibt erhalten (oberhalb des Grids)

### AC-2: Portal-Einstellungen Card (Hauptbereich, oben)
- [ ] Card mit Titel "Portal-Einstellungen"
- [ ] Eingabefeld "Name" (editierbar, vorausgefuellt mit aktuellem Label)
- [ ] Eingabefeld "Beschreibung" (editierbar, Textarea, optional) -- HINWEIS: Neues DB-Feld `description` in portal_links noetig
- [ ] Eingabefeld "Neues Passwort" (optional, Typ password mit Augen-Icon zum Anzeigen/Verbergen)
   - Platzhalter: "Leer lassen um beizubehalten"
   - Wenn ausgefuellt: Passwort wird beim Speichern aktualisiert (gehasht)
   - Wenn leer: Bestehendes Passwort bleibt unveraendert
- [ ] Checkbox "Portal aktiv" (Toggle fuer is_active)
- [ ] Button "Speichern" (primaer/blau) - speichert alle Aenderungen auf einmal
- [ ] Button "Loeschen" (destructive/rot) - oeffnet Bestaetigungs-Dialog vor dem Loeschen
- [ ] Erfolgs-Feedback nach dem Speichern (z.B. kurze Toast-Nachricht oder gruener Haken)
- [ ] Validierung: Name darf nicht leer sein, Passwort min. 8 Zeichen wenn angegeben

### AC-3: Uploads-Section (Hauptbereich, unten)
- [ ] Ueberschrift "Uploads (X)" mit Anzahl der Dateien und Untertitel "Hochgeladene Dateien in diesem Portal"
- [ ] Button "Alle herunterladen" (laed alle Dateien als ZIP oder sequenziell herunter)
- [ ] Checkbox "Alle auswaehlen" in der Kopfzeile (Toggle fuer alle Dateien)
- [ ] Wenn Dateien ausgewaehlt: "Ausgewaehlte loeschen" Button erscheint (destructive)
- [ ] Flache Datei-Liste (NICHT nach Einreichung gruppiert), chronologisch sortiert (neueste oben)
- [ ] Pro Datei-Zeile:
   - Checkbox (fuer Mehrfachauswahl)
   - Dateiname (ggf. truncated)
   - Dateigroesse (formatiert, z.B. "2.1 MB")
   - Datum und Uhrzeit des Uploads
   - Hochgeladen von "[Name]" (Name des Einreichers)
   - Download-Button (Icon)
   - Loeschen-Button (Icon, rot/destructive)
- [ ] Leerer Zustand: "Noch keine Dateien hochgeladen" mit passendem Icon
- [ ] Loeschen einer Datei: Bestaetigungs-Dialog ("Datei unwiderruflich loeschen?")
- [ ] Loeschen mehrerer Dateien: Bestaetigungs-Dialog ("X Dateien unwiderruflich loeschen?")

### AC-4: Portal-Link Card (Sidebar, oben)
- [ ] Card mit Portal-Link als kopierbares Feld
- [ ] Button "Kopieren" - kopiert Link in die Zwischenablage (mit visueller Bestaetigung)
- [ ] Button "Oeffnen" - oeffnet den Portal-Link in einem neuen Tab
- [ ] Button "Zugangsdaten senden" (prominent, gruen) - oeffnet E-Mail-Versand-Dialog
   - Dialog wie auf der Portal-Uebersicht: E-Mail-Adresse eingeben, Passwort wird regeneriert und mitgesendet
   - Button nur aktiv wenn Portal aktiv ist
   - Nur sichtbar wenn PROJ-9 (E-Mail-Versand) konfiguriert ist, sonst ausblenden

### AC-5: Statistiken Card (Sidebar, unten)
- [ ] Card mit Titel "Statistiken" oder "Details"
- [ ] Status-Anzeige: Badge mit "Aktiv" (gruen), "Deaktiviert" (grau) oder "Gesperrt" (rot)
- [ ] Uploads: Gesamtanzahl der hochgeladenen Dateien
- [ ] Erstellt: Erstellungsdatum des Portals (formatiert, z.B. "29.01.2026")
- [ ] Info-Text zu Dateigroesse und erlaubten Typen als statische Information:
   - "Max. Dateigroesse: 10 MB"
   - "Erlaubte Typen: PDF, DOC, DOCX, XLS, XLSX, JPG, JPEG, PNG, GIF, WebP"
   - Diese Werte kommen aus den globalen Konstanten in `src/lib/files.ts`

### AC-6: Portal loeschen
- [ ] Button "Loeschen" in der Portal-Einstellungen Card
- [ ] Klick oeffnet AlertDialog mit Warnung: "Portal unwiderruflich loeschen? Alle Einreichungen und Dateien werden geloescht."
- [ ] Bestaetigung loescht: portal_submissions (CASCADE), Blob-Dateien, portal_links Eintrag
- [ ] Nach Loeschung: Weiterleitung zur Portal-Uebersicht (`/dashboard/portal`)
- [ ] Neuer API-Endpoint: DELETE /api/portal/links (oder POST mit action=delete)

### AC-7: Einzelne Datei loeschen
- [ ] Loeschen-Icon (rot) pro Datei-Zeile
- [ ] Klick oeffnet Bestaetigungs-Dialog
- [ ] Loescht die Datei aus Vercel Blob
- [ ] Aktualisiert file_count in portal_submissions
- [ ] Wenn letzte Datei einer Einreichung geloescht: Einreichung bleibt bestehen (mit file_count=0)
- [ ] Neuer API-Endpoint: DELETE /api/portal/files (submissionId + filename)

### AC-8: Alle Dateien herunterladen
- [ ] Button "Alle herunterladen" oberhalb der Datei-Liste
- [ ] Laedt alle Dateien des Portals herunter
- [ ] Bevorzugt: Serverseitiges ZIP-Erstellen und als einzelne Datei liefern
- [ ] Alternativ (falls ZIP zu aufwaendig): Sequenzieller Download aller Dateien
- [ ] Button deaktiviert wenn keine Dateien vorhanden
- [ ] Neuer API-Endpoint: GET /api/portal/download-all?linkId=xxx (liefert ZIP)

### AC-9: Mehrfachauswahl und Batch-Loeschen
- [ ] Checkbox pro Datei-Zeile
- [ ] "Alle auswaehlen" Checkbox in der Kopfzeile
- [ ] Wenn mindestens eine Datei ausgewaehlt: "Ausgewaehlte loeschen" Button erscheint
- [ ] Batch-Loeschen: Bestaetigungs-Dialog, dann alle ausgewaehlten Dateien loeschen
- [ ] State-Management: Set von ausgewaehlten Datei-IDs (submissionId + filename als Key)

### AC-10: Portal-Einstellungen speichern (API)
- [ ] PATCH /api/portal/links erweitern (oder neuer Endpoint)
- [ ] Akzeptiert: label, description, is_active, password (optional)
- [ ] Wenn password angegeben und nicht leer: Neuen Hash erstellen, failed_attempts=0, is_locked=false
- [ ] Wenn password leer oder nicht angegeben: Passwort unveraendert lassen
- [ ] Validierung: label nicht leer, password min. 8 Zeichen wenn angegeben
- [ ] Nur der Owner kann seine Portale aendern

### AC-11: Beschreibung-Feld (Neues DB-Feld)
- [ ] Neue Spalte `description TEXT DEFAULT ''` in portal_links
- [ ] Migration oder manuelles ALTER TABLE in Supabase
- [ ] GET /api/portal/submissions muss `description` im Link-Objekt zurueckgeben
- [ ] GET /api/portal/links muss `description` im Mapping einschliessen
- [ ] Maximal 500 Zeichen

## Edge Cases

### Portal-Einstellungen
- Was passiert wenn der Name leer gelassen wird? -> Validierungsfehler, Speichern wird verhindert
- Was passiert wenn das Passwort-Feld weniger als 8 Zeichen enthaelt? -> Validierungsfehler, Hinweis "Mindestens 8 Zeichen"
- Was passiert wenn das Passwort-Feld leer ist? -> Bestehendes Passwort bleibt unveraendert (kein Update)
- Was passiert wenn ein gesperrtes Portal entsperrt werden soll? -> "Portal aktiv" Checkbox aktivieren + optionales neues Passwort setzen. Beim Speichern: is_active=true, und wenn Passwort gesetzt: is_locked=false, failed_attempts=0
- Was passiert wenn Portal-Einstellungen gespeichert werden waehrend ein Mandant gerade hochlaedt? -> Kein Problem, Upload laeuft ueber Session-Token der unabhaengig ist

### Dateien loeschen
- Was passiert wenn die letzte Datei einer Einreichung geloescht wird? -> Einreichung bleibt mit file_count=0 bestehen. Einreichung wird weiterhin in der Datenbank gefuehrt (Name, E-Mail, Datum bleiben erhalten)
- Was passiert wenn eine Datei beim Loeschen nicht im Blob-Storage gefunden wird? -> Fehlermeldung "Datei konnte nicht geloescht werden" oder still ignorieren (idempotent)
- Was passiert wenn waehrend eines Batch-Loeschen einige Dateien fehlschlagen? -> Erfolgreich geloeschte Dateien werden aus der Liste entfernt, fehlgeschlagene bleiben mit Fehlermeldung
- Was passiert wenn ein anderer Tab die gleiche Datei gleichzeitig loescht? -> Idempotentes Verhalten, kein Fehler

### Portal loeschen
- Was passiert wenn ein Portal mit Dateien geloescht wird? -> Alle Blob-Dateien unter `portal/{linkId}/` muessen ebenfalls geloescht werden (nicht nur DB-Eintraege)
- Was passiert wenn das Loeschen der Blob-Dateien fehlschlaegt? -> DB-Loeschung trotzdem durchfuehren, verwaiste Blob-Dateien als akzeptabel ansehen (kein Datenleck, da Download-Endpoint den Link prueft)
- Was passiert wenn das Portal gerade fuer einen Upload genutzt wird? -> Upload schlaegt fehl (Link nicht mehr vorhanden), Mandant sieht Fehlermeldung

### Alle herunterladen
- Was passiert bei sehr vielen Dateien (z.B. 100+ Dateien)? -> ZIP-Erstellung koennte lange dauern. Ladeindikator anzeigen. Bei Timeout: Fallback-Fehlermeldung
- Was passiert wenn keine Dateien vorhanden sind? -> Button ist deaktiviert
- Was passiert wenn einzelne Dateien im Blob-Storage fehlen? -> Fehlende Dateien ueberspringen, ZIP mit vorhandenen Dateien ausliefern

### Allgemein
- Was passiert auf kleinen Bildschirmen? -> Zweispaltiges Layout wird einspaltig (Sidebar unter Hauptbereich)
- Was passiert wenn die API beim Laden fehlschlaegt? -> Fehlermeldung wie bisher
- Was passiert wenn die Seite mit einem ungueltigen linkId aufgerufen wird? -> 404-Fehlermeldung

## Technische Anforderungen

### Neue Datenbank-Spalte
- `description TEXT DEFAULT ''` in portal_links (ALTER TABLE oder Migration)
- Maximal 500 Zeichen (Validierung im API-Endpoint)

### Neue API-Endpoints
- **DELETE /api/portal/links** (oder PATCH mit delete-Flag): Portal komplett loeschen inkl. Blob-Cleanup
- **DELETE /api/portal/files**: Einzelne Datei aus Vercel Blob loeschen (Parameter: submissionId, filename)
- **GET /api/portal/download-all**: Alle Dateien eines Portals als ZIP (Parameter: linkId)

### Angepasste API-Endpoints
- **PATCH /api/portal/links**: Erweitern um label, description, is_active, optionales password
- **GET /api/portal/submissions**: Link-Objekt um description erweitern
- **GET /api/portal/links**: Mapping um description erweitern

### Neue Abhaengigkeiten
- `archiver` oder `jszip` npm-Package fuer ZIP-Erstellung (fuer "Alle herunterladen")
- Alternativ: Kein neues Package, sequenzieller Einzeldownload als Fallback

### Frontend
- Kompletter Umbau von `src/app/dashboard/portal/[linkId]/page.tsx`
- Neue Sub-Komponenten empfohlen (PortalSettings, PortalFileList, PortalLinkCard, PortalStatsCard) um die Datei uebersichtlich zu halten
- Bestehende Imports aus shadcn/ui: Card, Button, Input, Label, Checkbox, Badge, Dialog, Textarea, Separator
- Neue shadcn/ui Komponenten (falls nicht vorhanden): Switch oder Checkbox fuer "Portal aktiv", AlertDialog fuer Loeschen-Bestaetigung
- Lucide Icons: Download, Trash2, Copy, ExternalLink, Eye, EyeOff, Send, Check, Loader2

### Datenstruktur-Aenderung im Frontend
- Aktuelle Struktur: Dateien sind nach Einreichung (Submission) gruppiert
- Neue Struktur: Flache Datei-Liste ueber alle Einreichungen hinweg
- Jede Datei braucht zusaetzlich: `submitterName` (Name des Einreichers), `submissionId` (fuer Download/Delete), `uploadedAt` (created_at der Submission)
- Die API liefert weiterhin Submissions mit Files (keine Aenderung am API-Response), das Frontend flacht die Daten-Struktur fuer die Anzeige ab

## Zukunftige Enhancements (nicht Teil von PROJ-13)

### Max. Dateigroesse pro Portal konfigurierbar
- Im Screenshot sichtbar als "Max. Dateigroesse: 100 MB" in den Statistiken
- Aktuell: Global auf 10 MB festgelegt in `src/lib/files.ts` (MAX_FILE_SIZE)
- Wuerde neues DB-Feld `max_file_size` in portal_links erfordern
- Upload-Endpoint muesste pro-Portal-Limit pruefen statt globales Limit
- PROJ-13 zeigt den statischen Wert "10 MB" in der Statistiken-Card an

### Erlaubte Dateitypen pro Portal konfigurierbar
- Im Screenshot sichtbar als "Erlaubte Typen: pdf, doc, docx, xls, xlsx, png, jpg, jpeg"
- Aktuell: Global festgelegt in `src/lib/files.ts` (ALLOWED_MIME_TYPES)
- Wuerde neues DB-Feld `allowed_types` (JSON-Array) in portal_links erfordern
- PROJ-13 zeigt die statischen globalen Typen in der Statistiken-Card an

### Dateien AN den Mandanten senden
- Im Screenshot sichtbar als "Dateien senden" Button in der Sidebar
- Funktion: Betreuer kann Dateien an den Mandanten zurueckschicken (bidirektionaler Austausch)
- Erfordert komplett neues Feature (Upload-Richtung umkehren, Mandant braucht Download-Bereich)
- Nicht Teil von PROJ-13

### Ablaufdatum aendern
- Aktuell kann das Ablaufdatum nur beim Erstellen eines Links gesetzt werden
- Koennte in den Portal-Einstellungen als editierbares Feld hinzugefuegt werden
- Nicht im Screenshot sichtbar, daher kein Teil von PROJ-13

## Tech-Design (Solution Architect)

### Bestandsaufnahme: Was existiert bereits?

Bevor wir etwas Neues bauen, habe ich geprueft, welche Bausteine schon vorhanden sind:

**Vorhandene UI-Bausteine (shadcn/ui):**
- Card, Button, Input, Label, Badge, Dialog, Separator, Textarea -- alle vorhanden
- AlertDialog -- vorhanden (fuer Loesch-Bestaetigungen)
- Checkbox -- vorhanden (fuer Mehrfachauswahl)
- Switch -- vorhanden (fuer "Portal aktiv"-Toggle)
- Table -- vorhanden (fuer Datei-Liste)
- Sonner/Toaster -- Package installiert (`sonner`), aber `<Toaster>` noch nicht im Root-Layout eingebunden

**Vorhandene APIs:**
- `GET /api/portal/submissions` -- Laedt Link-Info + Einreichungen mit Dateien (bleibt Haupt-Datenquelle)
- `PATCH /api/portal/links` -- Aktualisiert nur `is_active`. Muss erweitert werden
- `GET /api/portal/download` -- Download einer einzelnen Datei. Bleibt unveraendert
- `POST /api/portal/send-email` -- E-Mail-Versand. Bleibt unveraendert
- `POST /api/portal/regenerate-password` -- Passwort neu generieren. Wird nicht mehr benoetigt (ersetzt durch manuelles Passwort-Setzen im PATCH-Endpoint)

**Vorhandene Datenbank-Tabellen:**
- `portal_links` -- Haupttabelle mit token, label, is_active, password_hash, etc.
- `portal_submissions` -- Einreichungen mit name, email, note, file_count

**Vorhandenes Layout:**
- Dashboard-Layout (`dashboard/layout.tsx`) mit Sidebar + Header -- Auth-Check erfolgt hier, nicht pro Seite
- AppSidebar-Komponente mit Navigation

---

### 1. Component-Struktur (Visual Tree)

So wird die neue Portal-Detail-Seite aufgebaut:

```
Portal-Detail-Seite (/dashboard/portal/[linkId])
│
├── Zurueck-Link ("Zurueck zur Uebersicht")
│
├── Seiten-Titel (Portal-Name als Ueberschrift + Status-Badge)
│
└── Zweispaltiges Grid-Layout
    │
    ├── LINKE SPALTE (Hauptbereich, 2/3 Breite)
    │   │
    │   ├── Portal-Einstellungen Card
    │   │   ├── Eingabefeld "Name"
    │   │   ├── Eingabefeld "Beschreibung" (Textarea, neu)
    │   │   ├── Eingabefeld "Neues Passwort" (mit Auge-Icon zum Anzeigen/Verbergen)
    │   │   ├── Schalter "Portal aktiv" (Switch-Komponente)
    │   │   ├── Button "Speichern" (blau)
    │   │   └── Button "Portal loeschen" (rot)
    │   │
    │   └── Uploads-Section Card
    │       ├── Ueberschrift "Uploads (X)" + "Alle herunterladen"-Button
    │       ├── Kopfzeile mit "Alle auswaehlen"-Checkbox + "Ausgewaehlte loeschen"-Button (nur sichtbar wenn Dateien ausgewaehlt)
    │       └── Datei-Liste (flach, chronologisch, neueste oben)
    │           └── Pro Datei-Zeile:
    │               ├── Checkbox
    │               ├── Dateiname
    │               ├── Dateigroesse ("2.1 MB")
    │               ├── Upload-Datum + Uhrzeit
    │               ├── "von [Name]" (Einreicher)
    │               ├── Download-Button (Icon)
    │               └── Loeschen-Button (Icon, rot)
    │
    └── RECHTE SPALTE (Sidebar, 1/3 Breite)
        │
        ├── Portal-Link Card
        │   ├── Link-Anzeige (kopierbares Feld)
        │   ├── Button "Kopieren"
        │   ├── Button "Oeffnen" (neuer Tab)
        │   └── Button "Zugangsdaten senden" (gruen, oeffnet E-Mail-Dialog)
        │
        └── Statistiken Card
            ├── Status-Badge (Aktiv/Deaktiviert/Gesperrt)
            ├── Anzahl Uploads
            ├── Erstellt am [Datum]
            ├── Max. Dateigroesse: 10 MB (statisch)
            └── Erlaubte Typen: PDF, DOC, ... (statisch)
```

**Auf Mobilgeraeten:** Die rechte Spalte rutscht unter die linke Spalte (einspaltig).

**Sub-Komponenten:** Die Haupt-Seite wird in kleinere, uebersichtliche Teile aufgeteilt:

```
[linkId]/page.tsx (Hauptseite, laedt Daten, koordiniert alles)
├── portal-settings.tsx    (Einstellungen-Card mit Formular)
├── portal-file-list.tsx   (Uploads-Section mit Datei-Tabelle)
├── portal-link-card.tsx   (Link-Anzeige + Kopieren/Oeffnen/Senden)
└── portal-stats-card.tsx  (Statistiken-Anzeige)
```

Diese Sub-Komponenten liegen im selben Ordner wie die Seite (`src/app/dashboard/portal/[linkId]/`), da sie nur fuer diese eine Seite relevant sind.

---

### 2. Daten-Model

**Bestehendes Daten-Model (keine Aenderung):**

Jedes Portal (portal_links) hat:
- Eindeutige ID
- Besitzer (User-ID)
- Token (fuer den oeffentlichen Link)
- Name (Label)
- Aktiv-Status
- Sperr-Status + Fehlversuche
- Passwort (gehasht + gesalzen)
- Ablaufdatum (optional)
- Erstellungsdatum

Jede Einreichung (portal_submissions) hat:
- Eindeutige ID
- Zugehoerige Portal-ID
- Name + E-Mail des Einreichers
- Notiz (optional)
- Datei-Anzahl
- Erstellungsdatum

Dateien liegen im Vercel Blob Storage unter dem Pfad:
`portal/{portal-id}/{einreichungs-id}/{dateiname}`

**Neues Feld:**

Jedes Portal bekommt zusaetzlich:
- **Beschreibung** (optionaler Freitext, maximal 500 Zeichen) -- damit der Steuerberater sich Notizen zum Portal machen kann

---

### 3. API-Aenderungen

#### A) Bestehender Endpoint wird erweitert: "Portal aktualisieren"

**Aktuell:** `PATCH /api/portal/links` akzeptiert nur `id` und `is_active`.

**Neu:** Akzeptiert zusaetzlich:
- `label` (neuer Name)
- `description` (neue Beschreibung)
- `password` (optional -- wenn ausgefuellt, wird ein neuer Passwort-Hash erstellt und die Sperre zurueckgesetzt)

So kann der Steuerberater alle Einstellungen auf einmal speichern statt fuer jede Aenderung einen anderen Endpoint aufrufen zu muessen.

**Wichtig:** Der Endpoint muss den Admin-Client (Service-Role) nutzen, wenn ein Passwort gesetzt wird -- genau wie der bisherige `regenerate-password`-Endpoint das bereits tut.

#### B) Neuer Endpoint: "Portal loeschen"

**`DELETE /api/portal/links?id=xxx`**

Was passiert beim Loeschen:
1. Alle Dateien im Blob-Storage unter `portal/{portal-id}/` werden geloescht
2. Die Einreichungen werden automatisch mitgeloescht (Datenbank-Kaskade: `ON DELETE CASCADE`)
3. Der Portal-Link-Eintrag selbst wird geloescht
4. Weiterleitung zur Portal-Uebersicht

#### C) Neuer Endpoint: "Einzelne Datei loeschen"

**`DELETE /api/portal/files?submissionId=xxx&filename=yyy`**

Was passiert:
1. Prueft, dass die Einreichung zum eingeloggten Benutzer gehoert
2. Loescht die Datei aus dem Blob-Storage
3. Reduziert den Datei-Zaehler (`file_count`) der Einreichung um 1

#### D) Neuer Endpoint: "Alle Dateien als ZIP herunterladen"

**`GET /api/portal/download-all?linkId=xxx`**

Was passiert:
1. Prueft, dass das Portal zum eingeloggten Benutzer gehoert
2. Sammelt alle Dateien aller Einreichungen dieses Portals
3. Erstellt ein ZIP-Archiv mit allen Dateien
4. Liefert das ZIP zum Download aus (Dateiname: `{portal-name}-dateien.zip`)

Dateien im ZIP werden in einem flachen Verzeichnis abgelegt. Bei Namenskonflikten (zwei Dateien gleicher Name von verschiedenen Einreichern) wird der Einreicher-Name als Praefix angefuegt.

#### E) Bestehender Endpoint wird erweitert: "Einreichungen laden"

**`GET /api/portal/submissions`** -- Das Link-Objekt in der Antwort wird um das neue Feld `description` erweitert.

#### F) Bestehender Endpoint bleibt unveraendert

- `GET /api/portal/download` -- Einzel-Datei-Download, funktioniert wie bisher
- `POST /api/portal/send-email` -- E-Mail-Versand, funktioniert wie bisher
- `POST /api/portal/regenerate-password` -- Bleibt bestehen fuer Rueckwaertskompatibilitaet, wird aber auf der neuen Detail-Seite nicht mehr aufgerufen (die Passwort-Aenderung laeuft ueber den erweiterten PATCH-Endpoint)

---

### 4. Tech-Entscheidungen (PM-freundlich begruendet)

| Entscheidung | Begruendung |
|---|---|
| **Sub-Komponenten statt eine grosse Datei** | Die aktuelle Detail-Seite ist ~300 Zeilen lang und wird mit dem Redesign deutlich groesser. Aufteilen in 4 kleinere Bausteine macht den Code uebersichtlicher und einfacher wartbar. |
| **Flache Datei-Liste (nicht nach Einreichung gruppiert)** | Der Steuerberater will schnell alle Dateien sehen. Die Gruppierung nach Einreicher ist umstaendlich, wenn man "alle PDFs vom letzten Monat" sucht. Die API liefert weiterhin nach Einreichung gruppiert -- das Frontend "entfaltet" die Daten fuer die Anzeige. |
| **`sonner` fuer Erfolgs-Meldungen (Toast)** | Das Package ist bereits installiert, aber der `<Toaster>` muss noch im Root-Layout eingebunden werden. Toasts sind ideal fuer kurze Bestaetigungen wie "Einstellungen gespeichert" -- sie verschwinden automatisch nach ein paar Sekunden. |
| **AlertDialog fuer Loesch-Bestaetigungen** | Bereits vorhanden als shadcn/ui-Komponente. Verhindert versehentliches Loeschen durch einen zweiten Klick. |
| **Switch-Komponente fuer "Portal aktiv"** | Visuell klarer als eine Checkbox -- der Schalter zeigt sofort, ob etwas an oder aus ist. Komponente ist bereits vorhanden. |
| **ZIP-Erstellung mit `archiver`** | Bewaehrtes Node.js-Package fuer serverseitige ZIP-Erstellung. Wird als Stream verarbeitet, was auch bei vielen Dateien speichereffizient ist. |
| **Passwort-Feld im Einstellungs-Formular statt separater Dialog** | Einfacher fuer den Benutzer: Alles an einem Ort. Wenn das Feld leer bleibt, aendert sich nichts. Kein extra Klick auf "Neues Passwort". |
| **Blob-Dateien per `del()` aus Vercel Blob loeschen** | Vercel Blob bietet eine `del()`-Funktion zum Loeschen. Einfach und zuverlaessig. |
| **Admin-Client (Service-Role) fuer Loesch-Operationen** | Die bestehende RLS-Policy erlaubt authentifizierten Benutzern kein DELETE auf `portal_submissions`. Statt neue RLS-Policies zu erstellen, nutzen wir den Admin-Client (wie bereits bei der Passwort-Regenerierung). Das ist sicherer, weil die Zugriffspruefung im API-Code stattfindet. |

---

### 5. Dependencies (neue Packages)

| Package | Zweck |
|---|---|
| **`archiver`** | ZIP-Erstellung fuer "Alle herunterladen". Bewaehrtes Package (~30M Downloads/Woche), erzeugt ZIP-Dateien als Stream. |

**Bereits vorhandene Packages, die jetzt zum Einsatz kommen:**
- `sonner` -- Toast-Benachrichtigungen (bereits installiert, muss nur eingebunden werden)
- Alle shadcn/ui-Komponenten (AlertDialog, Switch, Checkbox, etc.) -- bereits vorhanden

**Kein neues Package noetig fuer:**
- Blob-Loeschen (`@vercel/blob` hat bereits eine `del()`-Funktion)
- Passwort-Hashing (`portal-auth.ts` hat bereits `hashPassword()`)

---

### 6. SQL Migration

**Neue Spalte in `portal_links`:**

Eine einzige Aenderung an der Datenbank ist noetig:

- **`description`** -- Freitext-Feld fuer Portal-Beschreibung
  - Standardwert: leerer Text
  - Maximal 500 Zeichen (wird im API-Endpoint validiert, nicht in der Datenbank)

Ausserdem brauchen wir eine neue RLS-Policy:

- **DELETE-Policy fuer `portal_submissions`** fuer authentifizierte Benutzer -- damit der Besitzer Einreichungen ueber den Admin-Client loeschen kann. **Hinweis:** Da wir den Admin-Client (Service-Role) verwenden, wird RLS umgangen. Es ist also keine neue RLS-Policy noetig. Die Zugriffspruefung erfolgt im API-Code.

Die Migration wird in einer neuen Datei `004_add_portal_description.sql` abgelegt.

---

### 7. Datenfluss-Uebersicht

So fliesst die Information durch das System:

```
Seite laedt
    │
    ▼
GET /api/portal/submissions?linkId=xxx
    │
    ▼
Antwort: { link: {..., description}, submissions: [...] }
    │
    ▼
Frontend "entfaltet" Einreichungen zu flacher Datei-Liste:
  Aus: Einreichung A → [Datei1, Datei2], Einreichung B → [Datei3]
  Wird: [Datei1 (von A), Datei2 (von A), Datei3 (von B)]
    │
    ▼
Darstellung in Sub-Komponenten
```

**Speichern:**
```
Benutzer aendert Einstellungen → Klick "Speichern"
    │
    ▼
PATCH /api/portal/links { id, label, description, is_active, password? }
    │
    ▼
Erfolg → Toast "Einstellungen gespeichert" + Daten neu laden
```

**Datei loeschen:**
```
Benutzer klickt Loeschen-Icon → Bestaetigungs-Dialog
    │
    ▼
DELETE /api/portal/files?submissionId=xxx&filename=yyy
    │
    ▼
Blob-Storage: Datei entfernt + DB: file_count reduziert
    │
    ▼
Erfolg → Datei verschwindet aus der Liste + Toast "Datei geloescht"
```

**Portal loeschen:**
```
Benutzer klickt "Portal loeschen" → Bestaetigungs-Dialog (AlertDialog)
    │
    ▼
DELETE /api/portal/links?id=xxx
    │
    ▼
Blob-Storage: Alle Dateien unter portal/{id}/ entfernt
DB: portal_links Eintrag + alle portal_submissions (CASCADE) geloescht
    │
    ▼
Weiterleitung nach /dashboard/portal
```

---

### 8. Zusammenfassung der Aenderungen

| Bereich | Was aendert sich? |
|---|---|
| **Datenbank** | 1 neue Spalte (`description` in portal_links) |
| **Neue API-Endpoints** | 3 neue (DELETE links, DELETE files, GET download-all) |
| **Geaenderte API-Endpoints** | 2 erweitert (PATCH links, GET submissions) |
| **Neue Packages** | 1 (`archiver` fuer ZIP) |
| **Frontend** | 1 Seite komplett umgebaut, 4 neue Sub-Komponenten |
| **Toaster einbinden** | `<Toaster>` in Root-Layout ergaenzen (einmalig) |

---

## Abgrenzung (explizit NICHT Teil von PROJ-13)

- **Kein Team-Feature:** Der Screenshot zeigt ein "Team"-Menuepunkt in der Sidebar -- wir haben kein Multi-User/Team-Konzept
- **Kein Audit-Log:** Keine Protokollierung von Aenderungen
- **Keine Einstellungen-Seite:** Globale Einstellungen werden nicht implementiert
- **Kein Dark-Mode:** Kein Theming
- **Keine Sprachwahl:** Alles bleibt auf Deutsch
- **Keine Benachrichtigungen:** Kein Notification-System
- **Keine konfigurierbaren Limits:** Max. Dateigroesse und erlaubte Typen bleiben global (siehe Zukunftige Enhancements)
