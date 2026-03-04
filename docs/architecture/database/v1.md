# OUTFLO — DATABASE CONTRACT (v1)

Status: Locked

Scope  
Database schema, identity anchors, ingestion pipeline tables, and ledger invariants.

---

## 1. Purpose

Prevent schema drift, define canonical entities, document ingestion and identity contracts, and lock system invariants.

Database objects use snake_case.

---

## 2. Core Model

Database platform:

    Supabase (PostgreSQL)

Supabase Auth provides the canonical user identity.

Application tables reference users via:

    user_id (uuid)

---

## 3. Invariants

- Database objects use snake_case.
- All user-owned rows must bind to auth.uid().
- User identity is canonicalized through Supabase Auth.
- Epoch anchors are identity-bound, not device-bound.
- Ingest processing must be idempotent.
- Receipt IDs must remain stable.

---

## 4. Contracts

### profiles

Purpose  
Application-level user profile information.

Relationship

    auth.users (Supabase)
       ↓
    profiles

Each user should have one profile row.

Typical fields

    id (uuid, primary key, references auth.users)
    created_at (timestamptz)
    updated_at (timestamptz)

Invariant

- Exactly one profile per authenticated user.

---

### user_system

Purpose  
Stores system-level identity configuration for a user.

This allows Outflō to bind systems to identity rather than devices.

Examples

- money system activation
- time system activation
- system flags

Invariant

- One row per user.

---

### user_epochs

Purpose  
Defines the identity-bound epoch for the user.

Outflō time calculations derive from this anchor.

Example usage

    /app/time
    /app/home environment

Invariant

- Each user has one active epoch.
- Epoch is identity-bound, not device-bound.
- Epoch persists across login sessions and devices.

---

## 5. Ingest Layer

### ingest_aliases

Purpose  
Maps generated email aliases to users.

Example

    2174441244514@outflo.xyz

Fields typically include

    alias
    user_id
    created_at

Invariant

- Alias uniquely identifies a user ingest endpoint.

---

### inbound_email_stub

Purpose  
Temporary storage of inbound emails before full ingest processing.

This allows the system to:

- capture raw email data
- safely retry processing
- debug ingestion issues

Invariant

- Stubs may be processed or discarded after parsing.

---

### ingest_events

Purpose  
Event log for ingestion processing.

Tracks:

- webhook arrival
- parsing attempts
- processing state

Typical states

    received
    processed
    failed
    skipped

Invariant

- Ingest events must be idempotent.
- Duplicate webhook deliveries must not create duplicate receipts.

---

### forwarding_verifications

Purpose  
Tracks verification flow for email forwarding.

Used when enabling email mirror ingestion.

Typical lifecycle

    verification_created
    verification_confirmed
    verification_active

Invariant

- Verification must succeed before forwarding ingestion activates.

---

## 6. Email Mirror

### email_mirror_state

Purpose  
Tracks whether a user has enabled email mirror ingestion.

Email mirror allows automatic receipt ingestion through email forwarding.

Typical fields

    user_id
    enabled
    created_at
    updated_at

Invariant

- One mirror state per user.

---

## 7. Ledger Layer

### receipts

Purpose  
Canonical spend record for Outflō.

Receipts represent money leaving the user system.

Routes referencing receipts

    /app/money/receipts
    /app/money/receipts/[id]

Typical fields

    id (uuid)
    user_id (uuid)
    amount
    merchant
    merchant_slug
    purchased_at
    created_at

Invariant

- Each receipt belongs to one user.
- Receipt ID must remain stable.
- Receipt must resolve via UUID route.

Receipts are the primary spend record for the system.

---

## 8. Derived System Views

These are logical views derived from receipts.

### Day

    /app/money/day/[key]

Represents a calendar day of spending derived from receipt timestamps.

---

### Place

    /app/money/place/[slug]

Aggregates receipts by merchant.

---

### 365 Window

    /365

Represents rolling yearly spending derived from receipt timestamps.

---

## 9. Security Model

Row Level Security (RLS) must enforce:

    user_id = auth.uid()

for all user-owned rows.

Tables requiring RLS

    profiles
    receipts
    user_epochs
    user_system
    email_mirror_state
    ingest_aliases

Admin routes may use the Supabase service role.

Service role keys must never appear in client code.

---

## 10. Operational Guarantees

The ingest pipeline must support:

- webhook retries
- delayed delivery
- duplicate events

This is enforced through:

    ingest_events

and unique identifiers from providers.

---

## 11. Definition of Done

Database contract is implemented when:

- All tables above exist
- RLS protects user data
- Receipts resolve via UUID routes
- Ingest is idempotent
- User epoch is identity-bound

---

End of Document.