# Outflō Documentation

This directory contains the permanent documentation for the Outflō codebase.

The documentation system is organized into layers so that philosophy, repository laws, system architecture, and product surfaces remain clearly separated.

---

## Documentation Map

docs/

  README.md            → Documentation entry point (index only)
  
  repository/          → Repository structure and project map

  philosophy/          → Project philosophy and operating principles

  conventions/         → Repository rules, standards, and documentation templates

  architecture/        → Active system architecture and technical contracts

  product/             → Product behavior, UI contracts, and user-facing flows

  archive/             → Historical or inactive system designs

---

## Core Rules

### 1. Layer Separation

Each top-level folder represents a distinct system layer:

- Philosophy defines how systems are built
- Conventions define repository laws
- Architecture defines system contracts
- Product defines user-facing behavior
- Archive preserves historical systems

Layers must not overlap in responsibility.

---

### 2. Filename Independence (Locked)

All versioned documents must remain intelligible when separated from their folder path.

This ensures documents can be:

- exported
- shared
- uploaded
- reviewed in isolation

Rule:

Versioned files must use descriptive filenames:

    <system-name>-v1.md
    <system-name>-v2.md

Examples:

    outflo-ledger-v1.md
    ingest-pipeline-v1.md
    database-v2.md
    profile-page-v1.md

Files must never rely solely on:

    v1.md

---

### 3. README Contract (Locked)

README.md is reserved for index and navigation purposes only.

It must not contain:

- system contracts
- architecture definitions
- versioned documents

Usage:

- docs/README.md → documentation entry point
- folder README.md → local index for that folder

---

## Philosophy

Philosophy documents describe how systems are built and the principles guiding the project.

Location:

    docs/philosophy/

Example:

    outflo-way.md

These documents define the conceptual foundation of the project rather than specific engineering systems.

---

## Conventions

Conventions define repository laws and are not versioned.

Location:

    docs/conventions/

Examples:

- naming-canon-locked.md
- code-style-locked.md

Templates used when writing documentation also live here.

Examples:

- convention-template.md
- architecture-template.md
- placeholder-readme-template.md

---

## Architecture

Architecture documents describe active system designs and technical contracts.

Location:

    docs/architecture/<system>/

Each system owns its own folder.

Architecture documents are versioned and must follow the Filename Independence rule.

Example:

    outflo-ledger/
      outflo-ledger-v1.md

Architecture documents define system behavior and invariants.

---

## Product

Product documents describe user-facing behavior, UI contracts, and interaction flows.

Location:

    docs/product/

Examples:

- UI surfaces
- page-level contracts
- interaction flows
- user-visible system behavior

Product documents may be versioned and must follow the Filename Independence rule.

---

## Archive

The archive contains system designs that are not currently part of the active architecture.

Location:

    docs/archive/

Archived systems remain documented but are excluded from the live architecture surface.

Example:

    archive/environment-engine/
      environment-engine-v1.md

The archive preserves historical exploration without affecting active system contracts.

---

## System Summary

Outflō documentation is structured to:

- separate system law from implementation
- preserve clarity across layers
- ensure documents remain readable in isolation
- prevent structural drift

---

End of Document.