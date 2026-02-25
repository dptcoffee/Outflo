# Outflō — Ledger Architecture (Activation + Epoch Law)

Status: Locked
Scope: Identity, Activation, Epoch, Reset, Archive

---

## 1. Core State Model

Outflō operates under three primary states:

1. **Auth** — User identity verified.
2. **Activation** — User intentionally begins a ledger.
3. **Measurement (Ledger Active)** — System records outflow against immutable epoch.

An additional transitional state exists after reset:

4. **Dormant** — Authenticated but no active epoch. User must activate.

---

## 2. Epoch Law

* Epoch is created **only** when the user presses "Begin" on `/begin`.
* Epoch is stored in the cloud and is identity-bound.
* Epoch is immutable once created.
* Epoch never updates.
* All clocks derive strictly from cloud epoch.
* No localStorage fallback is permitted.

Definition:

> Epoch marks the beginning of a user’s identity ledger.

---

## 3. Routing Contract

Routing logic is state-driven, not UI-driven.

* Not authenticated → `/login`
* Authenticated + no epoch → `/begin`
* Authenticated + epoch exists → `/app/*`

`/begin` is reachable **only** when no epoch exists.

If epoch exists, any attempt to access `/begin` must redirect to `/app`.

---

## 4. Activation Threshold

`/begin` is a one-time threshold per ledger.

* User cannot access the application until activation.
* Pressing "Begin" creates the epoch.
* Activation is intentional.
* There is no silent epoch creation.

---

## 5. Hard Reset Law

Hard Reset performs the following actions:

1. Current ledger is sealed and archived.
2. Active epoch is deleted.
3. System transitions to Dormant state.
4. User is redirected to `/begin`.

Reset does **not** destroy historical data.

Reset does **not** modify timestamps.

Reset creates a pause between:

* Archive seal time
* New epoch creation time

This pause is intentional and defined.

---

## 6. Archive Principles

Archived ledgers are:

* Read-only
* Immutable
* Non-reactivable
* Non-mergeable

Archive preserves historical integrity.

Reset = Archive → Dormant → Activation → New Ledger

---

## 7. Clock Invariants

All time displays derive from:

```
age_ms = now_ms - epoch_ms
```

Rules:

* No incremental ticking.
* No stored counters.
* No client-derived epoch.
* Formatting may vary per page.
* Underlying scalar must remain identical.

This guarantees zero drift across pages and devices.

---

## 8. System Summary

Auth → Activation → Ledger → Archive → Dormant → Activation → Ledger

Outflō is identity-bound.

Time begins when chosen.

History is sealed, not rewritten.

The system is vault-based, not session-based.

---

End of Document.
