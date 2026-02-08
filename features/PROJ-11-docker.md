# PROJ-11: Docker Image fuer Self-Hosting

## Status: Planned

## Beschreibung
Die SafeDocs Portal App wird als Docker Image bereitgestellt, um Self-Hosting ausserhalb von Vercel zu ermoeglichen. Das Image nutzt einen Multi-Stage Build mit Next.js Standalone Output, um ein moeglichst kleines und sicheres Image zu erzeugen. Alle externen Services (Supabase, Vercel Blob, Brevo) bleiben Cloud-gehostet -- der Docker Container enthaelt ausschliesslich die Next.js Applikation. Ein Health Check Endpoint und docker-compose.yml fuer lokales Development werden ebenfalls bereitgestellt.

## Zielgruppe
- **Primaer:** DevOps/Administratoren, die SafeDocs auf eigener Infrastruktur betreiben wollen (VPS, Kubernetes, NAS, Raspberry Pi)
- **Sekundaer:** Entwickler, die eine reproduzierbare lokale Entwicklungsumgebung benoetigen

## Abhaengigkeiten
- Benoetigt: Keine Feature-Abhaengigkeiten (Docker ist ein Deployment-Feature, unabhaengig von allen PROJ-1..10)
- Voraussetzung: Docker >= 20.10 auf dem Zielsystem
- Voraussetzung: Zugang zu Supabase-Instanz (Cloud oder Self-Hosted)
- Voraussetzung: Vercel Blob Store mit gueltigem `BLOB_READ_WRITE_TOKEN`
- Optional: Brevo-Account mit API-Key (nur fuer E-Mail-Versand)

## User Stories

### DevOps/Administrator
- Als Administrator moechte ich die SafeDocs App mit einem einzigen `docker run`-Befehl starten koennen
- Als Administrator moechte ich alle Konfiguration ueber Environment-Variablen steuern, ohne das Image neu bauen zu muessen
- Als Administrator moechte ich einen Health Check Endpoint haben, um den Container-Status zu ueberwachen
- Als Administrator moechte ich, dass der Container als Non-Root-User laeuft (Sicherheit)
- Als Administrator moechte ich ein moeglichst kleines Image (<200 MB), um Speicher und Deployment-Zeit zu sparen
- Als Administrator moechte ich das Image hinter einem Reverse Proxy (nginx, Traefik, Caddy) betreiben koennen

### Entwickler
- Als Entwickler moechte ich die App lokal mit `docker compose up` starten koennen
- Als Entwickler moechte ich eine `.env`-Datei fuer die Docker-Konfiguration verwenden koennen
- Als Entwickler moechte ich das Image lokal bauen und testen koennen, bevor ich es deploye

## Acceptance Criteria

### Dockerfile (Multi-Stage Build)
- [ ] Dockerfile im Projekt-Root vorhanden
- [ ] Multi-Stage Build mit mindestens 3 Stages: `deps`, `builder`, `runner`
- [ ] Stage 1 (`deps`): Installiert nur Production-Dependencies (`npm ci --omit=dev`)
- [ ] Stage 2 (`builder`): Installiert alle Dependencies, fuehrt `npm run build` aus
- [ ] Stage 3 (`runner`): Kopiert nur das Standalone-Output und statische Assets
- [ ] Basis-Image: `node:20-alpine` (oder `node:22-alpine` falls kompatibel)
- [ ] Next.js `output: "standalone"` in `next.config.ts` konfiguriert
- [ ] Finales Image enthaelt KEINEN Quellcode, keine devDependencies, kein `node_modules` (ausser standalone)
- [ ] Image-Groesse unter 200 MB (komprimiert)
- [ ] `.dockerignore` vorhanden (schliesst `node_modules`, `.next`, `.git`, `.env*.local` aus)

### Non-Root User (Sicherheit)
- [ ] Im Runner-Stage wird ein dedizierter User `nextjs` (UID 1001) und Gruppe `nodejs` (GID 1001) erstellt
- [ ] `USER nextjs` wird vor dem `CMD` gesetzt
- [ ] Kein `root`-Zugriff im laufenden Container
- [ ] `/app`-Verzeichnis und `.next/`-Cache gehoeren dem `nextjs`-User

### Environment-Variablen
- [ ] Alle Konfiguration erfolgt ueber Environment-Variablen (kein Hardcoding)
- [ ] Folgende Variablen muessen beim Start gesetzt werden:
  - `NEXT_PUBLIC_SUPABASE_URL` (Pflicht) -- Supabase Projekt-URL
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Pflicht) -- Supabase Anon Key
  - `SUPABASE_SERVICE_ROLE_KEY` (Pflicht) -- Supabase Service Role Key (fuer RLS-Bypass)
  - `BLOB_READ_WRITE_TOKEN` (Pflicht) -- Vercel Blob Store Token
  - `NEXT_PUBLIC_REGISTRATION_ENABLED` (Optional, Default: `true`) -- Registrierung an/aus
  - `NEXT_PUBLIC_APP_URL` (Empfohlen) -- Oeffentliche URL der App (fuer E-Mail-Links)
  - `BREVO_API_KEY` (Optional) -- Brevo API Key fuer E-Mail-Versand
  - `BREVO_SENDER_EMAIL` (Optional, Default: `noreply@safedocsportal.com`) -- Absender-E-Mail
  - `BREVO_SENDER_NAME` (Optional, Default: `SafeDocs Portal`) -- Absender-Name
  - `PORT` (Optional, Default: `3000`) -- Port fuer den Next.js Server
  - `HOSTNAME` (Optional, Default: `0.0.0.0`) -- Bind-Adresse
- [ ] `NEXT_PUBLIC_*`-Variablen werden zur Build-Zeit eingebettet (Client-Side)
- [ ] Nicht-Public-Variablen werden zur Laufzeit gelesen (Server-Side)

### NEXT_PUBLIC Build-Zeit vs. Laufzeit Problem
- [ ] Dokumentation im README/Spec: `NEXT_PUBLIC_*`-Variablen werden beim `docker build` fest eingebettet
- [ ] Loesung Option A (empfohlen): Build-Args im Dockerfile fuer `NEXT_PUBLIC_*`-Variablen
  - `docker build --build-arg NEXT_PUBLIC_SUPABASE_URL=... --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=... .`
  - ARG-Anweisungen im Dockerfile mit ENV-Zuweisung im Builder-Stage
- [ ] Loesung Option B (alternativ): Laufzeit-Ersetzung via Entrypoint-Script
  - Shell-Script ersetzt Platzhalter in den gebauten JS-Dateien beim Container-Start
  - Komplexer, aber erlaubt ein generisches Image fuer verschiedene Umgebungen
- [ ] Fuer MVP: Option A (Build-Args) umsetzen, Option B als zukuenftiges Enhancement dokumentieren

### Health Check Endpoint
- [ ] `GET /api/health` Endpoint vorhanden
- [ ] Gibt `200 OK` mit JSON zurueck: `{ "status": "ok", "timestamp": "..." }`
- [ ] Keine Authentifizierung erforderlich (oeffentlich)
- [ ] Route in `publicRoutes`-Array in `supabase-middleware.ts` registriert
- [ ] Optional: Prueft Supabase-Verbindung (DB-Ping) und gibt `{ "status": "degraded" }` bei Fehler
- [ ] Dockerfile enthaelt `HEALTHCHECK`-Anweisung: `HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD wget -qO- http://localhost:3000/api/health || exit 1`

### docker-compose.yml
- [ ] `docker-compose.yml` im Projekt-Root fuer lokales Development
- [ ] Service `app`: Baut das Image aus dem lokalen Dockerfile
- [ ] Port-Mapping: `3000:3000` (konfigurierbar)
- [ ] Environment-Variablen aus `.env`-Datei laden (`env_file: .env`)
- [ ] `.env.docker.example` als Vorlage fuer die Docker-spezifische `.env`-Datei
- [ ] Kein Supabase/PostgreSQL-Container (bleibt extern/Cloud)
- [ ] Optional: Volume-Mount fuer persistenten `.next/cache` (Performance)

### .dockerignore
- [ ] Datei `.dockerignore` im Projekt-Root
- [ ] Schliesst aus: `node_modules`, `.next`, `.git`, `.env*.local`, `*.md` (ausser README), `.claude`, `features`, `supabase`, `.vercel`

### Vercel Blob Kompatibilitaet
- [ ] Dokumentation: Vercel Blob (`@vercel/blob`) funktioniert auch ausserhalb von Vercel
- [ ] Voraussetzung: `BLOB_READ_WRITE_TOKEN` muss gesetzt sein (Token aus Vercel Dashboard kopieren)
- [ ] Die `@vercel/blob`-SDK kommuniziert ueber HTTPS mit dem Vercel Blob Store -- kein Vercel-spezifischer Runtime noetig
- [ ] Upload/Download/List-Operationen funktionieren identisch wie auf Vercel
- [ ] Einschraenkung dokumentieren: `onUploadCompleted`-Callbacks funktionieren nur, wenn die App oeffentlich erreichbar ist (kein localhost)
- [ ] Blob-Daten bleiben auf Vercel-Servern gespeichert (kein echter Self-Hosted-Storage)
- [ ] Alternative fuer echtes Self-Hosting: Hinweis auf S3-kompatible Alternativen (MinIO) als zukuenftiges Enhancement

## Edge Cases
- Was passiert wenn `NEXT_PUBLIC_*`-Variablen zur Build-Zeit nicht gesetzt sind? -> Build schlaegt fehl oder App zeigt `undefined` fuer Supabase-URL. Muss ueber Build-Args gesetzt werden.
- Was passiert wenn das Image auf ARM64 (Raspberry Pi) laufen soll? -> `node:20-alpine` unterstuetzt linux/arm64. Multi-Platform Build mit `docker buildx` dokumentieren.
- Was passiert wenn der Container keinen Internetzugang hat? -> Supabase, Vercel Blob und Brevo sind nicht erreichbar. Health Check gibt `degraded` zurueck. App ist nicht funktionsfaehig.
- Was passiert bei Container-Neustart? -> Kein Datenverlust, da alle Daten in Supabase und Vercel Blob gespeichert sind. Der Container ist stateless.
- Was passiert wenn `PORT` geaendert wird? -> Next.js Standalone Server liest `PORT` automatisch. HEALTHCHECK im Dockerfile muss ggf. angepasst werden (oder dynamisch).
- Was passiert bei mehreren Container-Instanzen (Horizontal Scaling)? -> Funktioniert, da der Container stateless ist. Session-State liegt in Supabase (Cookies). Kein Shared-State im Container.
- Was passiert wenn kein Reverse Proxy davor steht? -> App laeuft auf HTTP (kein TLS). Fuer Production wird ein Reverse Proxy mit TLS-Terminierung empfohlen.

## Technische Anforderungen

### next.config.ts Aenderung
- Hinzufuegen: `output: "standalone"` in der NextConfig
- Bestehende Header-Konfiguration bleibt unveraendert
- Standalone Output erzeugt `.next/standalone/` mit minimaler `node_modules`-Kopie und `server.js`

### Neuer API-Endpoint: GET /api/health
- Datei: `src/app/api/health/route.ts`
- Response: `{ status: "ok", timestamp: "2026-02-08T12:00:00.000Z" }`
- Oeffentliche Route (keine Auth), in `publicRoutes` registrieren
- Optional: Supabase-Ping fuer erweiterten Health Check

### Neue Dateien
- `Dockerfile` (Projekt-Root)
- `.dockerignore` (Projekt-Root)
- `docker-compose.yml` (Projekt-Root)
- `.env.docker.example` (Projekt-Root)
- `src/app/api/health/route.ts` (Health Check Endpoint)

### Angepasste Dateien
- `next.config.ts` -- `output: "standalone"` hinzufuegen
- `src/lib/supabase-middleware.ts` -- `/api/health` zu `publicRoutes` hinzufuegen

### Keine neuen npm-Packages
- Docker und docker-compose sind Host-Tools, keine npm-Dependencies
- `wget` ist im Alpine-Image fuer HEALTHCHECK enthalten

## Tech-Design (Solution Architect)

### Dockerfile (Multi-Stage Build)

```dockerfile
# ---- Stage 1: Dependencies ----
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# ---- Stage 2: Builder ----
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .

# Build-Args fuer NEXT_PUBLIC_* Variablen (zur Build-Zeit eingebettet)
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_REGISTRATION_ENABLED=true
ARG NEXT_PUBLIC_APP_URL

ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_REGISTRATION_ENABLED=$NEXT_PUBLIC_REGISTRATION_ENABLED
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL

RUN npm run build

# ---- Stage 3: Runner ----
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

# Non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Kopiere statische Assets
COPY --from=builder /app/public ./public

# Kopiere Standalone Build
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/health || exit 1

CMD ["node", "server.js"]
```

### next.config.ts Aenderung

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    output: "standalone",   // <-- NEU: Standalone Output fuer Docker
    async headers() {
        return [
            {
                source: "/:path*",
                headers: [
                    { key: "X-Frame-Options", value: "DENY" },
                    { key: "X-Content-Type-Options", value: "nosniff" },
                    { key: "Referrer-Policy", value: "origin-when-cross-origin" },
                    { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
                ],
            },
        ];
    },
};

export default nextConfig;
```

### Health Check Endpoint

```typescript
// src/app/api/health/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
}
```

### Middleware-Anpassung (publicRoutes)

```typescript
// In src/lib/supabase-middleware.ts, publicRoutes Array erweitern:
const publicRoutes = [
    "/login",
    "/register",
    "/reset-password",
    "/auth/callback",
    "/api/auth/",
    "/p/",
    "/api/portal/submit",
    "/api/portal/verify",
    "/api/health",            // <-- NEU: Health Check
];
```

### .dockerignore

```
node_modules
.next
.git
.gitignore
.env*.local
.claude
features
supabase
.vercel
*.md
!README.md
.DS_Store
*.pem
npm-debug.log*
coverage
tsconfig.tsbuildinfo
next-env.d.ts
```

### docker-compose.yml

```yaml
services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
      args:
        NEXT_PUBLIC_SUPABASE_URL: ${NEXT_PUBLIC_SUPABASE_URL}
        NEXT_PUBLIC_SUPABASE_ANON_KEY: ${NEXT_PUBLIC_SUPABASE_ANON_KEY}
        NEXT_PUBLIC_REGISTRATION_ENABLED: ${NEXT_PUBLIC_REGISTRATION_ENABLED:-true}
        NEXT_PUBLIC_APP_URL: ${NEXT_PUBLIC_APP_URL:-http://localhost:3000}
    ports:
      - "${PORT:-3000}:3000"
    env_file:
      - .env.docker
    environment:
      - NODE_ENV=production
      - HOSTNAME=0.0.0.0
      - PORT=3000
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 10s
```

### .env.docker.example

```bash
# ===========================================================
# SafeDocs Portal - Docker Environment Variables
# ===========================================================
# Kopieren Sie diese Datei nach .env.docker und setzen Sie die Werte.
# NEXT_PUBLIC_*-Variablen werden zur BUILD-ZEIT eingebettet.
# Alle anderen Variablen werden zur LAUFZEIT gelesen.
# ===========================================================

# --- Supabase (PFLICHT) ---
# Supabase Projekt-URL und Keys
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# --- Vercel Blob Storage (PFLICHT) ---
# Token aus Vercel Dashboard → Storage → Blob Store kopieren
BLOB_READ_WRITE_TOKEN=your_blob_read_write_token_here

# --- App-Konfiguration ---
# Oeffentliche URL der App (fuer E-Mail-Links und Redirects)
NEXT_PUBLIC_APP_URL=https://your-domain.com

# Registrierung neuer User erlauben (true/false)
NEXT_PUBLIC_REGISTRATION_ENABLED=true

# --- Brevo E-Mail-Versand (OPTIONAL) ---
# Nur noetig wenn E-Mail-Versand von Zugangslinks gewuenscht ist
# BREVO_API_KEY=your_brevo_api_key_here
# BREVO_SENDER_EMAIL=noreply@yourdomain.com
# BREVO_SENDER_NAME=SafeDocs Portal

# --- Server-Konfiguration ---
# PORT=3000
# HOSTNAME=0.0.0.0
```

### Architektur-Ueberblick

```
┌─────────────────────────────────────────────────────┐
│                    Docker Host                       │
│  ┌───────────────────────────────────────────────┐  │
│  │         SafeDocs Container (Port 3000)         │  │
│  │  ┌─────────────────────────────────────────┐  │  │
│  │  │   Next.js Standalone Server (node.js)   │  │  │
│  │  │   - Server Components                   │  │  │
│  │  │   - API Routes                          │  │  │
│  │  │   - Static Assets                       │  │  │
│  │  │   - User: nextjs (UID 1001)             │  │  │
│  │  └──────────┬──────────┬──────────┬────────┘  │  │
│  └─────────────┼──────────┼──────────┼───────────┘  │
│                │          │          │               │
└────────────────┼──────────┼──────────┼───────────────┘
                 │          │          │
        HTTPS    │          │          │   HTTPS
                 ▼          ▼          ▼
          ┌──────────┐ ┌────────┐ ┌────────┐
          │ Supabase │ │ Vercel │ │ Brevo  │
          │ (Auth+DB)│ │  Blob  │ │(E-Mail)│
          └──────────┘ └────────┘ └────────┘
            Cloud        Cloud      Cloud
```

### Externe Services (bleiben Cloud-gehostet)

```
Was laeuft IM Container:
- Next.js App (Server + Client Components)
- API Routes (Auth-Checks, File-Handling, E-Mail-Versand)
- Statische Assets (CSS, JS, Bilder)
- Health Check Endpoint

Was bleibt AUSSERHALB des Containers (Cloud):
- Supabase PostgreSQL (Datenbank + RLS)
- Supabase Auth (Authentifizierung, Session-Management)
- Vercel Blob Store (Datei-Storage)
- Brevo (E-Mail-Versand API)

Warum kein Self-Hosted Supabase im Container?
→ Supabase Self-Hosting erfordert PostgreSQL, GoTrue, PostgREST, etc.
  Das ist ein eigenes komplexes Setup (supabase/supabase Docker Compose
  hat 10+ Services). Wuerde den Scope von PROJ-11 sprengen.
  Kann als separates PROJ fuer Kunden mit On-Premise-Anforderung
  evaluiert werden.

Warum kein lokaler Blob-Storage im Container?
→ @vercel/blob nutzt die Vercel Blob Store API ueber HTTPS.
  Das SDK funktioniert auch ausserhalb von Vercel, solange
  BLOB_READ_WRITE_TOKEN gesetzt ist. Die Daten liegen aber
  weiterhin auf Vercel-Servern.
  Fuer echtes On-Premise-Storage muesste @vercel/blob durch
  eine S3-kompatible Loesung (z.B. MinIO) ersetzt werden.
  Das ist ein separates Feature (PROJ-Nachfolge).
```

### Tech-Entscheidungen

```
Warum Multi-Stage Build?
→ Minimiert die Image-Groesse drastisch. Der Builder-Stage enthaelt
  alle devDependencies und TypeScript-Compiler, aber der Runner-Stage
  kopiert nur das standalone Output (~50-80 MB statt ~500+ MB).
  Kein Quellcode im finalen Image.

Warum node:20-alpine (nicht node:22)?
→ Node.js 20 ist LTS (Support bis April 2026). Alpine-basiert fuer
  minimale Groesse (~50 MB Base). Node 22 ist aktueller, aber Next.js 16
  ist mit Node 20 getestet. Falls Node 22 benoetigt wird, kann das
  Basis-Image einfach ausgetauscht werden.

Warum output: "standalone" in next.config.ts?
→ Next.js Standalone Output erzeugt eine selbststaendige server.js
  mit minimaler node_modules-Kopie (nur benoetigte Packages).
  Kein `npm start` oder `next start` noetig, nur `node server.js`.
  Offizielle Next.js-Empfehlung fuer Docker-Deployments.
  Hat KEINEN negativen Einfluss auf Vercel-Deployments (Vercel
  ignoriert die output-Option und nutzt eigenes Build-System).

Warum Build-Args fuer NEXT_PUBLIC_*?
→ Next.js baked NEXT_PUBLIC_*-Variablen zur Build-Zeit in die
  Client-Side JS-Bundles ein. Im Docker-Kontext bedeutet das:
  Diese Werte muessen beim `docker build` bekannt sein, nicht
  erst beim `docker run`. Build-Args sind die sauberste Loesung.
  Alternative (Runtime-Replacement via sed) ist fragil und fehleranfaellig.

Warum HOSTNAME=0.0.0.0?
→ Next.js Standalone Server bindet standardmaessig auf localhost.
  In Docker muss der Server auf 0.0.0.0 binden, damit Port-Forwarding
  funktioniert. Ohne diese Einstellung ist die App von aussen
  nicht erreichbar (nur innerhalb des Containers).

Warum wget statt curl fuer HEALTHCHECK?
→ Alpine-basierte Node.js-Images haben wget vorinstalliert,
  aber nicht curl. wget -qO- ist aequivalent zu curl -sf.
  Kein zusaetzliches Package noetig.

Warum kein Nginx im Container?
→ KISS-Prinzip. Next.js Standalone Server dient statische Dateien
  selbst aus. Fuer TLS-Terminierung und Caching wird ein separater
  Reverse Proxy empfohlen (Traefik, Caddy, nginx als Host-Service).
  Ein zusaetzlicher Nginx im Container wuerde Multi-Process-Management
  (supervisord) erfordern und die Komplexitaet erhoehen.

Warum keine Docker-Volumes fuer Daten?
→ Der Container ist vollstaendig stateless. Alle persistenten Daten
  liegen in Supabase (DB) und Vercel Blob (Dateien). Ein Volume
  fuer .next/cache ist optional und verbessert nur die Build-Performance
  bei Neustarts (ISR-Cache).

Warum kein Docker-basiertes Supabase?
→ Supabase Self-Hosting erfordert 10+ Docker-Services (PostgreSQL,
  GoTrue, PostgREST, Realtime, Storage, Kong, Studio, etc.).
  Ein docker-compose.yml mit allem wuerde den Scope von PROJ-11
  massiv erweitern und die Komplexitaet verdreifachen.
  Separate Evaluierung empfohlen fuer On-Premise-Kunden.
```

### Dependencies

```
Keine neuen npm-Packages!

Neue Host-Tools (nicht im Image):
- Docker >= 20.10         -> Container-Runtime
- Docker Compose v2       -> Lokales Development (optional)
- docker buildx           -> Multi-Platform Builds (optional, fuer ARM64)

Aenderungen an bestehenden Konfigurationen:
- next.config.ts          -> output: "standalone" hinzufuegen
- supabase-middleware.ts   -> /api/health zu publicRoutes

Neue Dateien (5):
- Dockerfile              -> Multi-Stage Build Definition
- .dockerignore            -> Build-Context-Filter
- docker-compose.yml       -> Lokales Development Setup
- .env.docker.example      -> Environment-Variablen Vorlage
- src/app/api/health/route.ts -> Health Check Endpoint
```

### Build- und Run-Befehle

```bash
# --- Image bauen ---
docker build \
  --build-arg NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co \
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key \
  --build-arg NEXT_PUBLIC_APP_URL=https://your-domain.com \
  -t safedocs:latest .

# --- Container starten ---
docker run -d \
  --name safedocs \
  -p 3000:3000 \
  -e SUPABASE_SERVICE_ROLE_KEY=your_service_role_key \
  -e BLOB_READ_WRITE_TOKEN=your_blob_token \
  -e BREVO_API_KEY=your_brevo_key \
  safedocs:latest

# --- Mit docker-compose ---
# 1. .env.docker.example nach .env.docker kopieren und ausfuellen
# 2. docker compose up -d

# --- Multi-Platform Build (ARM64 + AMD64) ---
docker buildx build --platform linux/amd64,linux/arm64 \
  --build-arg NEXT_PUBLIC_SUPABASE_URL=... \
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=... \
  -t safedocs:latest .

# --- Health Check manuell pruefen ---
curl http://localhost:3000/api/health
# -> { "status": "ok", "timestamp": "2026-02-08T12:00:00.000Z" }
```

### Sicherheitsaspekte

```
1. Non-Root User
   - Container laeuft als User "nextjs" (UID 1001)
   - Kein Root-Zugriff im Container
   - Minimale Rechte auf Dateisystem

2. Minimales Image
   - Alpine-basiert (keine unnoetige Software)
   - Nur Standalone-Output kopiert (kein Quellcode, keine devDependencies)
   - Kein Shell-Zugang fuer Angreifer nutzbar (Alpine hat busybox ash)

3. Kein Quellcode im Image
   - Builder-Stage wird verworfen
   - Nur kompiliertes JavaScript im finalen Image

4. Environment-Variablen
   - Secrets (Service Role Key, Blob Token, Brevo Key) werden NICHT
     in Build-Args uebergeben (nur zur Laufzeit via -e oder env_file)
   - NEXT_PUBLIC_*-Variablen sind per Definition oeffentlich (Client-Side)
   - Secrets niemals in NEXT_PUBLIC_*-Variablen speichern

5. Netzwerk
   - Container exposed nur Port 3000
   - TLS-Terminierung erfolgt ueber externen Reverse Proxy
   - Security-Header (X-Frame-Options, HSTS, etc.) sind in next.config.ts konfiguriert

6. .dockerignore
   - Verhindert, dass .env.local, .git, und Secrets in den Build-Context gelangen
```

### Vercel Blob Kompatibilitaet (Detail)

```
Die @vercel/blob SDK funktioniert ausserhalb von Vercel, WENN:
1. BLOB_READ_WRITE_TOKEN als Environment-Variable gesetzt ist
2. Der Container Internetzugang hat (HTTPS zu blob.vercel-storage.com)

Funktioniert:
- put() -- Dateien hochladen
- list() -- Dateien auflisten
- del() -- Dateien loeschen
- head() -- Datei-Metadaten abrufen
- Alle Operationen in /api/files/ und /api/portal/submit

Einschraenkung:
- onUploadCompleted Callback funktioniert nur wenn die App oeffentlich
  erreichbar ist (nicht auf localhost). SafeDocs nutzt diesen Callback
  NICHT, daher kein Problem.

Wichtig zu wissen:
- Blob-Daten liegen weiterhin auf Vercel-Servern (kein echtes On-Premise)
- Fuer echtes On-Premise-Storage waere ein Austausch von @vercel/blob
  durch eine S3-kompatible Loesung noetig (z.B. MinIO + aws-sdk)
- Das ist ein separates Feature und nicht Teil von PROJ-11
```

### Deployment-Szenarien

```
Szenario 1: VPS mit Reverse Proxy (empfohlen)
├── Reverse Proxy (Caddy/Traefik/nginx) -> TLS, Port 443
│   └── SafeDocs Container -> Port 3000
├── Supabase Cloud
├── Vercel Blob Cloud
└── Brevo Cloud

Szenario 2: Raspberry Pi / Homelab
├── SafeDocs Container -> Port 3000 (HTTP)
├── Optional: Cloudflare Tunnel fuer HTTPS
├── Supabase Cloud
├── Vercel Blob Cloud
└── Brevo Cloud

Szenario 3: Kubernetes
├── Deployment mit 1-N Replicas (stateless, horizontal skalierbar)
├── Service + Ingress (TLS)
├── ConfigMap fuer NEXT_PUBLIC_* (Build-Args -> Custom Image)
├── Secrets fuer SUPABASE_SERVICE_ROLE_KEY, BLOB_READ_WRITE_TOKEN, BREVO_API_KEY
├── Liveness/Readiness Probe: GET /api/health
└── Externe Services: Supabase, Vercel Blob, Brevo

Szenario 4: Docker Compose (lokales Development)
├── docker compose up -d
├── .env.docker Datei mit allen Variablen
├── http://localhost:3000
└── Externe Services: Supabase Cloud, Vercel Blob
```
