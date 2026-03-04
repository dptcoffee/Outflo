# OUTFLO — OUTFLO COMPUTATION (v1)

Status: Locked  
Scope: Canonical outflow numbers and derived views

This document defines how Outflō computes the canonical numbers and derived views from receipts.

Purpose:
- Lock the computation model
- Prevent metric drift
- Define the canonical “two numbers”
- Define the rolling 365 window

---

# Inputs

Outflō computation operates on canonical receipts.

Primary table:

    receipts

Minimum required fields:

    user_id
    amount_cents
    purchased_at (timestamptz)

Invariant:

- All computations are derived from receipts.
- Computations are identity-bound through user_id.
- Amounts are stored and computed in atomic cents.

---

# Atomic Money Law

Money is computed in atomic units.

Invariant:

- All arithmetic is performed in integer cents.
- Display formatting (dollars) is presentation only.
- No floating point math is permitted for money computation.

---

# Canonical Numbers

Outflō surfaces two canonical numbers.

## 1. Daily Outflow (Today)

Definition:

- Sum of all receipts for the user whose purchased_at falls within the user’s local “today” window.

Output:

    daily_outflow_cents

Rules:

- Uses purchased_at timestamps.
- Uses the user’s local day boundary.
- Derived strictly from receipts.

---

## 2. Rolling 365 Outflow

Definition:

- Sum of all receipts for the user whose purchased_at falls within the trailing 365-day window ending now.

Output:

    rolling_365_outflow_cents

Rules:

- Window is rolling, not calendar-year.
- Derived strictly from receipts.
- Uses purchased_at timestamps.

---

# Day View (Derived)

Route:

    /app/money/day/[key]

Definition:

- A day key represents a single local calendar day.
- The day view aggregates receipts within that day boundary.

Output:

- total_outflow_cents for that day
- list of receipts within the day

Invariant:

- Day view is a grouping of receipts, not a separate ledger.

---

# Place View (Derived)

Route:

    /app/money/place/[slug]

Definition:

- Place view aggregates receipts by merchant_slug.

Output:

- total_outflow_cents for that merchant_slug (optionally within a time filter)
- list of receipts contributing to the aggregation

Invariant:

- Merchant slug must be stable for consistent grouping.
- Place is derived; it must never become a competing source of truth.

---

# 365 View (Derived)

Route:

    /365 (legacy) or /app/money (canonical surface)

Definition:

- Represents the rolling 365 window derived from receipts.

Output:

- rolling_365_outflow_cents
- optional breakdowns (by day, by merchant) derived from the same receipt set

Invariant:

- 365 view is derived strictly from receipts and the rolling window contract.

---

# Time Boundary Law

Computation depends on correct time boundaries.

Rules:

- “Today” uses the user’s local day boundary.
- Rolling 365 uses a trailing window ending now.
- purchased_at is the canonical timestamp for inclusion.

No computation may use:

- client counters
- incremental accumulators
- “session totals” stored outside receipts

---

# Caching and Storage

Computed values may be cached for performance.

Invariant:

- Cached values must be recomputable from receipts.
- Receipts remain the canonical source of truth.
- Cache must never become authoritative.

---

# System Summary

Outflō computation derives all meaning from receipts.

Money arithmetic is performed in atomic cents.

Canonical outputs are:

- daily_outflow_cents (today)
- rolling_365_outflow_cents (trailing 365 days)

Day and place views are derived groupings of the same receipt set.

---

End of Document.