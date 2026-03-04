# OUTFLO — INGEST PIPELINE (v1)

Status: Locked  
Scope: Email ingestion, alias resolution, receipt creation

This document defines how external email events become canonical receipts in Outflō.

Purpose:
- Define the ingestion pipeline
- Guarantee idempotent receipt creation
- Preserve auditability of external events
- Prevent duplicate receipt creation

---

# Pipeline Overview

Outflō receives receipts through an email ingestion pipeline.

The canonical flow:

```
Email → Alias → Webhook → Stub → Event Processing → Receipt
```

External systems never create receipts directly.  
Receipts are created only through the ingest processor.

---

# Ingest Entry Point

Inbound email is received through:

```
/api/ingest/resend
```

This route handles webhook delivery from the email provider.

Responsibilities:

- accept inbound email payload
- validate webhook structure
- store the raw email stub
- create an ingest event
- trigger processing

---

# Alias Resolution

Each user is assigned a unique email alias.

Example:

```
2174441244514@outflo.xyz
```

Aliases are stored in:

```
ingest_aliases
```

Fields typically include:

```
alias
user_id
created_at
```

Invariant:

- Alias uniquely maps to a single user.
- Alias resolution must succeed before processing continues.

If alias resolution fails:

- the event is logged
- no receipt is created.

---

# Stub Capture

Raw inbound email is stored before parsing.

Table:

```
inbound_email_stub
```

Purpose:

- preserve raw input
- allow replay of events
- support debugging
- isolate webhook reliability from processing logic

Invariant:

- Stub capture must occur before processing.

---

# Event Log

All ingestion processing is tracked through:

```
ingest_events
```

Typical event lifecycle:

```
received
processed
failed
skipped
```

Fields typically include:

```
event_id
stub_id
status
created_at
processed_at
```

Purpose:

- guarantee idempotency
- allow safe retries
- provide system audit trail

---

# Idempotency Law

Webhook delivery may occur multiple times.

The ingest pipeline must therefore be idempotent.

Rules:

- Duplicate webhook deliveries must not create duplicate receipts.
- Each inbound message must resolve to a single ingest event.
- Receipt creation must check for prior processing.

The ingest_events table enforces this invariant.

---

# Receipt Creation

Receipts are created only after:

1. Alias resolution succeeds
2. Stub capture succeeds
3. Event processing begins

Canonical table:

```
receipts
```

Typical fields:

```
id
user_id
amount
merchant
merchant_slug
purchased_at
created_at
```

Invariant:

- Each receipt belongs to one user.
- Receipt IDs must remain stable.
- Receipts must resolve through UUID routes.

Example route:

```
/app/money/receipts/[id]
```

---

# Processing Responsibilities

The ingest processor performs:

- merchant extraction
- amount extraction
- timestamp resolution
- slug normalization

Processing may improve over time, but must not break:

- idempotency
- user identity binding
- receipt UUID stability

---

# Failure Handling

If processing fails:

- event status becomes `failed`
- receipt is not created
- stub remains stored

Failed events may be retried safely.

---

# Security Model

Receipts created through ingestion must enforce:

```
user_id = auth.uid()
```

Row Level Security applies to:

```
receipts
ingest_aliases
ingest_events
```

Service role access may be used by server routes.

Service keys must never appear in client code.

---

# System Summary

```
Email
  ↓
Alias Resolution
  ↓
Stub Capture
  ↓
Event Creation
  ↓
Processing
  ↓
Receipt Creation
```

External input is always recorded before transformation.

This guarantees:

- auditability
- replay capability
- idempotent receipt creation

---

End of Document.