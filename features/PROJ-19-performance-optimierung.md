# PROJ-19: Performance-Optimierung mit Client-Side Caching

## Status: Planned

## Beschreibung

Das Dashboard und die Uploads-Seite fuehlen sich traege an (2-3 Sekunden Wartezeit bei Klicks). Bei nur 5 Dateien im System ist das Problem NICHT die Datenmenge, sondern:

1. **Kein Client-Side Caching** - Jede Navigation loedt alle Daten neu
2. **Keine optimistischen Updates** - User wartet auf Server-Response
3. **Sequentielle statt parallele Requests** - Unnoetige Wartezeit
4. **Vercel Cold Starts** - Serverless-Funktionen brauchen Zeit zum "Aufwaermen"

Diese Feature Spec beschreibt die Einfuehrung von **SWR (stale-while-revalidate)** fuer intelligentes Client-Side Caching, optimistische UI-Updates und parallele API-Calls.

## Abhaengigkeiten

- Benoetigt: PROJ-12 (Dashboard Redesign) - Dashboard-Seite existiert
- Benoetigt: PROJ-17 (Uploads Redesign) - Uploads-Seite existiert

## Warum SWR statt React Query?

| Kriterium | SWR | React Query |
|-----------|-----|-------------|
| Bundle Size | ~4KB | ~13KB |
| Komplexitaet | Minimal | Umfangreicher |
| Next.js Integration | Native (von Vercel) | Gut |
| Lernkurve | Flach | Steiler |
| Features | Ausreichend | Mehr Optionen |

**Entscheidung:** SWR - leichtgewichtig, von Vercel entwickelt, perfekt fuer Next.js.

## User Stories

### Steuerberater (eingeloggter User)

- Als Steuerberater moechte ich, dass das Dashboard sofort Daten anzeigt wenn ich es erneut besuche, um nicht bei jeder Navigation warten zu muessen
- Als Steuerberater moechte ich, dass Aktionen (z.B. Portal deaktivieren) sofort in der UI sichtbar sind, auch bevor der Server antwortet
- Als Steuerberater moechte ich, dass nach einem Fehler die vorherigen Daten weiterhin sichtbar sind, statt einer leeren Seite
- Als Steuerberater moechte ich, dass hintergrund-Aktualisierungen automatisch passieren, ohne dass ich die Seite neu laden muss

## Acceptance Criteria

### SWR Installation und Setup

- [ ] `swr` Package installiert
- [ ] Globaler SWR-Provider in `app/layout.tsx` oder `dashboard/layout.tsx` konfiguriert
- [ ] Standard-Fetcher-Funktion definiert (mit Error-Handling)
- [ ] Globale Cache-Konfiguration: `revalidateOnFocus: true`, `dedupingInterval: 2000`

### Dashboard-Seite Optimierung

- [ ] `/api/dashboard/stats` wird mit `useSWR` gecached
- [ ] Bei erneutem Besuch: Sofortige Anzeige aus Cache + Hintergrund-Revalidierung
- [ ] Loading-Spinner nur beim allerersten Load (wenn kein Cache vorhanden)
- [ ] Bei Fehler: Vorherige Daten bleiben sichtbar + Error-Toast
- [ ] Cache-Key: `/api/dashboard/stats`

### Uploads-Seite Optimierung

- [ ] `/api/uploads` wird mit `useSWR` gecached
- [ ] Filter-Aenderungen nutzen SWR mit dynamischem Key: `/api/uploads?tab=X&page=Y`
- [ ] Status-Updates (neu/in Bearbeitung/erledigt) nutzen optimistische Updates
- [ ] Nach Datei-Loeschung: Optimistisches Entfernen aus Liste + Server-Sync
- [ ] Pagination behaelt vorherige Seiten im Cache

### Portal-Liste Optimierung

- [ ] `/api/portal/links` wird mit `useSWR` gecached
- [ ] Portal aktivieren/deaktivieren mit optimistischem Update
- [ ] Nach Portal-Erstellung: Cache invalidieren und neu laden
- [ ] Cache-Key: `/api/portal/links`

### Portal-Detail-Seite Optimierung

- [ ] Submissions und Outgoing-Files parallel laden (nicht sequentiell)
- [ ] `Promise.all` oder parallele `useSWR`-Hooks
- [ ] Individuelle Cache-Keys: `/api/portal/submissions?linkId=X`, `/api/portal/outgoing?linkId=X`

### Optimistische Updates

- [ ] Portal Toggle (aktiv/inaktiv): Sofortige UI-Aenderung, Rollback bei Fehler
- [ ] File-Status-Aenderung: Sofortige UI-Aenderung, Rollback bei Fehler
- [ ] Datei-Loeschung: Sofortiges Entfernen aus Liste, Rollback bei Fehler
- [ ] Bei Rollback: Error-Toast mit Fehlermeldung anzeigen

### Error-Handling

- [ ] Bei Netzwerk-Fehler: Vorherige Daten bleiben sichtbar
- [ ] Retry-Button bei Fehlern anzeigen
- [ ] Toast-Benachrichtigung bei fehlgeschlagenen Mutationen
- [ ] Automatischer Retry nach 5 Sekunden (konfigurierbar)

### Performance-Metriken

- [ ] Erster Load (Cold): < 2 Sekunden (akzeptabel wegen Cold Start)
- [ ] Wiederholter Load (Warm Cache): < 200ms (gefuehlt instant)
- [ ] Navigation zwischen Seiten: < 100ms (aus Cache)
- [ ] Optimistische Updates: < 50ms (sofort)

## Edge Cases

- **Was passiert bei Offline-Zustand?** -> Cached Daten werden angezeigt, Mutations werden gequeued oder mit Fehler abgelehnt
- **Was passiert wenn der Cache veraltet ist?** -> SWR revalidiert automatisch im Hintergrund bei Focus/Intervall
- **Was passiert bei optimistischem Update + Server-Fehler?** -> Rollback auf vorherigen State + Error-Toast
- **Was passiert bei parallelem Bearbeiten (zwei Tabs)?** -> SWR synchronisiert bei Tab-Focus
- **Was passiert bei sehr langer Inaktivitaet?** -> Bei naechstem Focus wird revalidiert
- **Was passiert bei grossen Datenmengen spaeter?** -> Pagination mit separaten Cache-Keys, kein Memory-Problem

## Technische Anforderungen

### Neue Dateien

- `src/lib/swr-config.ts` - Globale SWR-Konfiguration und Fetcher
- `src/hooks/use-dashboard-stats.ts` - Custom Hook fuer Dashboard-Daten
- `src/hooks/use-uploads.ts` - Custom Hook fuer Uploads mit Pagination
- `src/hooks/use-portal-links.ts` - Custom Hook fuer Portal-Liste
- `src/hooks/use-portal-detail.ts` - Custom Hook fuer Portal-Details (parallel loading)

### Zu aendernde Dateien

- `src/app/dashboard/layout.tsx` - SWR-Provider hinzufuegen
- `src/app/dashboard/page.tsx` - `useSWR` statt `useState` + `useEffect` + `fetch`
- `src/app/dashboard/uploads/page.tsx` - `useSWR` mit Mutation-Support
- `src/app/dashboard/portal/page.tsx` - `useSWR` mit optimistischen Updates
- `src/app/dashboard/portal/[linkId]/page.tsx` - Parallele SWR-Hooks

### SWR Konfiguration (Vorschlag)

```typescript
// src/lib/swr-config.ts
import { SWRConfiguration } from 'swr';

export const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    const error = new Error('API request failed');
    error.info = await res.json();
    error.status = res.status;
    throw error;
  }
  return res.json();
};

export const swrConfig: SWRConfiguration = {
  fetcher,
  revalidateOnFocus: true,
  revalidateOnReconnect: true,
  dedupingInterval: 2000,
  errorRetryCount: 3,
  errorRetryInterval: 5000,
};
```

### Beispiel: Dashboard mit SWR (Vorschlag)

```typescript
// src/hooks/use-dashboard-stats.ts
import useSWR from 'swr';

export function useDashboardStats() {
  const { data, error, isLoading, mutate } = useSWR('/api/dashboard/stats');

  return {
    stats: data,
    isLoading,
    isError: !!error,
    refresh: mutate,
  };
}

// src/app/dashboard/page.tsx
export default function DashboardPage() {
  const { stats, isLoading, isError, refresh } = useDashboardStats();

  // Erster Load: Spinner
  // Wiederholter Load: Sofortige Anzeige aus Cache
  // Fehler: Vorherige Daten + Error-Hinweis
}
```

### Beispiel: Optimistisches Update (Vorschlag)

```typescript
// Portal Toggle mit optimistischem Update
async function handleToggle(link: PortalLink) {
  // Optimistisch: Sofort UI updaten
  mutate(
    '/api/portal/links',
    (current) => ({
      ...current,
      links: current.links.map(l =>
        l.id === link.id ? { ...l, is_active: !l.is_active } : l
      )
    }),
    { revalidate: false } // Nicht sofort revalidieren
  );

  try {
    await fetch('/api/portal/links', {
      method: 'PATCH',
      body: JSON.stringify({ id: link.id, is_active: !link.is_active }),
    });
    // Erfolg: Revalidieren um Server-State zu bestaetigen
    mutate('/api/portal/links');
  } catch (error) {
    // Fehler: Rollback durch Revalidierung
    mutate('/api/portal/links');
    toast.error('Aenderung fehlgeschlagen');
  }
}
```

## Nicht im Scope

- **Redis/Server-Side Caching** - Bei 5 Dateien Overkill, spaeter bei Bedarf
- **Service Worker/Offline-First** - Zu komplex fuer aktuellen Bedarf
- **Prefetching** - Kann spaeter ergaenzt werden
- **Infinite Scroll** - Pagination reicht aktuell aus

## Migrations-Strategie

1. **Phase 1:** SWR installieren und Provider einrichten
2. **Phase 2:** Dashboard-Seite migrieren (einfachster Case)
3. **Phase 3:** Portal-Liste migrieren mit optimistischen Updates
4. **Phase 4:** Uploads-Seite migrieren (komplexester Case mit Pagination)
5. **Phase 5:** Portal-Detail parallel loading

Jede Phase ist einzeln deploybar und testbar.

## Erfolgs-Kriterien

Nach Implementierung sollte:
- Dashboard bei erneutem Besuch sofort Daten anzeigen (< 200ms)
- Portal-Toggle sofort in UI sichtbar sein (< 50ms)
- Navigation zwischen Dashboard-Seiten fluessig sein
- Das "traege Gefuehl" verschwunden sein

## Deployment

Funktioniert auf:
- **Vercel (Serverless):** SWR ist client-side, keine Server-Aenderungen
- **Docker (Self-hosted):** Identische Funktionalitaet

Keine zusaetzliche Infrastruktur (Redis, etc.) erforderlich.
