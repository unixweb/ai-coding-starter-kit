# PROJ-17: Dashboard Uploads Redesign

## Status: Planned

## Beschreibung

Die bisherige "Meine Dateien"-Seite wird durch eine neue "Uploads"-Seite ersetzt. Diese zeigt ausschliesslich Dateien, die von Mandanten ueber die Portal-Links hochgeladen wurden (keine eigenen Uploads der Kanzlei). Jede Datei hat einen klickbaren Arbeitsstatus (Neu, In Arbeit, Erledigt, Archiviert). Die Seite hat drei Tabs (Aktuelle Dateien, Archiv, Infiziert) sowie Filter fuer Portal und Zeitraum. Bulk-Aktionen ermoeglichen das gleichzeitige Bearbeiten mehrerer Dateien.

## Zielgruppe

- **Primaer:** Kanzlei (eingeloggte User) - verwalten Mandanten-Uploads

## Abhaengigkeiten

- Benoetigt: PROJ-8 (Mandanten-Upload-Portal) - Portal-Uploads muessen existieren
- Optional: PROJ-16 (Virenschutz) - fuer "Infiziert"-Tab

## User Stories

### Kanzlei (eingeloggter User)

- Als Kanzlei moechte ich alle Mandanten-Uploads an einem Ort sehen, um den Ueberblick zu behalten
- Als Kanzlei moechte ich den Bearbeitungsstatus jeder Datei setzen koennen (Neu, In Arbeit, Erledigt, Archiviert)
- Als Kanzlei moechte ich Dateien nach Portal filtern koennen, um nur Uploads eines bestimmten Mandanten zu sehen
- Als Kanzlei moechte ich Dateien nach Zeitraum filtern koennen, um aeltere Uploads zu finden
- Als Kanzlei moechte ich nach Dateinamen suchen koennen
- Als Kanzlei moechte ich archivierte Dateien separat sehen (Archiv-Tab)
- Als Kanzlei moechte ich infizierte Dateien separat sehen (Infiziert-Tab mit Badge)
- Als Kanzlei moechte ich mehrere Dateien gleichzeitig auswaehlen und deren Status aendern koennen
- Als Kanzlei moechte ich Dateien herunterladen und loeschen koennen

## Acceptance Criteria

### Navigation

- [ ] Menuepunkt "Meine Dateien" wird durch "Uploads" ersetzt
- [ ] Icon: Upload-Icon (wie im Screenshot)
- [ ] Route aendert sich von /dashboard/files zu /dashboard/uploads

### Seitenlayout

- [ ] Seitentitel: "Uploads" mit Untertitel "Alle Dateien"
- [ ] Drei Tabs: "Aktuelle Dateien" | "Archiv" | "Infiziert"
- [ ] "Infiziert"-Tab hat Badge mit Anzahl (nur wenn > 0)
- [ ] Filter-Leiste oberhalb der Tabelle

### Tabs

#### Tab 1: Aktuelle Dateien (Default)
- [ ] Zeigt alle Dateien mit Status: Neu, In Arbeit, Erledigt
- [ ] Sortierung: Neueste zuerst (nach Upload-Datum)

#### Tab 2: Archiv
- [ ] Zeigt alle Dateien mit Status: Archiviert
- [ ] Sortierung: Neueste zuerst

#### Tab 3: Infiziert
- [ ] Zeigt alle Dateien aus Quarantaene (PROJ-16)
- [ ] Badge zeigt Anzahl
- [ ] Falls PROJ-16 nicht implementiert: Tab ausgeblendet oder "Keine Funktion"

### Filter-Leiste

- [ ] Suchfeld: Freitext-Suche nach Dateiname
- [ ] Dropdown "Alle Portale": Filtert nach Portal-Link (zeigt Label des Links)
- [ ] Dropdown "Alle Zeitraeume": Heute, Letzte 7 Tage, Letzte 30 Tage, Dieses Jahr, Alle

### Tabelle

- [ ] Spalten: Checkbox | Datei | Portal | Status | Datum | Groesse | Aktionen
- [ ] Checkbox-Spalte fuer Bulk-Auswahl
- [ ] Datei: Icon + Dateiname
- [ ] Portal: Name des Portal-Links (klickbar, fuehrt zu Portal-Detail)
- [ ] Status: Klickbare Buttons (Neu, In Arbeit, Erledigt, Archiviert)
- [ ] Datum: Format "30.01.2026, 16:55"
- [ ] Groesse: Format "2.1 KB", "35.6 KB", etc.
- [ ] Aktionen: Download-Button, Loeschen-Button

### Arbeitsstatus

- [ ] Vier Status: Neu (blau) | In Arbeit (orange) | Erledigt (gruen) | Archiviert (grau)
- [ ] Status wird als klickbare Badge-Buttons nebeneinander angezeigt
- [ ] Aktueller Status ist hervorgehoben (gefuellt), andere sind umrandet
- [ ] Klick auf Status oeffnet Dropdown mit allen Optionen
- [ ] Statusaenderung wird sofort gespeichert (optimistic update)
- [ ] Bei "Archiviert": Datei verschwindet aus "Aktuelle Dateien" und erscheint in "Archiv"

### Bulk-Aktionen

- [ ] Header-Checkbox waehlt alle sichtbaren Dateien aus
- [ ] Bei Auswahl erscheint Aktionsleiste: "X Dateien ausgewaehlt" + Aktionen
- [ ] Bulk-Aktionen: Status aendern (Dropdown), Archivieren, Loeschen
- [ ] Bestaetigung bei Loeschen (AlertDialog)

### Speicherung

- [ ] Neue Spalte in portal_submissions oder separate Tabelle: file_status
- [ ] Status pro Datei (nicht pro Submission)
- [ ] Neue Tabelle: portal_file_status
  - file_url (PK, VARCHAR) - Blob-URL als Identifier
  - link_id (FK)
  - status (ENUM: 'new', 'in_progress', 'done', 'archived')
  - updated_at (TIMESTAMP)

### API-Endpunkte

- [ ] GET /api/uploads - Liste aller Mandanten-Uploads mit Filtern
  - Query-Params: tab, search, portal, timeRange, page, limit
- [ ] PATCH /api/uploads/status - Status einer oder mehrerer Dateien aendern
  - Body: { fileUrls: [...], status: 'in_progress' }
- [ ] DELETE /api/uploads - Dateien loeschen (Bulk)
  - Body: { fileUrls: [...] }

### Alte Seite entfernen

- [ ] /dashboard/files Route entfernen oder Redirect zu /dashboard/uploads
- [ ] "Meine Dateien" aus Navigation entfernen
- [ ] Eigene Datei-Upload-Funktion entfernen (nur Mandanten-Uploads)

## Edge Cases

- Was passiert wenn keine Uploads vorhanden sind? -> Leerer Zustand: "Noch keine Mandanten-Uploads"
- Was passiert wenn Portal geloescht wird? -> Uploads bleiben erhalten, Portal-Spalte zeigt "[Geloescht]"
- Was passiert bei sehr vielen Uploads? -> Pagination (20 pro Seite)
- Was passiert wenn Suche keine Ergebnisse liefert? -> "Keine Dateien gefunden"
- Was passiert bei Bulk-Loeschen von 100+ Dateien? -> Bestaetigung + Hintergrund-Job
- Was passiert wenn Status-Update fehlschlaegt? -> Rollback + Fehlermeldung

## Technische Anforderungen

### Neue Datenbank-Tabelle

```sql
-- Migration: 005_add_file_status.sql

CREATE TYPE file_status AS ENUM ('new', 'in_progress', 'done', 'archived');

CREATE TABLE portal_file_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id UUID NOT NULL REFERENCES portal_links(id) ON DELETE CASCADE,
  submission_id UUID NOT NULL REFERENCES portal_submissions(id) ON DELETE CASCADE,
  file_url VARCHAR(1000) NOT NULL,
  filename VARCHAR(255) NOT NULL,
  file_size BIGINT NOT NULL,
  status file_status NOT NULL DEFAULT 'new',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(file_url)
);

-- Indizes fuer Filter
CREATE INDEX idx_file_status_link ON portal_file_status(link_id);
CREATE INDEX idx_file_status_status ON portal_file_status(status);
CREATE INDEX idx_file_status_created ON portal_file_status(created_at);

-- RLS
ALTER TABLE portal_file_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their file status"
ON portal_file_status
FOR ALL
USING (
  link_id IN (SELECT id FROM portal_links WHERE user_id = auth.uid())
)
WITH CHECK (
  link_id IN (SELECT id FROM portal_links WHERE user_id = auth.uid())
);

-- Trigger fuer updated_at
CREATE OR REPLACE FUNCTION update_file_status_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER file_status_updated
BEFORE UPDATE ON portal_file_status
FOR EACH ROW EXECUTE FUNCTION update_file_status_timestamp();
```

### Migration bestehender Daten

```sql
-- Bestehende Portal-Dateien mit Status 'new' initialisieren
-- Wird beim ersten Laden der Uploads-Seite oder via Migration durchgefuehrt
```

### UI-Komponenten

```
/dashboard/uploads [NEU]
├── Seitentitel + Untertitel
├── Tabs
│   ├── "Aktuelle Dateien" (default)
│   ├── "Archiv" (Icon: Archiv)
│   └── "Infiziert" (Icon: Warnung) + Badge
├── Filter-Leiste
│   ├── Suchfeld (Input mit Lupe-Icon)
│   ├── Portal-Dropdown (Select)
│   └── Zeitraum-Dropdown (Select)
├── Bulk-Aktionsleiste (nur bei Auswahl sichtbar)
│   ├── "X Dateien ausgewaehlt"
│   ├── Status-Dropdown
│   ├── Archivieren-Button
│   └── Loeschen-Button
├── Tabelle
│   ├── Header mit Checkbox + Spaltennamen
│   └── Zeilen mit Dateien
└── Pagination
```

### Status-Badge-Komponente

```tsx
// Vier Buttons nebeneinander
// Aktueller Status: gefuellt (bg-color + text-white)
// Andere Status: umrandet (border + text-color)

<div className="flex gap-1">
  <Badge variant={status === 'new' ? 'default' : 'outline'} className="bg-blue-500">
    Neu
  </Badge>
  <Badge variant={status === 'in_progress' ? 'default' : 'outline'} className="bg-orange-500">
    In Arbeit
  </Badge>
  <Badge variant={status === 'done' ? 'default' : 'outline'} className="bg-green-500">
    Erledigt
  </Badge>
  <Badge variant={status === 'archived' ? 'default' : 'outline'} className="bg-gray-500">
    Archiviert
  </Badge>
</div>
```

## Sidebar-Aenderungen

```
Sidebar (wie im Screenshot)
├── Dashboard
├── Portale (statt "Mandanten-Portal")
├── Uploads (NEU, ersetzt "Meine Dateien")
├── Einstellungen
├── --- TEAM ---
├── Team-Benutzer
├── --- ADMIN ---
├── Audit-Log
└── Version: 1.0.22
```

## Keine neuen npm-Packages

Alle benoetigten Komponenten sind bereits vorhanden (Tabs, Select, Table, Badge, Checkbox).

## Zukuenftige Enhancements (nicht Teil von PROJ-17)

- [ ] Sortierung per Klick auf Spaltenheader
- [ ] Drag & Drop fuer Status-Aenderung
- [ ] Export als CSV/Excel
- [ ] Erweiterte Filter (Dateigroesse, Dateityp)
- [ ] Benachrichtigung bei neuen Uploads
- [ ] Vorschau-Funktion fuer PDFs/Bilder
