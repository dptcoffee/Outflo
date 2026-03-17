# Outflō Code Style — Locked

Purpose  
Maintain visual consistency and reduce formatting drift across files.

This document defines the approved structural conventions for source code files in the Outflō codebase.

This standard is intentionally minimal and stable. It is designed so the codebase does not need to revisit formatting decisions.

---

# Rules

##  Scope

This style applies to executable source files in the Outflō repository, including:

- `.ts`
- `.tsx`
- `.js`
- `.jsx`
- `.ps1`
- `.sh`

It does **not** apply to:

- Markdown documentation (`.md`)
- JSON configuration files
- CSS or styling files
- Plaintext snapshots (e.g. `docs/repo-tree.txt`)

Documentation files follow normal Markdown conventions.

---

## File Header (Top of File)

Every source file should begin with the Outflō file header.

Use exactly this format:

    /* ==========================================================
       OUTFLO — <FILE PURPOSE>
       File: <repo-relative-path>
       Scope: <one-line responsibility>
       ========================================================== */

---

## Section Headers (Major Blocks)

Use the following structure for major sections inside a file.

    /* ------------------------------
       <Section Title>
    -------------------------------- */

Typical section titles include:

- Imports
- Types
- Constants
- Metadata
- Viewport
- Component
- Helpers

Sections should be used only where they improve readability.

---

## Disallowed Variants

Do **not** use:

- Decorative ASCII art
- Emojis in code comments
- Multiple header styles within a single file
- Inline decorative separators such as `/* --- TITLE --- */`

The codebase should maintain a single consistent header style.

---

## File Path Rule (Locked)

The `File:` field must contain the **full repository-relative path**.

Examples:

    File: app/layout.tsx
    File: app/money/receipts/[id]/page.tsx
    File: app/api/ingest/resend/route.ts

Do not shorten or truncate the path.

This ensures the header always reflects the file’s true location within the project structure.

---

## Formatting Conventions

Outflō follows modern TypeScript project defaults.

    Indentation: 2 spaces
    Line width target: ~100 characters

These align with common formatting tools such as Prettier.

---

## Rule of Application

When touching a file meaningfully, bring it into compliance with this style.

Do **not** create commits purely for comment formatting unless necessary.

New files must follow the style immediately.

---

# Examples

Header example:

    /* ==========================================================
       OUTFLO — ROOT LAYOUT
       File: app/layout.tsx
       Scope: Global frame, metadata, and viewport contract
       ========================================================== */

Deep route example:

    /* ==========================================================
       OUTFLO — RECEIPT DETAIL PAGE
       File: app/money/receipts/[id]/page.tsx
       Scope: Display single receipt drill-down
       ========================================================== */

API route example:

    /* ==========================================================
       OUTFLO — RESEND INGEST WEBHOOK
       File: app/api/ingest/resend/route.ts
       Scope: Handle inbound email receipt ingestion
       ========================================================== */

---

# Invariant

All source files follow the same header format, section header structure, and repository-relative file path rule.

Code style decisions should not be revisited unless they remove measurable development friction.

---

End of Document.