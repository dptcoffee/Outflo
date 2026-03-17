# OUTFLO — REPOSITORY STRUCTURE

Status: Locked  
Scope: High-level map of the Outflō repository.

This document explains where code, contracts, conventions, and archived designs live.

The goal is to describe the **intentional structure of the project** while acknowledging supporting and generated directories.

---

## Core Application Structure

These directories represent the primary application architecture.

    app/            → Next.js application (routes, layouts, handlers)
    components/     → Reusable React components
    hooks/          → React hooks and client-side logic
    lib/            → Utilities, services, Supabase clients, shared logic
    scripts/        → Development utilities and repo tooling

    public/         → Static assets served by the application

    docs/           → Permanent documentation (philosophy + laws + contracts)

---

## Documentation Layout

Documentation is organized by conceptual layer.

    docs/
      README.md         → Documentation overview
      repository.md     → Repo map (this file)

      philosophy/       → Project philosophy and operating principles
      conventions/      → Repository rules and standards
      architecture/     → Active system contracts
      archive/          → Historical or inactive designs

---

## Philosophy

Project operating principles live in:

    docs/philosophy/

Example:

    outflo-way.md

Philosophy documents describe *how systems are built* rather than specific implementation details.

---

## Conventions

Conventions define repository laws and are not versioned.

Location:

    docs/conventions/

Examples include:

    naming-canon.md
    code-style-locked.md

These documents prevent drift across the codebase.

---

## Architecture Contracts

Architecture documents define system contracts.

Location:

    docs/architecture/<system>/
      v1.md
      v2.md

Rules:

- One system → one owner document per version.
- Architecture defines **behavior, invariants, and system rules**.
- Implementation must follow the contracts defined here.

Examples of systems:

    routes
    database
    outflo-ledger
    ingest-pipeline
    outflo-computation
    money-substrate

---

## Archive

Archived designs are preserved without polluting the active architecture surface.

Location:

    docs/archive/

Archive preserves historical exploration while keeping the active system clean.

---

## Supporting Project Directories

These directories support development but are not part of the architectural contracts.

    scripts/        → Development utilities and repo tooling

Additional directories may appear as the project evolves.

---

## Generated / Toolchain Directories

These directories are created by development tools and are not part of the repository architecture.

    node_modules/   → Dependency installation directory
    .next/          → Next.js build output
    .git/           → Git repository internals

These directories should not be modified manually.

---

## Code Implementation

Code implements the contracts defined in architecture.

Primary implementation locations:

    app/
    components/
    hooks/
    lib/

Implementation must not violate documented system contracts.

---

End of Document.