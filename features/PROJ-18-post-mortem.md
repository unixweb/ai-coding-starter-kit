# PROJ-18 Post-Mortem: Team-Benutzer-Verwaltung

## Zusammenfassung

Feature PROJ-18 wurde implementiert, aber es wurden zahlreiche Bugs gefunden, weil nicht alle APIs und RLS-Policies an das Team-Membership-Pattern angepasst wurden.

---

## Fehler-Kategorien

### 1. APIs ohne Team-Membership-Check

**Problem:** APIs filterten mit `.eq("user_id", user.id)` ohne zu pruefen, ob der User ein Team-Member ist.

**Betroffene APIs:**
| API | Methode | Status |
|-----|---------|--------|
| `/api/portal/links` | GET | Gefixed |
| `/api/portal/links` | PATCH | Gefixed |
| `/api/portal/submissions` | GET | Gefixed |
| `/api/uploads` | GET | Gefixed |
| `/api/uploads` | DELETE | Gefixed |
| `/api/uploads/status` | PATCH | Gefixed |
| `/api/portal/send-email` | POST | Gefixed |
| `/api/portal/outgoing` | POST, GET, DELETE | Gefixed |
| `/api/portal/files` | DELETE | Gefixed |
| `/api/portal/download` | GET | Gefixed |
| `/api/portal/download-all` | GET | Gefixed |
| `/api/portal/regenerate-password` | POST | Gefixed |
| `/api/dashboard/stats` | GET | Gefixed |

**Loesung - Standard-Pattern:**
```typescript
// Am Anfang jeder API nach Auth-Check:
const { data: membership } = await supabase
  .from("team_members")
  .select("owner_id")
  .eq("member_id", user.id)
  .single();

const ownerId = membership?.owner_id || user.id;

// Dann bei Queries:
.eq("user_id", ownerId)  // statt .eq("user_id", user.id)
```

---

### 2. RLS-Policies nicht aktualisiert

**Problem:** RLS-Policies prueften nur `user_id = auth.uid()`, nicht Team-Membership.

**Betroffene Tabellen:**
- `portal_file_status` - Musste manuell via SQL gefixed werden

**Loesung - RLS-Pattern fuer Team-Access:**
```sql
CREATE POLICY "Team members can access" ON table_name
FOR ALL USING (
  user_id = auth.uid()
  OR user_id IN (
    SELECT owner_id FROM team_members
    WHERE member_id = auth.uid()
  )
);
```

---

### 3. FK-Join-Probleme

**Problem:** Supabase-Joins wie `profiles!team_members_member_id_fkey` funktionierten nicht, weil `team_members.member_id` auf `auth.users` verweist, nicht auf `profiles`.

**Betroffene APIs:**
- `/api/team/members` - Team-Mitglieder wurden nicht angezeigt
- `/api/uploads/status` - Status-Aenderung schlug fehl

**Loesung - Separate Queries statt Joins:**
```typescript
// Statt:
const { data } = await supabase
  .from("team_members")
  .select("*, profiles!team_members_member_id_fkey(name, email)")

// Besser:
const { data: members } = await supabase
  .from("team_members")
  .select("member_id, owner_id, created_at");

const memberIds = members.map(m => m.member_id);

const { data: profiles } = await supabase
  .from("profiles")
  .select("id, name, email")
  .in("id", memberIds);

// Dann manuell zusammenfuehren
```

---

### 4. Session-Token nicht weitergegeben

**Problem:** Im Public Portal wurde der Session-Token nicht an alle API-Calls weitergegeben.

**Betroffene Stelle:**
- `/src/app/p/[token]/page.tsx` - `loadProvidedDocuments()` bekam keinen Session-Token

**Symptom:** Mandanten sahen keine ausgehenden Dokumente nach Login.

**Loesung:**
```typescript
const loadProvidedDocuments = useCallback(async (session?: string) => {
  const headers: Record<string, string> = {};
  if (session) {
    headers["X-Portal-Session"] = session;
  }
  const res = await fetch(url, { headers });
  // ...
}, [token]);

// Aufruf mit Session:
loadProvidedDocuments(sessionToken);
```

---

### 5. Falscher `is_owner`-Wert

**Problem:** User `info@joachimhummel.de` hatte `is_owner=true`, war aber eigentlich ein Team-Member.

**Symptom:** Sub-User konnte Team-Seite sehen und weitere User einladen.

**Loesung:** Manueller SQL-Fix:
```sql
UPDATE profiles SET is_owner = false WHERE email = 'info@joachimhummel.de';
```

**Lesson Learned:** Bei Einladungs-Annahme muss `is_owner` korrekt auf `false` gesetzt werden.

---

### 6. Falscher Blob-Pfad fuer Dashboard-Uploads

**Problem:** Dashboard-Stats suchten Dateien im falschen Vercel Blob Pfad.

**Betroffene Stelle:**
- `/api/dashboard/stats` - Suchte in `user/${user.id}/` statt Portal-Uploads

**Symptom:** Dashboard zeigte "0 Uploads" obwohl Mandanten Dateien hochgeladen hatten.

**Ursache:**
- Eigene User-Dateien: `user/${user.id}/`
- Mandanten-Uploads: `portal/${linkId}/${submissionId}/`

**Loesung:** Uploads aus `portal_file_status` Tabelle laden statt Vercel Blob Listing:
```typescript
// Statt:
const result = await list({ prefix: `user/${user.id}/` });

// Besser:
const { data: fileStatuses } = await supabase
  .from("portal_file_status")
  .select("id, filename, file_size, created_at")
  .in("link_id", linkIds)
  .order("created_at", { ascending: false });
```

**Bonus:** Schneller, weil DB-Query statt externer Blob-API.

---

## Checkliste fuer zukuenftige Team-Features

### Neue API erstellen
- [ ] Team-Membership-Check einbauen (Pattern oben)
- [ ] `ownerId` statt `user.id` verwenden
- [ ] Testen als Owner UND als Team-Member

### Neue Tabelle erstellen
- [ ] RLS-Policy mit Team-Access erstellen
- [ ] FK-Constraints pruefen (auth.users vs profiles)

### Frontend mit Session/Auth
- [ ] Alle API-Calls pruefen ob Auth-Header/Token mitgesendet wird
- [ ] Nach Login alle relevanten Daten neu laden

### Berechtigungen
- [ ] `is_owner`-Check fuer Owner-only-Aktionen (z.B. Portal erstellen/loeschen)
- [ ] Team-Members duerfen: lesen, bearbeiten
- [ ] Team-Members duerfen NICHT: erstellen, loeschen, andere einladen

---

## Zeitaufwand

| Phase | Geschaetzter Aufwand |
|-------|---------------------|
| Initiale Implementierung | ~2h |
| Bug-Fixing (11+ Bugs) | ~3h |
| **Gesamt** | ~5h |

**Haette vermieden werden koennen durch:**
1. Systematische Durchsicht ALLER APIs vor Merge
2. Automatisierte Tests fuer Team-Member-Szenarios
3. Checkliste wie oben

---

## Betroffene Commits

- `feat(PROJ-18): Team-Benutzer-Verwaltung implementiert`
- Diverse Fix-Commits fuer einzelne APIs
- `style: Dashboard Stats-Karten mit Hintergrundfarben`

---

## Fazit

Das Team-Membership-Pattern ist ein **Cross-Cutting Concern**, der ALLE APIs betrifft, die user-spezifische Daten abfragen. Bei zukuenftigen Features dieser Art:

1. **Erst alle betroffenen Stellen identifizieren** (grep nach `user_id`, `user.id`)
2. **Checkliste erstellen** bevor Implementierung beginnt
3. **Als Team-Member testen** - nicht nur als Owner
