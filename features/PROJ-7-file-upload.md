# PROJ-7: Datei-Upload

## Status: 🔵 Planned

## Beschreibung
Eingeloggte User koennen Dateien (PDFs, Bilder, Word, Excel) ueber ein Upload-Formular hochladen. Dateien werden lokal im Dateisystem gespeichert, pro User in eigenen Ordnern. User koennen ihre Dateien anzeigen, herunterladen, umbenennen und loeschen.

## Zielgruppe
Eingeloggte, verifizierte User

## Abhaengigkeiten
- Benoetigt: PROJ-1 (User Registration) - User-Accounts muessen existieren
- Benoetigt: PROJ-2 (User Login) - User muss eingeloggt sein
- Benoetigt: PROJ-4 (Email Verification) - User muss verifiziert sein

## User Stories
- Als eingeloggter User moechte ich Dateien hochladen koennen, um sie zentral zu speichern
- Als eingeloggter User moechte ich mehrere Dateien gleichzeitig hochladen koennen, um Zeit zu sparen
- Als eingeloggter User moechte ich eine Uebersicht meiner hochgeladenen Dateien sehen, um den Ueberblick zu behalten
- Als eingeloggter User moechte ich Dateien herunterladen koennen, um sie auf meinem Geraet zu nutzen
- Als eingeloggter User moechte ich Dateien umbenennen koennen, um sie besser zu organisieren
- Als eingeloggter User moechte ich Dateien loeschen koennen, um Speicherplatz freizugeben
- Als eingeloggter User moechte ich nur meine eigenen Dateien sehen, damit meine Daten privat bleiben

## Acceptance Criteria

### Upload
- [ ] Upload-Formular ist als Menuepunkt "Meine Dateien" im Dashboard erreichbar
- [ ] Unterstuetzte Dateitypen: PDF, Bilder (JPG, PNG, GIF, WebP), Word (DOC, DOCX), Excel (XLS, XLSX)
- [ ] Maximale Dateigroesse: 10 MB pro Datei
- [ ] Multi-Upload: Mehrere Dateien gleichzeitig auswaehlen und hochladen
- [ ] Drag & Drop Upload wird unterstuetzt
- [ ] Fortschrittsanzeige waehrend des Uploads
- [ ] Erfolgsmeldung nach erfolgreichem Upload
- [ ] Fehlermeldung bei ungueltigen Dateitypen oder Ueberschreitung der Dateigroesse

### Dateiverwaltung
- [ ] Liste aller eigenen Dateien mit Name, Groesse, Typ und Upload-Datum
- [ ] Download-Button fuer jede Datei
- [ ] Umbenennen-Funktion fuer jede Datei (nur Dateiname, Endung bleibt)
- [ ] Loeschen-Funktion mit Bestaetigung ("Wirklich loeschen?")
- [ ] Leere-Zustand-Nachricht wenn keine Dateien vorhanden ("Noch keine Dateien hochgeladen")

### Speicherung
- [ ] Dateien werden lokal im Dateisystem gespeichert unter `./uploads/<user-id>/`
- [ ] Jeder User hat einen eigenen Ordner (automatisch erstellt beim ersten Upload)
- [ ] Dateinamen werden sicher gespeichert (keine Path Traversal moeglich)
- [ ] Nur der Datei-Besitzer kann seine Dateien sehen/herunterladen/loeschen

### Sicherheit
- [ ] Nur eingeloggte und verifizierte User koennen auf "Meine Dateien" zugreifen
- [ ] User koennen NUR ihre eigenen Dateien sehen und verwalten
- [ ] Dateiinhalte werden validiert (nicht nur Dateiendung, sondern auch MIME-Type)
- [ ] Path Traversal wird verhindert (z.B. `../../etc/passwd` als Dateiname)

## Edge Cases
- Was passiert bei Datei > 10 MB? -> Fehlermeldung "Datei zu gross (max. 10 MB)" vor dem Upload
- Was passiert bei nicht unterstuetztem Dateityp? -> Fehlermeldung "Dateityp nicht unterstuetzt"
- Was passiert bei Datei mit gleichem Namen? -> Automatisch umbenennen (z.B. `datei (1).pdf`)
- Was passiert bei Netzwerkfehler waehrend Upload? -> Fehlermeldung + Retry moeglich
- Was passiert wenn der Upload-Ordner nicht existiert? -> Automatisch erstellen
- Was passiert bei sehr langen Dateinamen? -> Auf 200 Zeichen kuerzen
- Was passiert wenn der Speicherplatz voll ist? -> Fehlermeldung "Upload fehlgeschlagen"
- Was passiert wenn ein User geloescht wird? -> Uploads bleiben (kein automatisches Loeschen)

## Technische Anforderungen
- Speicherort: `./uploads/<user-id>/` (lokal im Dateisystem)
- Max. Dateigroesse: 10 MB
- Unterstuetzte MIME-Types: application/pdf, image/jpeg, image/png, image/gif, image/webp, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document, application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
- API-Routen fuer Upload, Liste, Download, Umbenennen, Loeschen
- Keine Datenbank-Tabelle noetig (Dateisystem als Storage, Metadaten aus Dateiattributen)

## Tech-Design (Solution Architect)

### Component-Struktur

**Navigation (AppHeader anpassen):**

```
App-Header [ANPASSEN]
├── Logo "AI Starter Kit" (Link zu /dashboard)
├── Navigation
│   ├── "Dashboard" (Link zu /dashboard)
│   └── "Meine Dateien" (Link zu /dashboard/files) [NEU]
├── Username
└── Abmelden-Button
```

**Neue Seite "Meine Dateien":**

```
/dashboard/files [NEU]
├── App-Header (mit Navigation, wiederverwendet)
├── Seitentitel "Meine Dateien"
├── Upload-Bereich
│   ├── Drag & Drop Zone (gestrichelte Umrandung)
│   │   ├── Icon (Upload-Wolke)
│   │   ├── Text: "Dateien hier ablegen oder klicken"
│   │   ├── Hinweis: "PDF, Bilder, Word, Excel - max. 10 MB"
│   │   └── Verstecktes File-Input (Multi-Select)
│   └── Upload-Fortschritt (pro Datei: Name + Fortschrittsbalken)
├── Datei-Liste
│   ├── Tabelle mit Spalten: Name | Typ | Groesse | Datum | Aktionen
│   │   └── Pro Datei eine Zeile
│   │       ├── Dateiname (mit Typ-Icon: PDF/Bild/Word/Excel)
│   │       ├── Dateityp (z.B. "PDF", "JPG", "DOCX")
│   │       ├── Groesse (z.B. "2.4 MB")
│   │       ├── Upload-Datum (z.B. "07.02.2026")
│   │       └── Aktionen-Buttons
│   │           ├── Download (Pfeil-nach-unten Icon)
│   │           ├── Umbenennen (Stift-Icon) -> oeffnet Dialog
│   │           └── Loeschen (Muelleimer-Icon) -> oeffnet Bestaetigung
│   └── Leerer Zustand: "Noch keine Dateien hochgeladen"
├── Umbenennen-Dialog (Modal) [NEU]
│   ├── Eingabefeld mit aktuellem Dateinamen
│   ├── Hinweis: Dateiendung bleibt erhalten
│   ├── "Abbrechen" Button
│   └── "Speichern" Button
└── Loeschen-Bestaetigung (Alert Dialog) [NEU]
    ├── Text: "Moechtest du [Dateiname] wirklich loeschen?"
    ├── "Abbrechen" Button
    └── "Loeschen" Button (rot)
```

### API-Struktur

```
/api/files (API-Routen) [NEU]
├── POST /api/files/upload
│   ├── Empfaengt: FormData mit einer oder mehreren Dateien
│   ├── Prueft: Eingeloggt? Dateityp erlaubt? Groesse < 10 MB?
│   ├── Speichert: nach ./uploads/<user-id>/
│   └── Gibt zurueck: Liste der hochgeladenen Dateien
│
├── GET /api/files
│   ├── Prueft: Eingeloggt?
│   ├── Liest: ./uploads/<user-id>/ Ordner
│   └── Gibt zurueck: Liste aller Dateien (Name, Groesse, Datum, Typ)
│
├── GET /api/files/download?name=datei.pdf
│   ├── Prueft: Eingeloggt? Datei gehoert dem User?
│   └── Gibt zurueck: Datei als Download-Stream
│
├── PATCH /api/files/rename
│   ├── Empfaengt: { oldName, newName }
│   ├── Prueft: Eingeloggt? Datei existiert? Neuer Name gueltig?
│   └── Benennt Datei um im Dateisystem
│
└── DELETE /api/files?name=datei.pdf
    ├── Prueft: Eingeloggt? Datei gehoert dem User?
    └── Loescht Datei aus dem Dateisystem
```

### Daten-Model

Keine Datenbank noetig! Das Dateisystem ist der Speicher:

```
Jede Datei hat (aus Dateiattributen ausgelesen):
- Name (Dateiname auf dem Dateisystem)
- Groesse (in Bytes, vom Dateisystem)
- Typ (Dateiendung, z.B. .pdf, .jpg)
- Upload-Datum (Erstellungsdatum der Datei)

Ordnerstruktur:
./uploads/
├── <user-id-1>/
│   ├── rechnung.pdf
│   ├── foto.jpg
│   └── tabelle.xlsx
├── <user-id-2>/
│   └── dokument.docx
└── ... (ein Ordner pro User)
```

### Seitenstruktur

```
Angepasste Komponenten:
- AppHeader -> Neuer Navigations-Link "Meine Dateien"
- Dashboard-Seite -> Optional: Kurzinfo-Karte "X Dateien hochgeladen"

Neue Seite:
- /dashboard/files -> Datei-Upload und -Verwaltung

Neue API-Routen:
- /api/files/upload (POST) -> Dateien hochladen
- /api/files (GET) -> Dateiliste abrufen
- /api/files/download (GET) -> Datei herunterladen
- /api/files/rename (PATCH) -> Datei umbenennen
- /api/files (DELETE) -> Datei loeschen
```

### Tech-Entscheidungen

```
Warum Dateisystem statt Supabase Storage?
→ User will lokale Speicherung. Kein externer Service noetig,
  volle Kontrolle ueber die Daten, funktioniert offline.

Warum keine Datenbank-Tabelle fuer Datei-Metadaten?
→ Das Dateisystem liefert alle noetigten Infos (Name, Groesse,
  Erstellungsdatum). Weniger Komplexitaet, keine Sync-Probleme
  zwischen DB und Dateisystem.

Warum Next.js API Routes statt eigener Server?
→ Bereits vorhanden (siehe /api/auth/register). Gleiche Architektur,
  kein zusaetzlicher Server noetig.

Warum shadcn/ui Table + Dialog + AlertDialog?
→ Bereits installiert und im Projekt vorhanden. Einheitliches Design,
  Accessibility eingebaut.

Warum kein externer Upload-Service (z.B. Uploadthing, S3)?
→ User will explizit lokale Speicherung im Dateisystem. Einfacher,
  kostenlos, keine Abhaengigkeit von Drittanbietern.
```

### Dependencies

```
Keine neuen Packages noetig!
Alles bereits vorhanden:
- Next.js API Routes (File Upload via FormData)
- shadcn/ui Komponenten (Table, Dialog, AlertDialog, Button, Progress, Card)
- Lucide Icons (Upload, Download, Pencil, Trash2, File, FileText, Image, Sheet)
- Node.js fs/path Module (Dateisystem-Operationen, eingebaut)
```
