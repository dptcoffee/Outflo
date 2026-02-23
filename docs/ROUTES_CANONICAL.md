## Repository Root (Governance + Runtime)

The following structure defines the top-level repository layout.
This includes both runtime namespaces and governance artifacts.

/ (repo root)
│
├── app/                  # Next.js App Router (runtime)
├── components/           # Shared UI + client components
├── public/               # Static assets
├── docs/                 # Architecture + system documentation
├── STYLE.md              # Locked code style + header standard
├── package.json
├── next.config.ts
└── tsconfig.json

Notes:

- `STYLE.md` governs formatting and header standards across the repo.
- `/docs` contains canonical architecture documents (routes, filesystem, etc).
- Governance files are not runtime namespaces.
- Runtime route namespaces are defined below.

# Outflō Routes (Canonical Map)

This document defines the **canonical** route structure for Outflō and the **legacy aliases** maintained via redirects.  
Goal: stable namespaces, no drift, and compatibility for old links/bookmarks.

---

## Canonical Routes

### Public
- `/` — Home (public surface)
- `/login` — Login
- `/auth/callback` — Supabase auth callback (route handler)
- `/logout` — Logout (route handler)
- 

### App (Protected)
All routes under `/app/*` are protected by `app/app/layout.tsx`.

- `/app/systems` — Launcher (Money / Time / Tools)
- `/app/money` — Money substrate root (primary dashboard: “2 numbers”)
  - `/app/money/receipts` — Receipt list
  - `/app/money/receipts/[id]` — Receipt detail (auto-generated)
  - `/app/money/day/[key]` — Day rollup (auto-generated)
  - `/app/money/place/[slug]` — Vendor rollup (auto-generated)
  - `/app/money/about` — Explainer (“how the engine works”)
- `/app/time` — System clock / runtime (Time substrate)

### Tools (Protected)
All routes under `/tools/*` are protected by `app/tools/layout.tsx`.

- `/tools` — Tools hub (formerly “Calculate”)
- `/tools/gain` — Gain calculator
- `/tools/compression` — 365 compression calculator

### Account (Protected)
All routes under `/account/*` are protected by `app/account/layout.tsx`.

- `/account/profile` — Profile / account page (edit info, logout, etc.)

### Admin (Protected + Secret UX)
All routes under `/admin/*` are protected by `app/admin/layout.tsx`.

- `/admin` — Admin console (export/restore/reset; tap-unlock UX)

---

## Legacy Redirects (Compatibility Layer)

These routes should not contain product logic anymore — they exist to redirect to canonical paths.

### 365 era (fully deprecated)
- `/365` → `/app/money`
- `/365/*` → `/app/money/*` (catch-all redirect)

### Old root routes (deprecated)
- `/systems` → `/app/systems`
- `/profile` → `/account/profile`
- `/export` → `/admin`
- `/calculate` → `/tools`
- `/state` → `/tools/gain`
- `/merchant` → `/tools/compression`
- `/app/profile` → `/account/profile` (legacy app namespace profile)

### Former Money “engine” nesting (deprecated)
- `/app/money/engine` → `/app/money` (flattened)

---

## Namespace Rules (Do Not Break)

1. **Substrates live under `/app/*`**
   - Money, Time, Carbon (future), etc.

2. **Tools live under `/tools/*`**
   - Calculators and utilities derived from substrate data.

3. **Account lives under `/account/*`**
   - Identity, password, logout/profile.

4. **Admin lives under `/admin/*`**
   - Dangerous actions: export/restore/reset.

5. **Legacy routes never host new functionality**
   - Only redirects. New work goes to canonical namespaces.

---

## Auth Enforcement Pattern

Instead of middleware, we use **namespace layout gates**:

- `app/app/layout.tsx` protects `/app/*`
- `app/tools/layout.tsx` protects `/tools/*`
- `app/account/layout.tsx` protects `/account/*`
- `app/admin/layout.tsx` protects `/admin/*`

This prevents future drift (you can’t “forget” to protect a new page if it lives in a protected namespace).