# PROJ-2: User Login

## Status: Planned

## Beschreibung
Registrierte User können sich mit Email und Passwort einloggen. Die Session bleibt nach Browser-Reload automatisch erhalten.

## Zielgruppe
Kleine Teams (2-10 Personen), Startup-Teams

## User Stories
- Als registrierter User möchte ich mich mit Email und Passwort einloggen, um auf mein Dashboard zuzugreifen
- Als eingeloggter User möchte ich nach einem Browser-Reload eingeloggt bleiben, damit ich nicht ständig meine Credentials eingeben muss
- Als User möchte ich bei falschen Login-Daten eine klare Fehlermeldung sehen
- Als User möchte ich einen Link zur Registrierung sehen, falls ich noch keinen Account habe
- Als User möchte ich einen Link zum Passwort-Reset sehen, falls ich mein Passwort vergessen habe

## Acceptance Criteria
- [ ] Login-Formular enthält Felder: Email, Passwort
- [ ] Bei korrekten Credentials wird der User eingeloggt und zum Dashboard weitergeleitet
- [ ] Bei falschen Credentials wird eine generische Fehlermeldung angezeigt ("Email oder Passwort falsch") -- keine Hinweise ob Email existiert
- [ ] Session bleibt nach Browser-Reload/Tab-Schließen erhalten (automatisch)
- [ ] Formular zeigt Ladezustand während des Logins (Button disabled + Spinner)
- [ ] Link zur Registrierung vorhanden ("Noch kein Account? Hier registrieren")
- [ ] Link zum Passwort-Reset vorhanden ("Passwort vergessen?")
- [ ] Geschützte Seiten (z.B. Dashboard) leiten nicht-eingeloggte User zum Login weiter
- [ ] Nach Login-Redirect wird der User zum Dashboard weitergeleitet

## Edge Cases
- Was passiert bei falscher Email? -> Generische Fehlermeldung (kein Hinweis ob Email existiert)
- Was passiert bei falschem Passwort? -> Generische Fehlermeldung
- Was passiert bei Netzwerkfehler? -> Fehlermeldung + Retry möglich
- Was passiert wenn User bereits eingeloggt ist und Login-Seite aufruft? -> Redirect zum Dashboard
- Was passiert wenn Session abläuft? -> Redirect zum Login mit Hinweis
- Was passiert bei Brute-Force-Versuchen? -> Rate Limiting (Standard: 5 Versuche pro Minute)

## Abhängigkeiten
- Benötigt: PROJ-1 (User Registration) -- für existierende User-Accounts

## Technische Anforderungen
- Performance: Login < 1s Response Time
- Security: Rate Limiting (5 Versuche/Minute), generische Fehlermeldungen, Session-Token sicher speichern
- Accessibility: Formular ist keyboard-navigierbar, Screen-Reader kompatibel

## Tech-Design (Solution Architect)

### Component-Struktur
```
/login (Login-Seite)
├── App Header (Logo + Link zur Registrierung)
├── Login-Card (zentriert)
│   ├── Titel: "Willkommen zurück"
│   ├── Login-Formular
│   │   ├── Email-Feld (Eingabe)
│   │   ├── Passwort-Feld (Eingabe mit Sichtbarkeits-Toggle)
│   │   ├── "Passwort vergessen?"-Link → /reset-password
│   │   ├── Fehlermeldung (generisch, bei falschen Credentials)
│   │   └── "Einloggen"-Button (mit Lade-Spinner)
│   └── Footer-Link: "Noch kein Account? Hier registrieren" → /register
└── Toast-Benachrichtigungen (Fehler)

/dashboard (Geschützte Seite)
├── Header mit Navigation
│   ├── Logo
│   ├── Navigation-Links
│   └── User-Bereich (Name + Logout-Button)
└── Dashboard-Inhalt (Platzhalter für zukünftige Features)
```

### Daten-Model
```
Für Login werden verwendet:
- Email + Passwort → Supabase Auth prüft Credentials
- Session-Token → automatisch von Supabase verwaltet
- Session bleibt im Browser gespeichert (Supabase nutzt localStorage)

Keine neuen Tabellen nötig!
Supabase Auth managt Sessions automatisch.
```

### Tech-Entscheidungen
```
Warum Supabase Auth für Session-Management?
→ Sessions werden automatisch im Browser gespeichert und bei jedem
  Request mitgesendet. Kein manueller Token-Refresh nötig.

Warum Next.js Middleware für geschützte Seiten?
→ Middleware prüft bei jedem Seitenaufruf, ob ein gültiger
  Session-Token existiert. Nicht-eingeloggte User werden automatisch
  zum Login weitergeleitet. Zentral an einer Stelle konfiguriert.

Warum generische Fehlermeldung bei Login?
→ Sicherheit: "Email oder Passwort falsch" verrät nicht, ob die
  Email existiert. Schützt vor Account-Enumeration-Angriffen.

Warum Rate Limiting über Supabase?
→ Supabase hat eingebautes Rate Limiting für Auth-Endpoints.
  Kein eigener Code nötig.
```

### Seitenstruktur
```
Neue Seiten:
- /login → Login-Formular
- /dashboard → Geschützte Hauptseite (Platzhalter)

Neue Komponenten:
- AuthProvider → Stellt Auth-Status für die ganze App bereit
- ProtectedRoute → Leitet nicht-eingeloggte User zum Login um

Neue Infrastruktur:
- Middleware → Prüft Auth-Status bei geschützten Routen
- Supabase Client (aktiviert) → Browser + Server Client

Wiederverwendete shadcn/ui Komponenten:
- Card, Input, Button, Form, Label, Toast
```

### Dependencies
```
Keine neuen Packages nötig!
Alles bereits vorhanden:
- @supabase/supabase-js (Auth + Session)
- react-hook-form + zod (Formulare + Validierung)
- shadcn/ui Komponenten (UI)
```
