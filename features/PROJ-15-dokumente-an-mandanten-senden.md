# PROJ-15: Dokumente an Mandanten senden

## Status: ✅ Done

## Beschreibung

Die Kanzlei (eingeloggter User) kann Dokumente fuer einen Mandanten im Portal bereitstellen. Der Mandant erhaelt automatisch eine E-Mail-Benachrichtigung mit einer persoenlichen Notiz und kann die Dokumente ueber seinen bestehenden Portal-Link herunterladen. Typischer Anwendungsfall: Kanzlei stellt einen Vertrag bereit, Mandant laedt ihn herunter, unterschreibt/bearbeitet ihn, und laedt ihn ueber das normale Upload-Formular wieder hoch.

## Zielgruppe

- **Primaer:** Eingeloggte User (Kanzlei/Mandanten-Betreuer) - stellen Dokumente fuer Mandanten bereit
- **Sekundaer:** Externe Mandanten - erhalten E-Mail, laden Dokumente herunter

## Abhaengigkeiten

- Benoetigt: PROJ-8 (Mandanten-Upload-Portal) - Portal-Links und /p/[token] Seite muessen existieren
- Benoetigt: PROJ-9 (E-Mail-Link Versand) - Brevo E-Mail-Integration muss konfiguriert sein
- Benoetigt: PROJ-7 (File Upload) - Datei-Validierung und Blob-Storage

## User Stories

### Kanzlei/Mandanten-Betreuer (eingeloggt)

- Als Kanzlei moechte ich Dokumente fuer einen Mandanten bereitstellen koennen, um ihm Unterlagen zur Bearbeitung zu schicken
- Als Kanzlei moechte ich beim Erstellen eines Portal-Links die E-Mail-Adresse des Mandanten hinterlegen koennen, damit Benachrichtigungen automatisch gesendet werden
- Als Kanzlei moechte ich eine persoenliche Notiz zur Bereitstellung hinzufuegen koennen, um dem Mandanten Kontext zu geben (z.B. "Bitte unterschreiben und zuruecksenden")
- Als Kanzlei moechte ich ein optionales Ablaufdatum fuer bereitgestellte Dokumente setzen koennen, um die Verfuegbarkeit zu begrenzen
- Als Kanzlei moechte ich sehen koennen, welche Dokumente ich fuer einen Mandanten bereitgestellt habe
- Als Kanzlei moechte ich bereitgestellte Dokumente loeschen koennen, wenn sie nicht mehr benoetigt werden

### Mandant (extern, kein Login)

- Als Mandant moechte ich eine E-Mail erhalten, wenn ein Dokument fuer mich bereitgestellt wurde
- Als Mandant moechte ich in der E-Mail eine persoenliche Nachricht der Kanzlei sehen
- Als Mandant moechte ich ueber meinen bestehenden Portal-Link die bereitgestellten Dokumente sehen und herunterladen koennen
- Als Mandant moechte ich das bearbeitete Dokument ueber das normale Upload-Formular zurueckschicken koennen

## Acceptance Criteria

### Link-Erstellung erweitern

- [ ] Dialog "Neuen Link erstellen" hat neues Feld: "Mandanten-E-Mail" (optional)
- [ ] E-Mail-Adresse wird in portal_links Tabelle gespeichert (neue Spalte `client_email`)
- [ ] E-Mail-Validierung (Format-Check)
- [ ] Bestehende Links koennen nachtraeglich mit E-Mail-Adresse versehen werden (Edit-Funktion)

### Dateien senden (Dashboard - Portal-Detail-Seite)

- [ ] Neuer Button "Dateien senden" auf der Portal-Detail-Seite (neben "Zugangsdaten senden")
- [ ] Button oeffnet Dialog mit:
  - [ ] Upload-Bereich fuer Dateien (Drag & Drop, max. 10 Dateien, max. 10 MB pro Datei)
  - [ ] Textarea fuer persoenliche Notiz an den Mandanten (Pflicht)
  - [ ] Optionales Ablaufdatum (Datepicker)
  - [ ] Anzeige der Mandanten-E-Mail (aus Link, nicht editierbar in diesem Dialog)
  - [ ] Warnung wenn keine E-Mail hinterlegt ist (E-Mail kann nicht gesendet werden)
- [ ] Nach Upload: Dokumente werden in Blob-Storage gespeichert unter `portal/{link_id}/outgoing/`
- [ ] Metadaten werden in neuer Tabelle `portal_outgoing_files` gespeichert
- [ ] E-Mail wird automatisch an Mandanten gesendet (wenn E-Mail hinterlegt)

### E-Mail an Mandanten

- [ ] Betreff: "Neue Dokumente fuer Sie bereitgestellt"
- [ ] Inhalt:
  - [ ] Persoenliche Notiz der Kanzlei
  - [ ] Liste der bereitgestellten Dokumente (Name + Groesse)
  - [ ] Link zum Portal
  - [ ] Optionales Ablaufdatum (falls gesetzt)
- [ ] Absender: Konfigurierter Brevo-Absender
- [ ] E-Mail-Template im SafeDocs-Design

### Bereitgestellte Dokumente anzeigen (Dashboard)

- [ ] Neuer Bereich "Bereitgestellte Dokumente" auf der Portal-Detail-Seite
- [ ] Liste mit: Dateiname, Groesse, Notiz, Ablaufdatum, Bereitgestellt am, Aktionen
- [ ] Aktionen: Download, Loeschen
- [ ] Status-Anzeige: Aktiv / Abgelaufen
- [ ] Leerer Zustand: "Noch keine Dokumente bereitgestellt"

### Portal-Seite erweitern (/p/[token])

- [ ] Neue Sektion "Fuer Sie bereitgestellt" oberhalb des Upload-Formulars
- [ ] Liste der bereitgestellten Dokumente (nur aktive, nicht abgelaufene)
- [ ] Pro Dokument: Name, Groesse, Notiz der Kanzlei, Download-Button
- [ ] Wenn keine Dokumente: Sektion wird nicht angezeigt
- [ ] Hinweis: "Laden Sie das bearbeitete Dokument ueber das Formular unten wieder hoch"

### Speicherung

- [ ] Neue Spalte in portal_links: `client_email` (VARCHAR, nullable)
- [ ] Neue Tabelle: portal_outgoing_files
  - id (UUID, PK)
  - link_id (UUID, FK zu portal_links)
  - filename (VARCHAR)
  - blob_url (VARCHAR)
  - file_size (BIGINT)
  - note (TEXT)
  - expires_at (TIMESTAMP, nullable)
  - created_at (TIMESTAMP)
- [ ] RLS: Nur Link-Ersteller kann Outgoing Files verwalten
- [ ] RLS: Anonymer Zugriff per Token fuer Download erlaubt

### API-Endpunkte

- [ ] PATCH /api/portal/links - Erweitern um client_email Update
- [ ] POST /api/portal/outgoing - Dateien bereitstellen (Auth erforderlich)
- [ ] GET /api/portal/outgoing?linkId=xxx - Liste bereitgestellter Dateien (Auth erforderlich)
- [ ] DELETE /api/portal/outgoing?fileId=xxx - Datei loeschen (Auth erforderlich)
- [ ] GET /api/portal/outgoing/download?fileId=xxx - Datei herunterladen (oeffentlich, Token-Validierung)
- [ ] GET /api/portal/outgoing/list?token=xxx - Liste fuer Portal-Seite (oeffentlich, Token-Validierung)

## Edge Cases

- Was passiert wenn keine E-Mail beim Link hinterlegt ist? -> Warnung im Dialog, Dateien werden bereitgestellt aber keine E-Mail gesendet
- Was passiert wenn E-Mail-Versand fehlschlaegt? -> Fehler wird angezeigt, Dateien bleiben bereitgestellt, User kann E-Mail manuell erneut senden
- Was passiert wenn Dokument abgelaufen ist? -> Mandant sieht das Dokument nicht mehr im Portal, Kanzlei sieht es als "Abgelaufen"
- Was passiert wenn Link deaktiviert wird? -> Bereitgestellte Dokumente sind nicht mehr abrufbar (Link-Status hat Prioritaet)
- Was passiert bei mehr als 10 Dateien? -> Fehlermeldung "Maximal 10 Dateien erlaubt"
- Was passiert bei Datei > 10 MB? -> Fehlermeldung "Datei zu gross (max. 10 MB)"
- Was passiert wenn Mandant bearbeitetes Dokument hochlaedt? -> Normale Einreichung, keine automatische Verknuepfung (Kanzlei sieht es in Einreichungen)
- Was passiert wenn E-Mail-Adresse ungueltig? -> Validierungsfehler bei Link-Erstellung/Update

## Technische Anforderungen

### Neue Datenbank-Migration

```sql
-- Migration: 003_add_outgoing_files.sql

-- Spalte client_email zu portal_links hinzufuegen
ALTER TABLE portal_links ADD COLUMN client_email VARCHAR(255);

-- Neue Tabelle fuer bereitgestellte Dateien
CREATE TABLE portal_outgoing_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id UUID NOT NULL REFERENCES portal_links(id) ON DELETE CASCADE,
  filename VARCHAR(255) NOT NULL,
  blob_url VARCHAR(1000) NOT NULL,
  file_size BIGINT NOT NULL,
  note TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index fuer schnelle Abfragen
CREATE INDEX idx_outgoing_files_link_id ON portal_outgoing_files(link_id);

-- RLS aktivieren
ALTER TABLE portal_outgoing_files ENABLE ROW LEVEL SECURITY;

-- Policy: Link-Owner kann seine Outgoing Files verwalten
CREATE POLICY "Users can manage their outgoing files"
ON portal_outgoing_files
FOR ALL
USING (
  link_id IN (SELECT id FROM portal_links WHERE user_id = auth.uid())
)
WITH CHECK (
  link_id IN (SELECT id FROM portal_links WHERE user_id = auth.uid())
);

-- Policy: Anonymer Download-Zugriff (Token wird in API geprueft)
CREATE POLICY "Anyone can read outgoing files by link"
ON portal_outgoing_files
FOR SELECT
USING (
  link_id IN (
    SELECT id FROM portal_links
    WHERE is_active = true
    AND (expires_at IS NULL OR expires_at > NOW())
  )
);
```

### Blob-Storage Struktur

```
portal/{link_id}/
├── outgoing/           <- NEU: Bereitgestellte Dokumente (Kanzlei -> Mandant)
│   ├── {file_id}/
│   │   └── vertrag.pdf
│   └── ...
└── {submission_id}/    <- Bestehend: Einreichungen (Mandant -> Kanzlei)
    └── ...
```

### E-Mail Template

```
Betreff: Neue Dokumente fuer Sie bereitgestellt

Guten Tag,

[PERSOENLICHE NOTIZ DER KANZLEI]

Folgende Dokumente wurden fuer Sie bereitgestellt:
- Vertrag_2026.pdf (1.2 MB)
- Anlage_1.pdf (500 KB)

[Falls Ablaufdatum:] Diese Dokumente sind verfuegbar bis: [DATUM]

Zum Portal: [PORTAL-LINK]

Mit freundlichen Gruessen
SafeDocs Portal
```

### Keine neuen npm-Packages

Alle benoetigten Bibliotheken sind bereits vorhanden:
- Vercel Blob fuer Datei-Storage
- Brevo fuer E-Mail-Versand (PROJ-9)
- shadcn/ui Komponenten

## UI-Aenderungen

### Portal-Detail-Seite (Dashboard)

```
/dashboard/portal/[linkId]
├── Portal-Link Card (bestehend)
│   ├── Kopieren, Oeffnen
│   ├── Zugangsdaten senden (bestehend)
│   └── Dateien senden (NEU) <- Neuer Button
├── Statistiken (bestehend)
├── Bereitgestellte Dokumente (NEU)
│   └── Liste mit Download/Loeschen
├── Einreichungen (bestehend)
└── Einstellungen (bestehend)
```

### Portal-Seite (/p/[token])

```
/p/[token]
├── Header
├── Fuer Sie bereitgestellt (NEU) <- Neue Sektion, nur wenn Dokumente vorhanden
│   ├── Hinweis: "Folgende Dokumente wurden fuer Sie bereitgestellt"
│   └── Dokumentenliste mit Download-Buttons
├── Upload-Formular (bestehend)
└── Footer
```

## Zukuenftige Enhancements (nicht Teil von PROJ-15)

- [ ] Lesebestaetigung: Mandant bestaetigt Empfang/Download
- [ ] Versionierung: Mehrere Versionen eines Dokuments verwalten
- [ ] Automatische Verknuepfung: Rueckgabe mit Original-Dokument verknuepfen
- [ ] E-Mail-Erinnerung: Automatische Erinnerung wenn Mandant nicht reagiert
- [ ] Signatur-Integration: Digitale Unterschrift direkt im Portal
