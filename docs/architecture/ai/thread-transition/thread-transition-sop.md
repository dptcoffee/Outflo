/* ==========================================================
   OUTFLO — THREAD TRANSITION SOP (V2 — LOCKED)
   File: docs/repository/thread-transition-sop.md
   Scope: Governs thread transitions, execution behavior, and system continuity
   ========================================================== */

Version: V2  
Replaces: V1 (merged entry + execution model into single authority)

# OUTFLO — THREAD TRANSITION SOP

## PURPOSE

Preserve continuity, precision, and system integrity across threads.

Threads are NOT memory.

Continuity must be:
- explicit
- structured
- enforced

---

## CORE LAW

Continuity is NOT memory.

Continuity is:
> explicit structure that can be reloaded without context loss

---

## NO DOUBLE WORK RULE

Before making any change, evaluate:

"Will this file need to be changed again due to a later structural move?"

If YES:
- Do NOT change the file yet

If NO:
- Proceed and lock

Goal:
Eliminate rework and prevent cascading refactors

---

## WHEN TO START A NEW THREAD

A new thread is REQUIRED when:

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
- UI + backend + ontology in same thread
- Component work mixed with system architecture
- Styling mixed with computation or ingest logic

### 4. Direction Shift
- Building → auditing
- Exploring → locking
- Designing → enforcing

---

## NEW THREAD INITIALIZATION

Every new thread MUST begin with a full orientation block.

### REQUIRED STRUCTURE

MODE:
- STRUCTURAL
- BUILD
- DEBUG

PHASE:
- UI GLOBAL
- ARCHITECTURE
- INGEST
- COMPUTATION
- SYSTEM ALIGNMENT

CURRENT STATE (LOCKED):
- Explicitly list what is already complete
- These are NOT to be revisited

OBJECTIVE:
- What this thread is solving

CONSTRAINTS:
- What the thread must NOT do

WORKING STYLE:
- Direct
- Minimal
- Surgical
- No essays

INPUT PLAN:
- Exact files required
- Order of execution

FIRST ACTION:
- Request file tree
- Anchor to real structure

---

## THREAD RULES

- Process exactly ONE file at a time
- Do NOT batch files
- Do NOT reference future files before current file is resolved

- Do NOT assume prior thread context
- Do NOT re-explain known systems
- Do NOT drift across layers
- Do NOT expand scope mid-thread
- Do NOT introduce abstractions without necessity

---

## EXECUTION MODEL

Each file follows this loop:

1. Identify role (what it owns)
2. Identify violations
3. Decide:
   - leave
   - adjust
   - rewrite
4. Provide clean version (if needed)
5. Lock decision
6. Move forward

---

## LAYER ORDER (MANDATORY)

Work must proceed in this order:

1. Auth / Access
2. API / Data
3. System Roots (money, systems, identity)
4. Surfaces (pages)
5. UI refinement

Never out of order.

---

## OUTPUT REQUIREMENTS

All responses must be:

- Direct
- Minimal
- Actionable
- Grounded in real code

Structured as:

- Boundary map
- Violations
- Required moves
- Lock decisions

---

## GOAL

Each thread must function as:

> A self-contained execution environment

Not:

> A continuation dependent on prior conversation

---

## RESULT

This system ensures:

- No drift between phases
- No rework from lost context
- Clean transitions between layers
- Stable long-term build velocity

---

## STATUS

LOCKED

--

End of document