# Installation & Setup

Anleitung zur Einrichtung des AI Coding Starter Kits mit Supabase (Auth) und Vercel (Hosting).

## Voraussetzungen

- Node.js 18+ installiert
- GitHub Account (Repository bereits gepusht)
- E-Mail-Adresse fuer Supabase und Vercel Accounts

---

## 1. Supabase einrichten

### 1.1 Account erstellen

1. Gehe zu [https://supabase.com](https://supabase.com)
2. Klicke "Start your project" und melde dich mit GitHub an
3. Akzeptiere die Berechtigungen

### 1.2 Neues Projekt erstellen

1. Klicke "New Project"
2. Fuege diese Daten ein:
   - **Organization:** Waehle deine Organisation (oder erstelle eine neue)
   - **Name:** z.B. `ai-coding-starter-kit`
   - **Database Password:** Starkes Passwort waehlen und sicher aufbewahren
   - **Region:** `Central EU (Frankfurt)` (oder naechste Region)
3. Klicke "Create new project"
4. Warte 1-2 Minuten bis das Projekt bereit ist

### 1.3 API Keys kopieren

1. Gehe zu **Project Settings** (Zahnrad-Icon links unten)
2. Klicke auf **API** (unter Configuration)
3. Kopiere diese beiden Werte:
   - **Project URL** → das ist deine `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** Key → das ist dein `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 1.4 Authentication konfigurieren

#### Site URL setzen

1. Gehe zu **Authentication** (linkes Menu)
2. Klicke auf **URL Configuration** (unter Configuration)
3. Setze die **Site URL**:
   - Fuer lokale Entwicklung: `http://localhost:3000`
   - Fuer Vercel: `https://dein-projekt.vercel.app` (nach dem ersten Deployment anpassen)

#### Redirect URLs hinzufuegen

Unter **Redirect URLs** diese URLs hinzufuegen (eine pro Zeile):

```
http://localhost:3000/auth/callback
http://localhost:3000/auth/callback?next=/reset-password/confirm
https://dein-projekt.vercel.app/auth/callback
https://dein-projekt.vercel.app/auth/callback?next=/reset-password/confirm
```

> Ersetze `dein-projekt.vercel.app` spaeter durch deine echte Vercel-Domain.

### 1.5 Datenbank-Migration ausfuehren

Die App benoetigt eine `profiles`-Tabelle in der Datenbank. Diese muss einmalig angelegt werden:

1. Gehe in Supabase zu **SQL Editor** (linkes Menu)
2. Klicke auf **"New Query"**
3. Oeffne die Datei `supabase/migrations/001_create_profiles.sql` aus dem Projekt
4. Kopiere den gesamten Inhalt und fuege ihn in den SQL Editor ein
5. Klicke **"Run"** (oder Ctrl+Enter)
6. Es sollte "Success. No rows returned" erscheinen

Das Script erstellt:
- `profiles`-Tabelle (speichert Name + Email pro User)
- Row Level Security (jeder User sieht nur sein eigenes Profil)
- Automatischer Trigger: Bei Registrierung wird ein Profil-Eintrag erstellt

> **Wichtig:** Diesen Schritt nur einmal ausfuehren! Bei erneutem Ausfuehren passiert nichts Schlimmes (CREATE IF NOT EXISTS), aber die Trigger werden neu erstellt.

#### E-Mail Templates (optional)

1. Gehe zu **Authentication** → **Email Templates**
2. Hier kannst du die E-Mail-Texte fuer Registrierung, Passwort-Reset etc. anpassen
3. Die Standard-Templates funktionieren auch ohne Aenderung

#### E-Mail Provider (optional fuer Produktion)

Supabase hat ein Limit von ~4 E-Mails pro Stunde im Free Tier. Fuer Produktion:

1. Gehe zu **Project Settings** → **Authentication**
2. Unter **SMTP Settings** kannst du einen eigenen SMTP-Server konfigurieren (z.B. Resend, SendGrid, Mailgun)

---

## 2. Lokale Entwicklung einrichten

### 2.1 Repository klonen

```bash
git clone git@github.com:unixweb/ai-coding-starter-kit.git
cd ai-coding-starter-kit
```

### 2.2 Dependencies installieren

```bash
npm install
```

### 2.3 Environment Variables setzen

```bash
cp .env.local.example .env.local
```

Bearbeite `.env.local` und trage die Supabase-Werte ein:

```env
# Supabase (REQUIRED for authentication)
NEXT_PUBLIC_SUPABASE_URL=https://dein-projekt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...

# Registration toggle (set to "false" to disable new user registration)
NEXT_PUBLIC_REGISTRATION_ENABLED=true
```

### 2.4 Entwicklungsserver starten

```bash
npm run dev
```

Die App laeuft jetzt unter [http://localhost:3000](http://localhost:3000).

### 2.5 Testen

1. Oeffne [http://localhost:3000/register](http://localhost:3000/register)
2. Erstelle einen Account mit echter E-Mail-Adresse
3. Pruefe dein E-Mail-Postfach fuer den Bestaetigungslink
4. Klicke den Link → du wirst zum Dashboard weitergeleitet

---

## 3. Vercel einrichten

### 3.1 Account erstellen

1. Gehe zu [https://vercel.com](https://vercel.com)
2. Klicke "Sign Up" und melde dich mit **GitHub** an
3. Erlaube Vercel Zugriff auf deine Repositories

### 3.2 Projekt importieren

1. Klicke auf **"Add New..."** → **"Project"**
2. Unter **"Import Git Repository"** findest du dein Repo `ai-coding-starter-kit`
3. Klicke **"Import"**

### 3.3 Environment Variables setzen

Bevor du "Deploy" klickst, fuege die Environment Variables hinzu:

| Variable | Wert |
|----------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Deine Supabase Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Dein Supabase anon public Key |
| `NEXT_PUBLIC_REGISTRATION_ENABLED` | `true` oder `false` |

So geht's:
1. Klappe den Bereich **"Environment Variables"** auf
2. Trage jeden Key-Value-Pair ein
3. Klicke jeweils **"Add"**

### 3.4 Deploy

1. Klicke **"Deploy"**
2. Warte 1-2 Minuten bis der Build fertig ist
3. Du bekommst eine URL wie `https://ai-coding-starter-kit-abc123.vercel.app`

### 3.5 Supabase Redirect URL aktualisieren

Nachdem du deine Vercel-URL kennst:

1. Gehe zurueck zu **Supabase** → **Authentication** → **URL Configuration**
2. Aendere die **Site URL** auf deine Vercel-URL: `https://deine-url.vercel.app`
3. Stelle sicher dass unter **Redirect URLs** diese Eintraege existieren:
   ```
   https://deine-url.vercel.app/auth/callback
   https://deine-url.vercel.app/auth/callback?next=/reset-password/confirm
   ```

### 3.6 Eigene Domain (optional)

1. In Vercel: **Settings** → **Domains**
2. Fuege deine Domain hinzu (z.B. `app.deine-domain.de`)
3. Konfiguriere den DNS-Eintrag wie angegeben (CNAME auf `cname.vercel-dns.com`)
4. Aktualisiere danach die **Site URL** und **Redirect URLs** in Supabase mit deiner Domain

---

## 4. Automatische Deployments

Vercel deployed automatisch bei jedem Push auf `main`:

```bash
git add -A
git commit -m "deine Aenderung"
git push origin main
```

Innerhalb von 1-2 Minuten ist die neue Version live.

---

## 5. Hinweis zum Datei-Upload (PROJ-7)

Das Datei-Upload Feature speichert Dateien lokal im Dateisystem (`./uploads/`). Das funktioniert **nicht auf Vercel**, da Vercel serverless ist und kein persistentes Dateisystem hat.

| Deployment | Datei-Upload |
|------------|-------------|
| Raspberry Pi / eigener Server | Funktioniert |
| Vercel | Funktioniert **nicht** (Dateien gehen bei Deployment verloren) |

Fuer Datei-Upload auf Vercel muesste das Storage-Backend auf Supabase Storage oder S3 umgestellt werden.

---

## Fehlerbehebung

### "Invalid API Key" beim Login/Register
- Pruefe ob `NEXT_PUBLIC_SUPABASE_URL` und `NEXT_PUBLIC_SUPABASE_ANON_KEY` korrekt sind
- In Vercel: Settings → Environment Variables pruefen

### E-Mail kommt nicht an
- Pruefe den Spam-Ordner
- Supabase Free Tier: max. ~4 E-Mails pro Stunde
- Fuer mehr: SMTP Provider konfigurieren (siehe 1.4)

### "Auth callback error" nach Klick auf E-Mail-Link
- Pruefe ob die Redirect URLs in Supabase korrekt konfiguriert sind
- Die URL muss exakt matchen (inkl. `https://` und Pfad)

### Build schlaegt fehl auf Vercel
- Lokal testen: `npm run build`
- Pruefe ob alle Environment Variables in Vercel gesetzt sind

### Registrierung geht nicht
- Pruefe ob `NEXT_PUBLIC_REGISTRATION_ENABLED` auf `true` steht (oder gar nicht gesetzt ist)
- Wenn bewusst deaktiviert: Auf `false` setzen und `/register` ist gesperrt
