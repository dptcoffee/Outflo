/* ==========================================================
   OUTFLO — THREAD TRANSITION SOP (LOCKED)
   File: docs/repository/thread-transition-sop.md
   Scope: Governs how work transitions between threads to preserve continuity and prevent drift
   ========================================================== */

# OUTFLO — THREAD TRANSITION SOP

## PURPOSE

Preserve continuity, precision, and system integrity when moving between threads.

Threads are NOT memory.

Continuity must be:
- explicit
- structured
- enforced

---

## WHEN TO START A NEW THREAD

A new thread is REQUIRED when any of the following occur:

### 1. Phase Change
- UI → Architecture
- Architecture → Data
- Data → Product
- Build → Audit
- Creation → Enforcement

### 2. Context Density Threshold
- Too many files in one thread
- Too many systems being discussed simultaneously
- Responses becoming less precise

### 3. Layer Mixing
- UI + backend + ontology in the same thread
- Component work mixed with system architecture
- Styling mixed with computation or ingest logic

### 4. Direction Shift
- Building → auditing
- Exploring → locking
- Designing → enforcing

---

## NEW THREAD INITIALIZATION REQUIREMENTS

Every new thread MUST begin with a full orientation block.

### REQUIRED SECTIONS

#### MODE
Defines how the thread behaves.
Examples:
- STRUCTURAL
- BUILD
- DEBUG

#### PHASE
Defines what layer of the system is being worked on.
Examples:
- UI GLOBAL
- GLOBAL ARCHITECTURE
- INGEST
- COMPUTATION

#### CURRENT STATE (LOCKS)
Explicitly define what is already complete and must not be revisited.

#### OBJECTIVE
What this thread is solving.

#### CONSTRAINTS
What the thread must NOT do.

#### WORKING STYLE
How the assistant should respond:
- batch-based
- surgical
- minimal
- no essays

#### INPUT PLAN
- exact files required
- order of batches

#### FIRST ACTION
Usually:
- request file tree
- anchor to real structure

---

## THREAD RULES

- Do NOT assume prior thread context
- Do NOT re-explain known systems
- Do NOT drift across layers
- Do NOT expand scope mid-thread
- Do NOT introduce new abstractions without necessity

---

## OUTPUT REQUIREMENTS

All responses must be:

- Direct
- Minimal
- Actionable
- Grounded in actual code
- Structured around:
  - boundary mapping
  - violations
  - required moves
  - lock decisions

---

## CORE LAW

Continuity is NOT memory.

Continuity is:
> explicit structure that can be reloaded without context loss

---

## GOAL

Each thread must function as:

> A self-contained execution environment

Not:

> A continuation dependent on prior conversation

---

## RESULT

This SOP ensures:

- No drift between phases
- No rework due to lost context
- Clean transitions between system layers
- Stable long-term development velocity

---

## STATUS

LOCKED

---

End of document