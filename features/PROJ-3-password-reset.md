# PROJ-3: Passwort Reset

## Status: Planned

## Beschreibung
User können ihr Passwort über einen Email-Link zurücksetzen, falls sie es vergessen haben.

## Zielgruppe
Kleine Teams (2-10 Personen), Startup-Teams

## User Stories
- Als User möchte ich auf der Login-Seite "Passwort vergessen?" klicken können, um den Reset-Prozess zu starten
- Als User möchte ich meine Email eingeben und einen Reset-Link per Email erhalten
- Als User möchte ich über den Email-Link ein neues Passwort setzen können
- Als User möchte ich nach erfolgreichem Passwort-Reset automatisch zum Login weitergeleitet werden
- Als User möchte ich eine Bestätigung sehen, dass die Reset-Email gesendet wurde (unabhängig davon, ob die Email existiert)

## Acceptance Criteria
- [ ] "Passwort vergessen?"-Link auf der Login-Seite leitet zur Reset-Anfrage-Seite
- [ ] Reset-Anfrage-Formular enthält Feld: Email
- [ ] Nach Absenden wird immer eine Erfolgsmeldung angezeigt ("Falls ein Account existiert, wurde eine Email gesendet") -- keine Information ob Email existiert
- [ ] Reset-Email enthält einen einmaligen, zeitlich begrenzten Link (gültig für 1 Stunde)
- [ ] Reset-Link führt zu einem Formular: Neues Passwort + Passwort bestätigen
- [ ] Neues Passwort muss gleiche Anforderungen erfüllen wie bei Registrierung (Min. 8 Zeichen + Groß/Klein + Zahl)
- [ ] Nach erfolgreichem Reset wird der User zum Login weitergeleitet mit Erfolgsmeldung
- [ ] Verwendeter Reset-Link wird invalidiert (Einmalverwendung)
- [ ] Formular zeigt Ladezustand während des Sendens

## Edge Cases
- Was passiert bei nicht-existierender Email? -> Gleiche Erfolgsmeldung (kein Hinweis ob Account existiert)
- Was passiert bei abgelaufenem Reset-Link? -> Fehlermeldung "Link abgelaufen" + neuen Link anfordern
- Was passiert bei bereits verwendetem Reset-Link? -> Fehlermeldung "Link bereits verwendet"
- Was passiert bei mehrfacher Reset-Anfrage? -> Nur der neueste Link ist gültig, alte werden invalidiert
- Was passiert bei Netzwerkfehler? -> Fehlermeldung + Retry möglich

## Abhängigkeiten
- Benötigt: PROJ-1 (User Registration) -- für existierende User-Accounts
- Benötigt: PROJ-2 (User Login) -- für "Passwort vergessen?"-Link auf Login-Seite

## Technische Anforderungen
- Performance: Email-Versand < 5s
- Security: Reset-Token kryptographisch sicher, zeitlich begrenzt (1h), Einmalverwendung
- Security: Rate Limiting für Reset-Anfragen (3 pro Stunde pro Email)

## Tech-Design (Solution Architect)

### Component-Struktur
```
/reset-password (Reset anfordern)
├── App Header (Logo + Link zum Login)
├── Reset-Anfrage-Card (zentriert)
│   ├── Titel: "Passwort zurücksetzen"
│   ├── Beschreibung: "Gib deine Email ein, wir senden dir einen Reset-Link"
│   ├── Reset-Formular
│   │   ├── Email-Feld (Eingabe)
│   │   └── "Reset-Link senden"-Button (mit Lade-Spinner)
│   ├── Erfolgsmeldung (nach Absenden): "Falls ein Account existiert..."
│   └── Footer-Link: "Zurück zum Login" → /login
└── Toast-Benachrichtigungen

/reset-password/confirm (Neues Passwort setzen)
├── App Header (Logo)
├── Neues-Passwort-Card (zentriert)
│   ├── Titel: "Neues Passwort setzen"
│   ├── Passwort-Formular
│   │   ├── Neues Passwort-Feld (Eingabe mit Sichtbarkeits-Toggle)
│   │   ├── Passwort-Anforderungen (Checkliste, wie bei Registrierung)
│   │   ├── Passwort bestätigen-Feld (Eingabe)
│   │   └── "Passwort speichern"-Button (mit Lade-Spinner)
│   └── Fehlermeldungen (abgelaufener/ungültiger Link)
└── Toast-Benachrichtigungen (Erfolg → Redirect zum Login)
```

### Daten-Model
```
Für Passwort-Reset werden verwendet:
- Reset-Token → automatisch von Supabase generiert und per Email gesendet
- Token-Ablauf → 1 Stunde (Supabase-Konfiguration)
- Einmalverwendung → Supabase invalidiert Token nach Nutzung

Keine eigenen Tabellen nötig!
Supabase Auth managt den gesamten Reset-Flow.
```

### Tech-Entscheidungen
```
Warum Supabase Auth für Passwort-Reset?
→ Supabase hat einen kompletten Reset-Flow eingebaut:
  1. Reset-Email senden (mit sicherem Token)
  2. Token validieren
  3. Neues Passwort setzen
  Kein eigener Email-Versand oder Token-Management nötig.

Warum zwei separate Seiten (/reset-password und /reset-password/confirm)?
→ Klare Trennung: Seite 1 = Email eingeben, Seite 2 = neues Passwort setzen.
  Supabase leitet automatisch zur Confirm-Seite weiter über den Email-Link.

Warum PasswordStrengthIndicator wiederverwenden?
→ Gleiche Komponente wie bei der Registrierung (PROJ-1).
  Konsistente UX, kein doppelter Code.
```

### Seitenstruktur
```
Neue Seiten:
- /reset-password → Email-Eingabe für Reset-Anfrage
- /reset-password/confirm → Neues Passwort setzen (nach Klick auf Email-Link)

Callback-Route:
- /auth/callback → Verarbeitet den Supabase-Redirect aus der Reset-Email

Wiederverwendete Komponenten:
- PasswordStrengthIndicator (aus PROJ-1)
- shadcn/ui: Card, Input, Button, Form, Label, Toast
```

### Dependencies
```
Keine neuen Packages nötig!
Supabase Auth managt Email-Versand + Token-Handling.
```
