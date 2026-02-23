# Outflō Code Style — Locked

This file defines the approved header format and structural conventions
for the Outflō codebase.

Purpose:
Maintain visual consistency and reduce formatting drift across files.

---

## 1. File Header (Top of File)

Use exactly this format:

/* ==========================================================
   OUTFLO — <FILE PURPOSE>
   File: <relative/path.ext>
   Scope: <one-line responsibility>
   ========================================================== */

Example:

/* ==========================================================
   OUTFLO — ROOT LAYOUT
   File: app/layout.tsx
   Scope: Global frame, metadata, and viewport contract
   ========================================================== */

---

## 2. Section Headers (Major Blocks)

Use:

/* ------------------------------
   <Section Title>
-------------------------------- */

Examples:
- Imports
- Types
- Constants
- Metadata
- Viewport
- Component
- Helpers

---

## 3. Disallowed Variants

Do not use:
- /* --- TITLE --- */
- Decorative ASCII art
- Emojis in code comments
- Multiple header styles within one file

---

## 4. Rule of Application

When touching a file meaningfully, bring it into compliance.
Do not create separate PRs purely for comment formatting unless necessary.