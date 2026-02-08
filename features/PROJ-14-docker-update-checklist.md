# PROJ-14: Docker Basis-Image Update-Checkliste

## Status: Planned

## Beschreibung

Ein interaktives Shell-Script (`scripts/docker-update-check.sh`) das vor und nach Docker-Image-Updates automatisierte Checks durchfuehrt. Ziel: Sichere Updates ohne Ueberraschungen in produktiven Docker-Setups.

Das Script prueft:
- Basis-Image Kompatibilitaet (OS, libc, Architektur)
- Image-Groesse (Warnung bei > 200 MB)
- Security Vulnerabilities (via Trivy)
- Health Check nach Build (Container starten, /api/health testen)

## Abhaengigkeiten

- Benoetigt: PROJ-11 (Docker Deployment) - Dockerfile und Health Check Endpoint muessen existieren
- Voraussetzung: Docker >= 20.10 auf dem System
- Voraussetzung: Trivy installiert fuer Security Scan (optional, Script warnt wenn nicht vorhanden)

## User Stories

### DevOps/Administrator
- Als Administrator moechte ich vor einem Basis-Image-Update automatisch pruefen, ob das neue Image kompatibel ist
- Als Administrator moechte ich nach dem Build automatisch die Image-Groesse sehen und eine Warnung bei Ueberschreitung erhalten
- Als Administrator moechte ich einen Security-Scan des neuen Images durchfuehren, bevor ich es deploye
- Als Administrator moechte ich automatisch testen, ob der Container nach dem Build korrekt startet
- Als Administrator moechte ich alle Checks auf einmal durchfuehren koennen, ohne jeden Schritt manuell auszufuehren
- Als Administrator moechte ich eine Zusammenfassung aller Ergebnisse am Ende sehen

### Entwickler
- Als Entwickler moechte ich schnell pruefen koennen, ob meine Dockerfile-Aenderungen das Image kaputt gemacht haben
- Als Entwickler moechte ich Warnungen sehen, aber das Script soll nicht bei jedem Problem abbrechen

## Acceptance Criteria

### Shell-Script Grundstruktur
- [ ] Script `scripts/docker-update-check.sh` im Projekt vorhanden
- [ ] Script ist ausfuehrbar (`chmod +x`)
- [ ] Script hat Shebang `#!/usr/bin/env bash`
- [ ] Script nutzt `set -euo pipefail` fuer robuste Fehlerbehandlung
- [ ] Script hat `--help` Option mit Nutzungsanleitung
- [ ] Script hat farbige Ausgabe (Gruen=OK, Gelb=Warnung, Rot=Fehler)

### Pre-Build Checks (Phase 1)
- [ ] Prueft ob Docker installiert und lauffaehig ist
- [ ] Prueft ob Dockerfile im aktuellen Verzeichnis existiert
- [ ] Extrahiert aktuelles Basis-Image aus Dockerfile (z.B. `node:20-alpine`)
- [ ] Zeigt Release Notes URL fuer das Basis-Image an (Node.js, Alpine)
- [ ] Warnt wenn `latest` Tag verwendet wird (Best Practice: fixe Version)
- [ ] Prueft Architektur-Kompatibilitaet (amd64/arm64)

### Build Phase (Phase 2)
- [ ] Baut das Image mit `docker build -t safedocs:check .`
- [ ] Zeigt Build-Dauer an
- [ ] Faengt Build-Fehler ab und zeigt hilfreiche Fehlermeldung

### Post-Build Checks (Phase 3)

#### Image-Groesse
- [ ] Zeigt Image-Groesse in MB an
- [ ] Warnung wenn Image > 200 MB (konfigurierbar via Variable)
- [ ] Vergleicht mit vorherigem Image falls vorhanden

#### Security Scan (Trivy)
- [ ] Prueft ob Trivy installiert ist
- [ ] Wenn nicht installiert: Warnung + Skip (kein Abbruch)
- [ ] Wenn installiert: `trivy image safedocs:check --severity HIGH,CRITICAL`
- [ ] Zeigt Anzahl gefundener Vulnerabilities
- [ ] Warnung bei HIGH/CRITICAL Vulnerabilities (kein Abbruch)
- [ ] Optional: `--exit-code 1` fuer CI/CD-Modus (Abbruch bei Vulnerabilities)

#### Health Check
- [ ] Startet Container temporaer: `docker run -d --name safedocs-check -p 3099:3000 safedocs:check`
- [ ] Wartet auf Container-Start (max 30 Sekunden)
- [ ] Fuehrt Health Check aus: `curl -sf http://localhost:3099/api/health`
- [ ] Prueft ob Response `{"status":"ok",...}` enthaelt
- [ ] Stoppt und entfernt temporaeren Container nach Test
- [ ] Zeigt Erfolg oder Fehlermeldung

### Zusammenfassung (Phase 4)
- [ ] Zeigt Zusammenfassung aller Checks am Ende
- [ ] Format: Check-Name | Status (OK/WARN/FAIL)
- [ ] Exit-Code 0 wenn alle Checks OK oder nur Warnungen
- [ ] Exit-Code 1 nur bei kritischen Fehlern (Build fehlgeschlagen, Health Check failed)

### Konfiguration
- [ ] `MAX_IMAGE_SIZE_MB=200` (konfigurierbar via Environment-Variable)
- [ ] `TRIVY_SEVERITY="HIGH,CRITICAL"` (konfigurierbar)
- [ ] `HEALTH_CHECK_TIMEOUT=30` (Sekunden, konfigurierbar)
- [ ] `HEALTH_CHECK_PORT=3099` (temporaerer Port, konfigurierbar)

## Edge Cases

- Was passiert wenn Docker nicht laeuft? -> Script zeigt Fehlermeldung und bricht ab
- Was passiert wenn Trivy nicht installiert ist? -> Warnung, Security-Scan wird uebersprungen, andere Checks laufen weiter
- Was passiert wenn der Build fehlschlaegt? -> Script zeigt Build-Output und bricht ab (keine weiteren Checks moeglich)
- Was passiert wenn Port 3099 bereits belegt ist? -> Script versucht alternativen Port oder zeigt Fehlermeldung
- Was passiert wenn Health Check fehlschlaegt? -> Container-Logs werden angezeigt zur Diagnose
- Was passiert bei ARM64-System (Raspberry Pi)? -> Script erkennt Architektur und zeigt entsprechende Infos
- Was passiert wenn kein vorheriges Image zum Vergleich existiert? -> Groessen-Vergleich wird uebersprungen

## Technische Anforderungen

### Neue Datei
- `scripts/docker-update-check.sh` - Hauptscript

### Keine neuen npm-Packages
- Bash-Script, keine Node.js-Abhaengigkeiten
- Externe Tools: `docker`, `curl`, optional `trivy`

### Script-Struktur (Pseudocode)

```bash
#!/usr/bin/env bash
set -euo pipefail

# Farben
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Konfiguration
MAX_IMAGE_SIZE_MB=${MAX_IMAGE_SIZE_MB:-200}
TRIVY_SEVERITY=${TRIVY_SEVERITY:-"HIGH,CRITICAL"}
HEALTH_CHECK_TIMEOUT=${HEALTH_CHECK_TIMEOUT:-30}
HEALTH_CHECK_PORT=${HEALTH_CHECK_PORT:-3099}
IMAGE_NAME="safedocs:check"

# Ergebnis-Tracking
declare -A RESULTS

# Funktionen
print_header() { ... }
print_ok() { ... }
print_warn() { ... }
print_fail() { ... }

check_docker() { ... }
check_dockerfile() { ... }
extract_base_image() { ... }
build_image() { ... }
check_image_size() { ... }
run_trivy_scan() { ... }
run_health_check() { ... }
print_summary() { ... }
cleanup() { ... }

# Hauptablauf
main() {
    print_header "Docker Update Check"

    # Phase 1: Pre-Build
    check_docker
    check_dockerfile
    extract_base_image

    # Phase 2: Build
    build_image

    # Phase 3: Post-Build
    check_image_size
    run_trivy_scan
    run_health_check

    # Phase 4: Summary
    print_summary
    cleanup
}

main "$@"
```

### Beispiel-Output

```
================================================================================
                        Docker Update Check
================================================================================

[Phase 1] Pre-Build Checks
--------------------------
[OK]   Docker is running (version 24.0.7)
[OK]   Dockerfile found
[INFO] Base image: node:20-alpine
[INFO] Release notes: https://github.com/nodejs/node/releases
[OK]   Architecture: linux/amd64

[Phase 2] Build
---------------
[INFO] Building image safedocs:check...
[OK]   Build completed in 45s

[Phase 3] Post-Build Checks
---------------------------
[OK]   Image size: 142 MB (under 200 MB limit)
[OK]   Trivy scan: 0 HIGH, 0 CRITICAL vulnerabilities
[OK]   Health check passed: {"status":"ok","timestamp":"..."}

================================================================================
                           Summary
================================================================================
Pre-Build Checks    [OK]
Build               [OK]
Image Size          [OK]    142 MB
Security Scan       [OK]    0 vulnerabilities
Health Check        [OK]

All checks passed!
================================================================================
```

### Beispiel mit Warnungen

```
================================================================================
                           Summary
================================================================================
Pre-Build Checks    [OK]
Build               [OK]
Image Size          [WARN]  215 MB (exceeds 200 MB limit)
Security Scan       [WARN]  2 HIGH vulnerabilities found
Health Check        [OK]

Completed with warnings. Review issues before deploying.
================================================================================
```

## Zukuenftige Enhancements (nicht Teil von PROJ-14)

- [ ] GitHub Actions Workflow Integration
- [ ] Automatischer Vergleich mit Production-Image
- [ ] Slack/Discord Benachrichtigung bei Problemen
- [ ] SBOM (Software Bill of Materials) Generierung
- [ ] Image-Push zu Registry nach erfolgreichen Checks
- [ ] Rollback-Script bei fehlgeschlagenen Updates
