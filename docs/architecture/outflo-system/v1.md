# Outflō — System Architecture (v1)

Status: Canonical  
Scope: Conceptual architecture of the Outflō system

This document defines the complete conceptual pipeline of Outflō.

It describes how real-world events become interpretable behavioral patterns.

---

# Core Principle

Outflō converts lived events into structured signals that can be interpreted.

The system operates through a bounded pipeline that transforms reality into insight.

---

# System Pipeline

Outflō operates through six stages.

```
Reality
↓
Events
↓
Canonical Truth
↓
Compression
↓
Derived Facts
↓
Interpretation
↓
Human Reflection
```

Each stage performs a specific transformation.

---

# 1. Reality

Reality consists of the user's lived experience.

Examples include:

- purchases
- locations
- environmental conditions
- time passage

Reality exists independently of the system.

Outflō only measures what actually occurs.

---

# 2. Events

Events are the capture layer of the system.

Examples:

- receipt ingestion
- timestamp capture
- location signals
- environmental data

Events are raw signals entering the pipeline.

Events may contain noise and require normalization.

---

# 3. Canonical Truth (Ledger)

The canonical ledger stores normalized events.

Examples:

- receipts
- user epoch
- identity-bound timestamps

The ledger represents **truth within the system**.

Rules:

- canonical events must be deterministic
- canonical events must not depend on AI
- canonical events must remain immutable

The ledger is the source of truth.

---

# 4. Compression (Windows / Orbits)

Compression transforms individual events into structured windows.

Examples:

- day windows
- merchant aggregates
- rolling windows
- orbit windows (rolling 365)

Compression allows large sets of events to become interpretable structures.

Windows create stable units of observation.

---

# 5. Derived Facts

Derived facts are deterministic computations generated from compressed windows.

Examples:

- orbit total
- daily rate
- variance vs previous orbit
- top merchants
- spike events
- frequency patterns

Derived facts are mathematical transformations of ledger data.

Derived facts remain deterministic and reproducible.

---

# 6. Interpretation

Interpretation converts structured facts into language.

Interpretation may be performed by:

- humans
- AI systems

Interpretation does not modify the ledger.

Interpretation operates only on derived facts.

AI exists solely in this stage of the pipeline.

---

# 7. Human Reflection

The final stage of the system is human reflection.

Outflō does not prescribe behavior.

Outflō reveals patterns.

The human remains the final interpreter of meaning.

---

# Architectural Invariant

Reality must flow through the pipeline in order.

```
Reality → Events → Canonical Truth → Compression → Derived Facts → Interpretation
```

No stage may bypass the canonical ledger.

AI may never operate directly on raw events.

AI may only interpret derived facts.

---

# System Philosophy

Outflō operates as a bounded measurement system within an unbounded generative environment.

Modern information systems generate infinite advice and interpretation.

Outflō constrains interpretation by grounding it in measured reality.

This bounded structure allows patterns to emerge without judgment.

---

# System Identity

Outflō is not a budgeting tool.

Outflō is not a productivity system.

Outflō is a **behavioral telemetry system** that converts lived events into interpretable patterns.

---

End of Document