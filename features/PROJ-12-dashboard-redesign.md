# PROJ-12: Dashboard-Redesign mit Sidebar-Navigation

## Status: Implemented

## Beschreibung
Das Dashboard (`/dashboard`) wurde von einer einfachen Willkommensnachricht zu einem vollwertigen Dashboard mit Sidebar-Navigation, Statistik-Karten, Schnellaktionen, letzten Uploads und aktiven Portalen umgebaut. Alle `/dashboard/*`-Seiten teilen sich ein gemeinsames Layout mit Sidebar und Header.

## Abhaengigkeiten
- Benoetigt: PROJ-7 (File Upload) - fuer Upload-Statistiken und letzte Dateien
- Benoetigt: PROJ-8 (Mandanten-Upload-Portal) - fuer Portal-Statistiken und aktive Portale

## User Stories

### Steuerberater (eingeloggter User)
- Als Steuerberater moechte ich auf dem Dashboard eine Uebersicht ueber meine Uploads und Portale sehen, um meinen Arbeitsstand schnell zu erfassen
- Als Steuerberater moechte ich Statistik-Karten mit Uploads heute, aktiven Portalen, Gesamt-Uploads und letzter Aktivitaet sehen
- Als Steuerberater moechte ich Schnellaktionen haben, um haeufig verwendete Funktionen direkt aufzurufen
- Als Steuerberater moechte ich die letzten 5 hochgeladenen Dateien direkt auf dem Dashboard sehen
- Als Steuerberater moechte ich meine aktiven Upload-Portale mit Submission-Zaehler auf dem Dashboard sehen
- Als Steuerberater moechte ich eine Sidebar-Navigation haben, um schnell zwischen Dashboard, Portalen und Uploads zu wechseln
- Als Steuerberater moechte ich meinen Namen und einen Abmelde-Button im Header sehen

## Acceptance Criteria

### Dashboard-Layout (Sidebar + Header)
- [x] Sidebar-Navigation auf allen `/dashboard/*`-Seiten sichtbar
- [x] Sidebar enthaelt: Dashboard, Portale, Uploads
- [x] Aktive Seite in Sidebar hervorgehoben
- [x] SafeDocs Portal Logo und Name im Sidebar-Header
- [x] Header zeigt Username und Abmelden-Button
- [x] Sidebar ist auf Mobile einklappbar (SidebarTrigger)
- [x] Zentraler Auth-Check im Layout (nicht pro Seite)

### Dashboard-Seite (/dashboard)
- [x] Willkommensnachricht mit Vorname und aktuellem Datum
- [x] 4 Statistik-Karten im Grid:
  - Uploads heute (mit "diese Woche" Zusatz)
  - Aktive Portale (mit "inaktiv" Zusatz)
  - Uploads gesamt
  - Letzte Aktivitaet (Datum)
- [x] Schnellaktionen-Card mit 4 Links:
  - Neues Portal erstellen
  - Portale verwalten
  - Alle Uploads anzeigen
  - Einstellungen
- [x] Letzte Uploads-Card mit 5 neuesten Dateien (Name, Groesse, Datum)
- [x] Ihre Portale-Section mit aktiven Portal-Karten (Label, Submission-Count)

### API-Endpoint
- [x] `GET /api/dashboard/stats` aggregiert alle Dashboard-Daten
- [x] Gibt zurueck: uploadsToday, uploadsThisWeek, activePortals, inactivePortals, totalUploads, totalSubmissions, lastActivity, recentFiles (5), activePortalLinks (3)
- [x] Authentifizierter Endpoint (nur fuer eingeloggte User)

### Layout-Integration
- [x] AppHeader aus `dashboard/files/page.tsx` entfernt
- [x] AppHeader aus `dashboard/portal/page.tsx` entfernt
- [x] AppHeader aus `dashboard/portal/[linkId]/page.tsx` entfernt
- [x] Auth-Check aus allen Child-Pages entfernt (Layout uebernimmt)

## Edge Cases
- Was passiert wenn keine Dateien hochgeladen wurden? -> "Noch keine Dateien hochgeladen" Meldung
- Was passiert wenn keine Portale existieren? -> "Noch keine Portale erstellt" Meldung
- Was passiert wenn der Stats-API-Call fehlschlaegt? -> Stille Fehlerbehandlung, Ladeanzeige verschwindet
- Was passiert auf mobilen Geraeten? -> Sidebar klappt automatisch ein, SidebarTrigger zum Oeffnen

## Technische Anforderungen

### Neue Dateien
- `src/app/api/dashboard/stats/route.ts` - Stats-Aggregation-Endpoint
- `src/app/dashboard/layout.tsx` - Shared Layout mit Sidebar + Header + Auth
- `src/components/app-sidebar.tsx` - Sidebar-Navigationskomponente
- `src/hooks/use-mobile.ts` - Mobile-Detection Hook (von shadcn/ui benoetigt)

### Geaenderte Dateien
- `src/app/dashboard/page.tsx` - Komplett neu geschrieben
- `src/app/dashboard/files/page.tsx` - AppHeader + Auth entfernt
- `src/app/dashboard/portal/page.tsx` - AppHeader + Auth entfernt
- `src/app/dashboard/portal/[linkId]/page.tsx` - AppHeader + Auth entfernt

### Verwendete Komponenten
- `shadcn/ui Sidebar` (SidebarProvider, Sidebar, SidebarMenu, etc.)
- `shadcn/ui Card` fuer Statistik-Karten
- `shadcn/ui Badge` fuer Portal-Status
- `lucide-react` Icons
- `@vercel/blob` list() fuer File-Statistiken
- Supabase fuer Portal-Daten

---

## Tech-Design (Solution Architect)

### Architektur-Ueberblick

PROJ-12 hat das Dashboard von einer einfachen Willkommens-Seite zu einer vollstaendigen Anwendung mit Sidebar-Navigation, Statistik-Dashboard und zentralem Auth-Management umgebaut. Alle `/dashboard/*`-Seiten teilen sich ein gemeinsames Layout mit Sidebar und Header.

### Component-Struktur

```
Dashboard-Layout (layout.tsx) ........................ Zentraler Auth-Check + Rahmen
├── Sidebar (app-sidebar.tsx) ........................ Linke Navigation
│   ├── Logo + App-Name ("SafeDocs Portal")
│   ├── Navigation
│   │   ├── Dashboard (aktiv hervorgehoben)
│   │   ├── Portale
│   │   └── Uploads
│   └── Footer ("SafeDocs Portal")
├── Header (im Layout integriert) ................... Obere Leiste
│   ├── Sidebar-Trigger (Hamburger-Menu fuer Mobil)
│   ├── Username-Anzeige
│   └── Abmelden-Button
└── Seiteninhalt (children) ......................... Wechselt je nach Route
    │
    ├── Dashboard-Seite (/dashboard, page.tsx)
    │   ├── Willkommens-Bereich (Vorname + Datum)
    │   ├── 4 Statistik-Karten (Grid)
    │   │   ├── Uploads heute (+ Woche)
    │   │   ├── Aktive Portale (+ inaktiv)
    │   │   ├── Uploads gesamt
    │   │   └── Letzte Aktivitaet (Datum)
    │   ├── Schnellaktionen (4 Links)
    │   │   ├── Neues Portal erstellen
    │   │   ├── Portale verwalten
    │   │   ├── Alle Uploads anzeigen
    │   │   └── Einstellungen (Platzhalter)
    │   ├── Letzte Uploads (5 neueste Dateien)
    │   └── Ihre Portale (3 aktive Portal-Karten)
    │
    ├── Uploads-Seite (/dashboard/files)
    │   ├── Drag & Drop Upload-Bereich
    │   └── Datei-Tabelle (mit Download/Umbenennen/Loeschen)
    │
    ├── Portal-Uebersicht (/dashboard/portal)
    │   ├── Link-Erstellen-Button
    │   ├── Einladungslinks-Tabelle
    │   └── Dialoge (Erstellen, Erfolg, E-Mail-Versand)
    │
    └── Portal-Detail (/dashboard/portal/[linkId])
        ├── Link-Info-Karte (mit Passwort-Verwaltung)
        └── Einreichungen-Liste (aufklappbar)
```

### Daten-Model

**Dashboard-Statistiken (von API geliefert):**

Jeder API-Aufruf liefert folgende Informationen:
- Uploads heute (Anzahl Dateien, die heute hochgeladen wurden)
- Uploads diese Woche (Anzahl Dateien seit Wochenbeginn)
- Aktive Portale (Anzahl aktiver, nicht gesperrter, nicht abgelaufener Links)
- Inaktive Portale (Anzahl deaktivierter/abgelaufener/gesperrter Links)
- Uploads gesamt (Gesamtanzahl aller Dateien des Nutzers)
- Gesamt-Einreichungen (Summe aller Portal-Submissions)
- Letzte Aktivitaet (Datum des letzten Uploads)
- Letzte 5 Dateien (Name, Groesse, Upload-Datum)
- Top 3 aktive Portale (Label, Einreichungs-Zaehler)

**Datenspeicherung:**
- Dateien: Vercel Blob (Cloud-Speicher), organisiert nach `user/{user-id}/`
- Portal-Links und Einreichungen: Supabase PostgreSQL (Tabellen `portal_links`, `portal_submissions`)
- Auth-Daten: Supabase Auth (Benutzerkonten, Sitzungen)

### Tech-Entscheidungen

**Warum shadcn/ui Sidebar statt selbstgebauter Navigation?**
- Vorgefertigte, barrierefreie Komponente (Tastatur-Support, ARIA-Attribute)
- Automatisches Ein-/Ausklappen auf mobilen Geraeten
- Einheitliches Design mit dem restlichen shadcn/ui-System
- Weniger eigener Code, weniger Fehlerquellen

**Warum ein zentrales Layout mit Auth-Check?**
- Auth-Pruefung nur einmal im Layout, nicht in jeder Unterseite
- Konsistentes Erscheinungsbild (Sidebar + Header) auf allen Dashboard-Seiten
- Reduziert doppelten Code erheblich (vorher: Auth-Check in jeder Page)

**Warum ein eigener Stats-API-Endpoint?**
- Buendelt alle Dashboard-Daten in einem einzigen Netzwerk-Aufruf
- Vermeidet mehrere parallele API-Calls beim Laden des Dashboards
- Server-seitige Aggregation ist schneller als Client-seitige Berechnung
- Authentifizierung wird serverseitig geprueft (sicher)

**Warum Client-Components ("use client")?**
- Dashboard braucht interaktive Elemente (Klick-Events, State-Aenderungen)
- Sidebar-Navigation braucht Client-seitige Pfad-Erkennung (`usePathname`)
- Authentifizierung wird per Browser-Cookie verwaltet

**Warum Vercel Blob list() mit Paginierung?**
- Nutzer koennen viele Dateien haben; das API gibt maximal 1000 auf einmal zurueck
- Cursor-basierte Paginierung stellt sicher, dass alle Dateien gezaehlt werden
- Fehlertolerant: Bei Blob-Fehler wird mit leerer Dateiliste weitergearbeitet

### Dependencies

Fuer PROJ-12 wurden folgende Packages/Komponenten genutzt (alle waren bereits im Projekt vorhanden):
- `shadcn/ui Sidebar` - Sidebar-Navigationskomponente (neu hinzugefuegt fuer PROJ-12)
- `shadcn/ui Card` - Karten fuer Statistiken und Inhalte
- `shadcn/ui Badge` - Status-Anzeigen fuer Portale
- `shadcn/ui Button` - Buttons (Abmelden, Aktionen)
- `shadcn/ui Separator` - Trennlinien im Header
- `lucide-react` - Icons (Dashboard, Upload, Portale, etc.)
- `@vercel/blob` - Datei-Auflistung und Statistik-Berechnung
- `@supabase/supabase-js` - Portal-Daten und Authentifizierung
- `use-mobile` Hook - Mobile-Erkennung fuer responsive Sidebar (neu, von shadcn/ui benoetigt)

Keine neuen externen Packages wurden installiert.

### Verifizierung der Acceptance Criteria

| Kriterium | Status | Anmerkung |
|---|---|---|
| Sidebar auf allen /dashboard/*-Seiten | Erfuellt | Layout umschliesst alle Child-Routes |
| Sidebar: Dashboard, Portale, Uploads | Erfuellt | 3 Nav-Items in app-sidebar.tsx |
| Aktive Seite hervorgehoben | Erfuellt | isActive-Logik mit pathname-Vergleich |
| Logo + Name im Sidebar-Header | Erfuellt | Shield-Icon + "SafeDocs Portal" |
| Username + Abmelden im Header | Erfuellt | Im Layout-Header integriert |
| Mobile einklappbar | Erfuellt | SidebarTrigger + SidebarProvider |
| Zentraler Auth-Check | Erfuellt | useEffect in layout.tsx, Child-Pages haben keinen Auth-Check |
| Willkommensnachricht mit Vorname + Datum | Erfuellt | firstName-Extraktion + formatDateLong() |
| 4 Statistik-Karten | Erfuellt | Grid mit farbigen Karten |
| Schnellaktionen (4 Links) | Erfuellt | PlusCircle, FolderOpen, Upload, Settings |
| Letzte 5 Uploads | Erfuellt | recentFiles aus API, max 5 |
| Aktive Portal-Karten | Erfuellt | activePortalLinks aus API, max 3 |
| Stats-API authentifiziert | Erfuellt | getUser() + email_confirmed_at Check |
| AppHeader aus Child-Pages entfernt | Erfuellt | Kein Import von AppHeader in /dashboard/* |
| Auth-Check aus Child-Pages entfernt | Erfuellt | Kein supabase.auth in files/portal Pages |

### Identifizierte Probleme und Verbesserungsvorschlaege

#### 1. Einstellungen-Link zeigt auf Dashboard (niedrig)
**Problem:** Die Schnellaktion "Einstellungen" verlinkt auf `/dashboard` (die Dashboard-Seite selbst). Es gibt keine Einstellungen-Seite.
**Empfehlung:** Entweder den Link entfernen oder eine Einstellungen-Seite als eigenes Feature planen (z.B. PROJ-13).

#### 2. Doppelter User-Fetch auf der Dashboard-Seite (niedrig)
**Problem:** Die Dashboard-Page (`page.tsx`) holt sich den User nochmal per `supabase.auth.getUser()`, obwohl das Layout den User bereits kennt. Das fuehrt zu einem doppelten Auth-Aufruf.
**Empfehlung:** Den Usernamen vom Layout an die Child-Pages weiterreichen (z.B. ueber React Context oder URL-Parameter).

#### 3. Alte AppHeader-Komponente ist verwaist (niedrig)
**Problem:** Die Datei `src/components/app-header.tsx` existiert noch, wird aber nirgends mehr importiert. Sie ist toter Code.
**Empfehlung:** Datei entfernen, um die Codebasis sauber zu halten.

#### 4. Doppelte use-mobile-Datei (niedrig)
**Problem:** Es gibt sowohl `src/hooks/use-mobile.ts` als auch `src/hooks/use-mobile.tsx` mit identischem Inhalt.
**Empfehlung:** Eine der beiden Dateien entfernen (die `.tsx`-Version behalten, da sie von shadcn/ui referenziert wird).

#### 5. Performance bei vielen Dateien (mittel)
**Problem:** Die Stats-API iteriert ueber alle Blob-Dateien des Nutzers bei jedem Dashboard-Aufruf (Cursor-basierte Schleife). Bei Nutzern mit hunderten oder tausenden Dateien kann das langsam werden.
**Empfehlung:** Caching-Strategie einfuehren (z.B. Statistiken in Supabase zwischenspeichern und periodisch aktualisieren) oder die Blob-Statistiken serverseitig aggregieren.

#### 6. Keine Fehleranzeige bei Stats-Ladefehlern (niedrig)
**Problem:** Wenn die Stats-API fehlschlaegt, zeigt das Dashboard einfach nichts an (stilles Versagen). Der Nutzer erhaelt kein Feedback.
**Empfehlung:** Eine Fehlermeldung wie "Dashboard-Daten konnten nicht geladen werden" mit Retry-Button anzeigen.

#### 7. "Neues Portal erstellen" und "Portale verwalten" fuehren zum selben Ziel (niedrig)
**Problem:** Beide Schnellaktionen verlinken auf `/dashboard/portal`. Der Nutzer erwartet bei "Neues Portal erstellen" moeglicherweise, dass direkt der Erstellen-Dialog oeffnet.
**Empfehlung:** Link zu `/dashboard/portal?action=create` aendern und den Dialog automatisch oeffnen, wenn der Query-Parameter vorhanden ist.
