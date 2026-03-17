# OUTFLO — RECEIPT SYSTEM (v1)

Status: Locked

Scope  
Defines the structure, ingest rules, and invariants for Outflō receipts.  
Receipts represent immutable outflow moments captured at ingest.

---

## 1. Purpose

The Receipt system records permanent moments of financial outflow.

A receipt represents the intersection of:

- money
- time
- location
- environment

Receipts prioritize **moment integrity** over editability.

The system exists to create a trustworthy record of what left the user.

Receipts are not accounting entries and are not part of a budgeting system.

They represent **observed outflow moments only**.

---

## 2. Core Model

A receipt captures the minimal canonical truth of a spending event.

Core receipt fields:

- receipt_no
- moment_ms
- amount_minor
- currency
- merchant_raw

Supporting system fields:

- amount_base_minor
- base_currency
- fx_rate

Optional enrichment:

- merchant_normalized
- payment_rail

Environmental context is stored separately in `receipt_environment`.

Environment snapshot fields may include:

- lat
- lng
- temperature_c
- humidity_pct
- weather_code
- precipitation_mm
- wind_speed_mps
- wind_gust_mps
- wind_dir_deg
- pressure_hpa
- cloud_cover_pct
- uv_index
- sun_altitude_deg
- sun_azimuth_deg

All environmental values are stored in **metric units**.

Environment records are captured immediately after receipt ingest.

---

## 3. Invariants

The following rules must always remain true.

Receipts are immutable.

Rules:

- No delete
- No hide
- No edits
- No historical mutation

Canonical time is `moment_ms`.

Rules:

- Unix milliseconds
- 13 digits
- true millisecond precision
- stored in UTC
- never rounded

Receipt identity is `receipt_no`.

Rules:

- 13 digit numeric identifier
- randomized
- globally unique
- not derived from time
- immutable

Currency storage rules:

- currency stored as ISO-4217 code
- symbols are never stored
- amounts stored in minor units

Money truth rules:

- receipts store original transaction currency
- orbit calculations use base_currency
- fx_rate captured at ingest and never recalculated

Environment capture rules:

- environment captured at ingest when available
- failure to capture environment never blocks receipt creation
- environment snapshots are immutable

---

## 4. Contracts

Database structure:

receipts table

Fields:

- receipt_no
- moment_ms
- amount_minor
- currency
- amount_base_minor
- base_currency
- fx_rate
- merchant_raw
- merchant_normalized (optional)
- payment_rail (optional)

receipt_environment table

Fields:

- receipt_id
- captured_ms
- lat
- lng
- temperature_c
- humidity_pct
- weather_code
- precipitation_mm
- wind_speed_mps
- wind_gust_mps
- wind_dir_deg
- pressure_hpa
- cloud_cover_pct
- uv_index
- sun_altitude_deg
- sun_azimuth_deg

Rules:

- one receipt may have zero or one environment snapshot
- environment stored separately from money data
- captured_ms records when the environment snapshot was recorded

---

## 5. Operational Rules

Receipt ingestion follows this sequence.

1. Receipt moment is identified.
2. Canonical time (`moment_ms`) is captured.
3. Monetary values are stored.
4. Receipt record is written.
5. Environment snapshot is attempted.
6. Environment snapshot is stored if available.

Receipt creation must never fail due to enrichment failures.

Receipts remain permanent once created.

System improvements affect **future receipts only**.

---

## 6. System Summary

The Receipt system records immutable outflow moments.

Each receipt anchors a moment of spending using:

- canonical time
- monetary truth
- optional environmental context

Receipts cannot be edited or removed.

The system prioritizes **moment integrity and permanent recordkeeping** over flexibility.

Receipts form the foundational data layer for understanding what leaves the user.

---

End of Document.