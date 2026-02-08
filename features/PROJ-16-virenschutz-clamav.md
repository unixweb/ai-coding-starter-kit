# PROJ-16: Virenschutz mit ClamAV

## Status: Planned

## Beschreibung

Alle hochgeladenen Dateien werden vor der Speicherung durch ClamAV auf Viren und Malware gescannt. Bei einem Fund wird die Datei in Quarantaene gestellt (nicht im normalen Speicher), der Absender (Mandant) erhaelt eine professionelle E-Mail-Benachrichtigung, und die Kanzlei wird per E-Mail und Dashboard informiert. Quarantaene-Dateien werden nach konfigurierbarer Zeit automatisch geloescht. ClamAV laeuft als Service im Docker-Container (clamd). Fuer Tests wird das EICAR-Testmuster verwendet.

## Zielgruppe

- **Primaer:** Mandanten (externe Uploader) - erhalten Info bei Virenfund
- **Sekundaer:** Kanzlei (eingeloggte User) - sehen Quarantaene im Dashboard
- **Tertiaer:** Administratoren - verwalten ClamAV-Konfiguration

## Abhaengigkeiten

- Benoetigt: PROJ-7 (File Upload) - Upload-Infrastruktur
- Benoetigt: PROJ-8 (Mandanten-Upload-Portal) - Portal-Uploads
- Benoetigt: PROJ-9 (E-Mail-Link Versand) - Brevo E-Mail-Integration
- Benoetigt: PROJ-11 (Docker Deployment) - Docker-Infrastruktur fuer ClamAV
- Optional: PROJ-15 (Dokumente an Mandanten senden) - auch ausgehende Dateien scannen

## User Stories

### Mandant (externer Uploader)

- Als Mandant moechte ich eine professionelle E-Mail erhalten, wenn meine Datei als infiziert erkannt wurde, damit ich das Problem beheben kann
- Als Mandant moechte ich verstehen, warum meine Datei abgelehnt wurde, ohne technischen Jargon
- Als Mandant moechte ich wissen, welche Datei betroffen ist und was ich tun soll

### Kanzlei (eingeloggter User)

- Als Kanzlei moechte ich im Dashboard sehen, wenn infizierte Dateien erkannt wurden
- Als Kanzlei moechte ich per E-Mail benachrichtigt werden, wenn ein Mandant eine infizierte Datei hochlaedt
- Als Kanzlei moechte ich die Quarantaene-Liste einsehen koennen (Dateiname, Absender, Virus-Name, Datum)
- Als Kanzlei moechte ich sicher sein, dass keine infizierten Dateien in meinem System landen

### Administrator

- Als Administrator moechte ich ClamAV-Updates automatisch erhalten (Virus-Definitionen)
- Als Administrator moechte ich die Quarantaene-Aufbewahrungsdauer konfigurieren koennen
- Als Administrator moechte ich den Scan mit EICAR-Testdateien verifizieren koennen

## Acceptance Criteria

### ClamAV Integration

- [ ] ClamAV (clamd) laeuft als Service im Docker-Container oder als Sidecar
- [ ] Virus-Definitionen werden automatisch aktualisiert (freshclam, taeglich)
- [ ] Scan erfolgt synchron beim Upload BEVOR Datei in Blob-Storage gespeichert wird
- [ ] Scan-Timeout: Max. 30 Sekunden pro Datei
- [ ] Bei ClamAV-Ausfall: Upload wird mit Warnung akzeptiert (Graceful Degradation)

### Scan-Scope

- [ ] Portal-Uploads (/api/portal/submit) werden gescannt
- [ ] Eigene Dateien (/api/files/upload) werden gescannt
- [ ] Ausgehende Dokumente (/api/portal/outgoing) werden gescannt (wenn PROJ-15 implementiert)

### Virenfund-Behandlung

- [ ] Infizierte Datei wird NICHT im normalen Blob-Storage gespeichert
- [ ] Datei wird in separatem Quarantaene-Bereich gespeichert (isoliert)
- [ ] Metadaten werden in neuer Tabelle `quarantine_files` gespeichert
- [ ] Upload-Response zeigt Fehlermeldung: "Datei konnte nicht angenommen werden (Sicherheitspruefung)"
- [ ] Keine technischen Details (Virus-Name) an den Uploader in der Web-Response

### E-Mail an Mandanten (Absender)

- [ ] Professionelles, vertrauenswuerdiges Design (kein Spam-Trigger)
- [ ] Betreff: "Wichtige Information zu Ihrer Datei-Uebermittlung"
- [ ] Inhalt:
  - [ ] Freundliche Anrede
  - [ ] Erklaerung: Datei konnte aus Sicherheitsgruenden nicht angenommen werden
  - [ ] Betroffene Datei(en) namentlich nennen
  - [ ] Empfehlung: Datei mit aktuellem Virenscanner pruefen
  - [ ] Kontaktmoeglichkeit zur Kanzlei (falls hinterlegt)
  - [ ] Keine Panikmache, sachlicher Ton
- [ ] Absender: Vertrauenswuerdige Domain (konfiguriert in Brevo)
- [ ] SPF/DKIM/DMARC muessen korrekt konfiguriert sein (Brevo-Setup)
- [ ] Kein "VIRUS" oder "MALWARE" im Betreff (Spam-Filter-Trigger)

### E-Mail an Kanzlei

- [ ] Betreff: "Sicherheitswarnung: Infizierte Datei erkannt"
- [ ] Inhalt:
  - [ ] Absender-Info (Name, E-Mail des Mandanten)
  - [ ] Dateiname und Virus-Name (technische Details fuer Admin)
  - [ ] Zeitpunkt des Uploads
  - [ ] Link zum Quarantaene-Bereich im Dashboard
- [ ] Wird nur gesendet wenn Kanzlei E-Mail-Benachrichtigungen aktiviert hat

### Dashboard: Quarantaene-Bereich

- [ ] Neuer Menuepunkt "Quarantaene" in der Sidebar (nur wenn Eintraege vorhanden)
- [ ] Badge mit Anzahl der Quarantaene-Dateien
- [ ] Tabelle mit: Dateiname, Absender, Virus-Name, Upload-Datum, Verbleibende Tage
- [ ] Aktionen: Details ansehen, Manuell loeschen
- [ ] Keine Download-Moeglichkeit fuer Quarantaene-Dateien (Sicherheit)
- [ ] Automatische Loeschung nach X Tagen (konfigurierbar, Default: 30 Tage)

### EICAR-Test

- [ ] Dokumentation: Wie man mit EICAR-Testdatei den Scanner testet
- [ ] EICAR-String wird korrekt als "Eicar-Test-Signature" erkannt
- [ ] EICAR-Upload wird wie echter Virus behandelt (Quarantaene, E-Mails)

### Performance

- [ ] Scan-Zeit < 5 Sekunden fuer Dateien bis 10 MB
- [ ] Parallele Uploads werden nicht blockiert (Connection-Pooling zu clamd)
- [ ] ClamAV-Memory-Limit konfigurierbar (Default: 512 MB)

## Edge Cases

- Was passiert wenn ClamAV nicht erreichbar ist? -> Upload wird mit Warnung akzeptiert, Log-Eintrag, Admin-Benachrichtigung
- Was passiert bei Timeout (Scan > 30s)? -> Upload wird abgelehnt mit Fehlermeldung "Datei konnte nicht geprueft werden"
- Was passiert wenn Quarantaene-Storage voll ist? -> Aelteste Eintraege werden geloescht, Admin-Warnung
- Was passiert bei ZIP-Dateien mit Viren? -> ClamAV scannt Archive rekursiv (bis konfigurierbare Tiefe)
- Was passiert wenn Mandanten-E-Mail nicht bekannt ist? -> Keine E-Mail an Mandanten, nur Kanzlei wird informiert
- Was passiert bei False Positives? -> Kanzlei kann in Quarantaene-Details sehen, keine automatische Freigabe (Sicherheit)
- Was passiert bei mehreren infizierten Dateien in einem Upload? -> Alle werden einzeln in Quarantaene, eine zusammenfassende E-Mail

## Technische Anforderungen

### Docker-Aenderungen

```yaml
# docker-compose.yml Erweiterung
services:
  app:
    # ... bestehende Konfiguration ...
    depends_on:
      - clamav
    environment:
      - CLAMAV_HOST=clamav
      - CLAMAV_PORT=3310

  clamav:
    image: clamav/clamav:stable
    container_name: safedocs-clamav
    restart: unless-stopped
    volumes:
      - clamav-db:/var/lib/clamav
    healthcheck:
      test: ["CMD", "clamdscan", "--ping"]
      interval: 60s
      timeout: 10s
      retries: 3
    deploy:
      resources:
        limits:
          memory: 512M

volumes:
  clamav-db:
```

### Neue Environment-Variablen

```bash
# ClamAV Konfiguration
CLAMAV_HOST=clamav              # Hostname des ClamAV-Service
CLAMAV_PORT=3310                # Port fuer clamd
CLAMAV_TIMEOUT=30000            # Scan-Timeout in ms
CLAMAV_ENABLED=true             # Feature-Toggle

# Quarantaene
QUARANTINE_RETENTION_DAYS=30    # Tage bis automatische Loeschung
```

### Neue Datenbank-Migration

```sql
-- Migration: 004_add_quarantine.sql

CREATE TABLE quarantine_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  link_id UUID REFERENCES portal_links(id) ON DELETE SET NULL,
  original_filename VARCHAR(255) NOT NULL,
  quarantine_path VARCHAR(1000) NOT NULL,
  file_size BIGINT NOT NULL,
  virus_name VARCHAR(255) NOT NULL,
  uploader_name VARCHAR(255),
  uploader_email VARCHAR(255),
  source VARCHAR(50) NOT NULL, -- 'portal', 'files', 'outgoing'
  scan_duration_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Index fuer automatische Loeschung
CREATE INDEX idx_quarantine_expires ON quarantine_files(expires_at);

-- Index fuer User-Abfragen
CREATE INDEX idx_quarantine_user ON quarantine_files(user_id);

-- RLS
ALTER TABLE quarantine_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their quarantine files"
ON quarantine_files
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their quarantine files"
ON quarantine_files
FOR DELETE
USING (user_id = auth.uid());
```

### Neue API-Endpunkte

- GET /api/quarantine - Liste der Quarantaene-Dateien (Auth erforderlich)
- DELETE /api/quarantine?id=xxx - Quarantaene-Eintrag loeschen (Auth erforderlich)
- GET /api/quarantine/count - Anzahl fuer Badge (Auth erforderlich)

### Blob-Storage Struktur

```
quarantine/                    <- NEU: Isolierter Bereich
├── {quarantine_id}/
│   └── {original_filename}    <- Infizierte Datei (verschluesselt?)
└── ...
```

### E-Mail Templates

#### E-Mail an Mandanten (Spam-sicher)

```
Betreff: Wichtige Information zu Ihrer Datei-Uebermittlung

Guten Tag,

vielen Dank fuer Ihre Dokumenten-Uebermittlung ueber unser Portal.

Bei der automatischen Sicherheitspruefung wurde festgestellt, dass
folgende Datei nicht angenommen werden konnte:

  - [DATEINAME]

Wir empfehlen Ihnen, die Datei mit einem aktuellen Antivirenprogramm
zu ueberpruefen und anschliessend erneut hochzuladen.

Falls Sie Fragen haben, kontaktieren Sie uns gerne.

Mit freundlichen Gruessen
[KANZLEI-NAME / SafeDocs Portal]

---
Diese E-Mail wurde automatisch generiert.
```

#### E-Mail an Kanzlei

```
Betreff: Sicherheitswarnung: Infizierte Datei erkannt

Eine potenziell schaedliche Datei wurde erkannt und in Quarantaene gestellt.

Details:
- Absender: [NAME] ([EMAIL])
- Datei: [DATEINAME]
- Erkannte Bedrohung: [VIRUS_NAME]
- Zeitpunkt: [DATUM/UHRZEIT]
- Portal-Link: [LINK_LABEL]

Die Datei wurde NICHT in Ihrem Dokumentenspeicher abgelegt.

Quarantaene ansehen: [DASHBOARD_LINK]

---
SafeDocs Portal - Automatische Sicherheitsbenachrichtigung
```

## Neue npm-Packages

```json
{
  "clamscan": "^2.2.1"  // Node.js ClamAV-Client
}
```

Alternative: Direkte TCP-Verbindung zu clamd ohne Package (weniger Dependencies).

## UI-Aenderungen

### Sidebar (Dashboard)

```
Sidebar
├── Dashboard
├── Meine Dateien
├── Mandanten-Portal
├── Quarantaene (NEU) <- Nur sichtbar wenn count > 0, mit Badge
└── Einstellungen
```

### Quarantaene-Seite

```
/dashboard/quarantine [NEU]
├── Seitentitel: "Quarantaene" + Badge mit Anzahl
├── Info-Box: "Infizierte Dateien werden nach X Tagen automatisch geloescht"
├── Tabelle
│   ├── Spalten: Datei | Absender | Bedrohung | Quelle | Datum | Verbleibt | Aktion
│   └── Pro Zeile: Loeschen-Button
└── Leerer Zustand: "Keine Dateien in Quarantaene"
```

## EICAR-Test Dokumentation

```markdown
## Virenschutz testen

1. EICAR-Testdatei erstellen:
   ```
   X5O!P%@AP[4\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*
   ```

2. Als `eicar.txt` speichern

3. Ueber Portal hochladen

4. Erwartetes Ergebnis:
   - Upload wird abgelehnt
   - Datei erscheint in Quarantaene
   - E-Mail an Mandant und Kanzlei wird gesendet
   - Virus-Name: "Eicar-Test-Signature" oder aehnlich
```

## Zukuenftige Enhancements (nicht Teil von PROJ-16)

- [ ] Whitelist fuer bestimmte Dateitypen (z.B. signierte PDFs)
- [ ] Quarantaene-Dateien verschluesselt speichern
- [ ] Statistiken: Anzahl gescannter Dateien, Erkennungsrate
- [ ] Integration mit VirusTotal fuer Second Opinion
- [ ] Automatische Freigabe bei False-Positive-Erkennung (mit Bestaetigung)
- [ ] Benachrichtigungs-Praeferenzen pro User konfigurierbar
