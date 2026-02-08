# SafeDocs Portal - AI Session Context

> Lies diese Datei am Anfang jeder Session, um den Projektkontext zu verstehen.

## Projekt auf einen Blick

**Name:** SafeDocs Portal (AI Coding Starter Kit)
**Zweck:** Sicherer Dokumentenaustausch ohne E-Mail (DSGVO-konform)
**Status:** Production-Ready Template mit 13 implementierten Features

---

## Tech-Stack

| Layer | Technologie |
|-------|-------------|
| **Frontend** | Next.js 16, React 19, TypeScript, Tailwind CSS, shadcn/ui |
| **Backend** | Supabase (PostgreSQL + Auth + RLS) |
| **Dateispeicher** | Vercel Blob |
| **Validierung** | Zod, react-hook-form |
| **Deployment** | Vercel (+ Docker-Option) |

---

## 6 Spezialisierte Agenten

**WICHTIG:** Die Agenten sind Prompt-Templates in `.claude/agents/`. Aktiviere sie durch Lesen der entsprechenden Datei.

| Agent | Datei | Aufgabe |
|-------|-------|---------|
| **Requirements Engineer** | `requirements-engineer.md` | Feature-Idee → strukturierte Spec |
| **Solution Architect** | `solution-architect.md` | Spec → Datenbank-Schema, Komponenten-Architektur |
| **Frontend Developer** | `frontend-dev.md` | UI-Implementierung (React + Tailwind + shadcn/ui) |
| **Backend Developer** | `backend-dev.md` | API Routes, Supabase Queries, RLS Policies |
| **QA Engineer** | `qa-engineer.md` | Tests gegen Acceptance Criteria |
| **DevOps Engineer** | `devops.md` | Vercel Deployment, Environment Setup |

### Agent-Workflow
```
User-Idee
    ↓
Requirements Engineer → Feature Spec in /features/PROJ-X.md
    ↓
Solution Architect → Tech-Design zur Spec hinzufügen
    ↓
Frontend + Backend Dev → Implementation
    ↓
QA Engineer → Testing
    ↓
DevOps → Deployment
```

### Agent aktivieren
```
Lies .claude/agents/[agent-name].md und handle danach.
```

---

## Projektstruktur

```
ai-coding-starter-kit/
├── .claude/
│   ├── agents/              ← 6 AI-Agenten (Systemprompts)
│   └── CLAUDE.md            ← Diese Datei (Session-Kontext)
├── features/                ← Feature-Specs (PROJ-1 bis PROJ-13)
├── src/
│   ├── app/                 ← Next.js Pages (App Router)
│   │   ├── (auth)/          ← Login, Register, Reset-Password, Verify-Email
│   │   ├── api/             ← REST API Routes
│   │   ├── dashboard/       ← Protected Dashboard Pages
│   │   └── p/[token]/       ← Public Upload Portal
│   ├── components/
│   │   ├── ui/              ← shadcn/ui Components (30+)
│   │   └── *.tsx            ← Custom Business Components
│   └── lib/                 ← Supabase Clients, Utilities
├── supabase/                ← Database Migrations
└── public/                  ← Static Assets, Favicons
```

---

## Features (Status-Übersicht)

| ID | Feature | Status |
|----|---------|--------|
| PROJ-1 | User Registration | ✅ Deploy-Ready |
| PROJ-2 | User Login | ✅ Deploy-Ready |
| PROJ-3 | Password Reset | ✅ Deploy-Ready |
| PROJ-4 | Email Verification | ✅ Deploy-Ready |
| PROJ-5 | Logout | ✅ Deploy-Ready |
| PROJ-6 | Disable Registration | ✅ Deploy-Ready |
| PROJ-7 | File Upload | ✅ Deploy-Ready |
| PROJ-8 | Mandanten-Upload-Portal | ✅ Deploy-Ready |
| PROJ-9 | Email-Link Versand | ✅ Deploy-Ready |
| PROJ-10 | Portal-Passwortschutz | ✅ Deploy-Ready |
| PROJ-11 | Docker Deployment | ✅ Deploy-Ready |
| PROJ-12 | Dashboard Redesign | ✅ Deploy-Ready |
| PROJ-13 | Portal-Detail-Redesign | ✅ Deploy-Ready |

**Feature-Specs:** `/features/PROJ-X.md`
**Git-History:** `git log --grep="PROJ-X"`

---

## Wichtige Konventionen

### Code-Stil
- TypeScript strict mode
- Tailwind CSS für Styling
- shadcn/ui Components bevorzugen (vor eigenen)
- Zod für Validierung
- Server Components wo möglich

### Commit-Format
```
feat(PROJ-X): Kurzbeschreibung
fix(PROJ-X): Bugfix-Beschreibung
```

### API-Routen
- Authentifizierung via Supabase Auth
- Input-Validierung mit Zod
- Fehler als JSON mit Status-Codes

### Sicherheit
- RLS Policies für alle Tabellen
- Input-Validierung an API-Grenzen
- Security Headers in `next.config.ts`

---

## Quick Commands

```bash
# Development
npm run dev          # Start dev server (localhost:3000)
npm run build        # Production build
npm run lint         # ESLint check

# Git
git log --grep="PROJ-8"  # Commits zu Feature 8
git status               # Aktueller Stand
```

---

## Dokumentation

| Datei | Inhalt |
|-------|--------|
| `PROJECT_CONTEXT.md` | Projekt-Vision, Roadmap, Design Decisions |
| `HOW_TO_USE_AGENTS.md` | Anleitung zur Agent-Nutzung |
| `INSTALL.md` | Setup-Anleitung |
| `features/README.md` | Feature-Spec Format |

---

## Session-Start Checkliste

1. **Diese Datei lesen** (automatisch)
2. Bei Feature-Arbeit: `/features/PROJ-X.md` lesen
3. Bei Agent-Nutzung: `.claude/agents/[agent].md` lesen
4. Git-Status prüfen bei Code-Änderungen
