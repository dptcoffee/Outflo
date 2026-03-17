# OUTFLO — CODE STRUCTURE CANON
Version: v1
Status: LOCKED
Scope: All source files in the Outflō repository

----------------------------------------------------------------

## 1. Purpose

This document defines the canonical structure for all source files
in the Outflō codebase.

The goal is to ensure:

- structural clarity
- precise navigation in long files
- alignment between product architecture and code
- prevention of code drift as the system scales

All files must follow the header hierarchy defined below.

----------------------------------------------------------------

## 2. Header Hierarchy

Outflō source files follow a three-level header system.

LEVEL 1 — File Header  
LEVEL 2 — Section Headers  
LEVEL 3 — UI Surface Headers (Component only)

----------------------------------------------------------------

## 3. File Header (Required)

Every source file must begin with the Outflō file header.

Format:

```ts
/* ==========================================================
   OUTFLO — <FILE PURPOSE>
   File: <repo-relative-path>
   Scope: <one-line responsibility>
   ========================================================== */
```

Example:

```ts
/* ==========================================================
   OUTFLO — RECEIPT DETAIL PAGE
   File: app/money/receipts/[id]/page.tsx
   Scope: Display single receipt drill-down
   ========================================================== */
```

Rules:

- `File:` must contain the full repository-relative path
- `Scope:` must be a single concise responsibility statement

----------------------------------------------------------------

## 4. Section Headers (Required)

Section headers divide logical blocks inside a file.

Format:

```ts
/* ------------------------------
   <Section Name>
-------------------------------- */
```

Common sections include:

Imports  
Types  
Constants  
Contract  
Component  
Helpers  

These sections should appear in a logical order appropriate
to the file.

----------------------------------------------------------------

## 5. Contract Section (Recommended)

The Contract section defines the behavioral expectations
of a file.

It clarifies how the file interacts with the system.

Example:

```ts
/* ------------------------------
   Contract
-------------------------------- */

Input:
- inbound webhook payload

Output:
- canonical receipt record

Invariants:
- ingest processing must be idempotent
- canonical event stored before parsing
- receipt records are immutable
```

The Contract section is strongly recommended for:

- API routes
- ingestion pipelines
- ledger logic
- state mutation layers
- data processing modules

----------------------------------------------------------------

## 6. UI Surface Headers (Component Only)

UI headers identify visual surfaces within a page component.

These are used only inside the Component section.

Format:

```ts
/* --- UI: <Domain> — <Surface> ---------------------------- */
```

Examples:

```ts
/* --- UI: Receipt — Hero --------------------------------- */

/* --- UI: Receipt — Position ------------------------------ */

/* --- UI: Receipt — Orientation --------------------------- */

/* --- UI: Receipt — Ledger -------------------------------- */

/* --- UI: Receipt — Explore ------------------------------- */
```

Rules:

- Only used within the Component section
- Must correspond to real UI surfaces
- Must remain stable once UI architecture is defined
- Not used in utilities, helpers, or APIs

----------------------------------------------------------------

## 7. Benefits

This structure ensures:

- fast navigation within large files
- UI structure mirrors product architecture
- safe targeted edits
- improved readability
- long-term repository stability

----------------------------------------------------------------

## 8. Canon Rule

All Outflō source files must follow this structure:

File Header  
Section Headers  
(Optional) Contract Section  
Component Section  
(Optional) UI Surface Headers

This structure is LOCKED and repository-wide.

---

End of Document.