# OUTFLO — RECEIPT UI CONTRACT (v1)

Status: Locked

Scope
Defines the user-facing contract for the Outflō Receipt surface.
This document governs what is shown, where it is shown, and what must never appear.
It does not define internal algorithms or system law.

---

## 1. Purpose

The Receipt surface records a single moment of outflow as a calm, precise, immutable artifact.

---

## 2. Principles

- Capture everything; display only meaning.
- Calm surface: minimal visible fields, expandable detail.
- No algorithm leakage: no summations, no formulas, no symbolic law.
- Facts over interpretation; interpretation belongs to the AI layer.
- No duplicates across sections unless required for human comprehension.
- Receipts are immutable records: no delete, no hide.

---

## 3. Surface Definition

- Surface Name: Receipt
- Route(s): `/money/receipts/[id]`
- Entry points:
  - Receipt list
  - Day view drilldown
  - Merchant orbit drilldown
- Exit points:
  - Back to list / prior view
  - Day view
  - Merchant orbit view
  - Engine explainer
- Primary user action: Read the moment; optionally navigate to related views.

---

## 4. Layout Contract

Canonical section order (fixed once Locked):

1. Hero
2. Position
3. Orientation
4. Environment
5. Ledger
6. Explore
7. Footer

---

## 5. Section Contracts

### Hero

Purpose
Recognition layer for the moment: who/when/how much.

Visible (Always)
- Merchant identity (logo or deterministic avatar)
- Merchant name
- Moment (human-readable timestamp)
- Amount (original transaction currency)

Reveal (Expand / Tap)
- None (Hero remains minimal)

Hidden (Captured but not shown here)
- Any system totals (Day/Orbit)
- Any environment fields
- Any ledger anchors (raw ms values, epoch math)
- Any formulas or internal mechanics

Formatting Rules
- Merchant Logo order:
  1) Stored logo URL (if present)
  2) Free opportunistic domain logo (if resolvable)
  3) Deterministic avatar
- Deterministic avatar:
  - Color derived from `merchant_normalized` hash
  - Letter = first character of merchant
- Moment display:
  - Derived from `moment_ms`
  - Timezone follows user setting (auto or fixed)
  - Internationalization supported
- Amount:
  - Shows original transaction currency
  - Currency symbol derived from ISO code
  - No base-currency conversion displayed in Hero

Interaction Rules
- None required for v1

Empty / Missing Data Rules
- If merchant logo unavailable → deterministic avatar
- If merchant_normalized missing → derive avatar from merchant_raw
- If moment_ms missing → render `—` (should not occur for valid receipts)

Never Rules
- Must never show formulas, summations, or symbols beyond basic punctuation.
- Must never show Orbit totals or system math.

---

### Position

Purpose
Financial coordinates of the receipt in the system.

Visible (Always)
- Day
- Orbit (365)
- Index

Reveal (Expand / Tap)
- None (Position remains minimal)

Hidden (Captured but not shown here)
- Merchant drilldown details
- Environment details
- Raw ledger anchors

Formatting Rules
- Day:
  - Today running total (base currency)
  - No date displayed
- Orbit (365):
  - Rolling 365-day outflow total (base currency)
  - Thousands separators required
  - No abbreviations (no “k”, “m”)
- Index:
  - Derived ordering index for receipt position
  - Integer only

Interaction Rules
- None required for v1

Empty / Missing Data Rules
- If totals cannot be computed → show `—` for that line

Never Rules
- Must never show merchant-specific orbit stats here.
- Must never show original currency here.

---

### Orientation

Purpose
Where the moment happened (spatial context).

Visible (Always)
- City, State
- Coordinates (lat, lng)

Reveal (Expand / Tap)
- None required for v1

Hidden (Captured but not shown here)
- Country (implicit; not displayed)
- Weather (belongs to Environment)

Formatting Rules
- City, State:
  - Derived from coordinates (reverse geocode or user-selected city mode)
  - Display as `City, ST`
- Coordinates:
  - Display as `lat, lng`
  - Storage is full precision; display uses reasonable precision (e.g., 4 decimals)
  - No rounding in storage

Interaction Rules
- None required for v1

Empty / Missing Data Rules
- If location unavailable:
  - City, State → `—`
  - Coordinates → `—`

Never Rules
- Must never display Country.
- Must never display weather fields here.

---

### Environment

Purpose
What the world was like at the moment (atmospheric snapshot).

Visible (Always)
- Collapsed line: `Temperature • Conditions`

Reveal (Expand / Tap)
- Temperature
- Conditions
- Humidity
- Precipitation
- Wind
- UV Index

Hidden (Captured but not shown here)
- Deeper atmospheric fields (captured for AI layer / future use), e.g.:
  - pressure
  - cloud cover
  - sun position
  - dew point
  - visibility

Formatting Rules
- Collapsed line:
  - Order: `Temperature • Conditions`
  - Example: `82°F • Clear`
- Units:
  - Stored metric by default; display may convert per user preference
- Values:
  - Temperature: shown as whole number or 1 decimal if available
  - Humidity: percent
  - Precipitation: mm
  - Wind: km/h (or m/s if preferred later)
  - UV Index: number

Interaction Rules
- Tap expands/collapses the Environment block.

Empty / Missing Data Rules
- If environment unavailable:
  - Collapsed line shows `—`
  - Expanded fields show `—` (or section can remain collapsed-only)
- Missing single fields render as `—` without breaking layout.

Never Rules
- Must never interpret environment (no “you spend more when…”).
- Must never show formulas or correlation language.

---

### Ledger

Purpose
System truth anchors and technical identifiers for the moment.

Visible (Always)
- Receipt (receipt_no)
- Moment (ms) (moment_ms)
- User Epoch (ms) (user_epoch_ms)
- Δ Epoch (human-readable duration)
- Payment Rail

Reveal (Expand / Tap)
- None required for v1

Hidden (Captured but not shown here)
- Coordinates (belong to Orientation; do not repeat)
- Any formulas; any summation/window law

Formatting Rules
- Receipt:
  - 13 digits
  - Randomized
  - Globally unique
  - Not derived from time
- Moment (ms):
  - 13-digit Unix milliseconds
  - Must not be rounded (no forced trailing zeros)
- User Epoch (ms):
  - 13-digit Unix milliseconds
- Δ Epoch:
  - Derived display of `moment_ms - user_epoch_ms`
  - Render as `D days • HH:MM:SS`
  - Δ symbol allowed; no further symbolic notation
- Payment Rail:
  - Human-readable label (e.g., Cash App, Apple Pay, Visa)

Interaction Rules
- None required for v1

Empty / Missing Data Rules
- If user_epoch_ms missing → show `—` for User Epoch and Δ Epoch
- If payment rail missing → show `—`

Never Rules
- Must never show summation/window formulas.
- Must never include symbolic “t0” or internal law notation.

---

### Explore

Purpose
Navigation to related views; expands exploration without changing receipt meaning.

Visible (Always)
- See all transactions for this day
- Check your [Merchant] Orbit
- Learn how the Engine works

Reveal (Expand / Tap)
- None required for v1

Hidden (Captured but not shown here)
- Any orbit stats (count/total/last); these live in the destination view.

Formatting Rules
- Merchant orbit label dynamically inserts merchant name.

Interaction Rules
- Day link opens Day view for this receipt’s day.
- Merchant orbit link opens Merchant Orbit view for this receipt’s merchant.
- Engine link opens Engine explainer page.

Empty / Missing Data Rules
- If merchant unknown → Merchant orbit link label becomes `Check your Merchant Orbit` or is disabled.

Never Rules
- Explore must not compute or display interpretive insights.
- No environment correlations here.

---

### Footer

Purpose
Identify the issuer of the receipt artifact.

Visible (Always)
- `Generated by Outflō`
- `outflo.xyz`

Reveal (Expand / Tap)
- None

Formatting Rules
- Minimal, quiet, receipt-like.

Never Rules
- No slogans (e.g., no “Returns what leaves you”, no “Check your orbit”).

---

## 6. Display Rules

- Currency:
  - Hero shows original transaction currency.
  - Position totals use user base currency.
  - No currency symbols stored; symbols derived from ISO.
- Time:
  - Hero shows human-readable timestamp derived from moment_ms.
  - Ledger shows raw ms anchors and Δ Epoch readable duration.
  - No additional formatted time lines in Ledger (avoid redundancy and creep).
- Numbers:
  - Thousands separators for large totals.
  - No abbreviations (no k/m).
- Units:
  - Environment stored metric by default; convert for display if user preference exists.
- No symbols:
  - Only allow plain punctuation and Δ in Ledger.
  - Never expose formulas or mathematical law notation.

---

## 7. Navigation Contract

- Day:
  - Label: `See all transactions for this day`
  - Destination: Day view for this receipt day
- Merchant Orbit:
  - Label: `Check your [Merchant] Orbit`
  - Destination: Merchant orbit view for this merchant
- Engine:
  - Label: `Learn how the Engine works`
  - Destination: Engine explainer

Rules:
- Navigation must not mutate receipt truth.
- No hidden side effects.

---

## 8. State Rules

- Loading: show skeleton; do not invent values.
- Empty: invalid receipt ID renders a clear not-found state.
- Error: show error state; do not degrade into fake data.
- Enrichment failures (env/location):
  - Receipt must render.
  - Missing enrichment renders `—`.

---

## 9. Invariants

- Section order is fixed once Locked.
- No delete, no hide for receipt truth.
- No algorithm exposure in the Receipt surface.
- Orientation holds coordinates; Ledger must not repeat them.
- Environment collapsed line is always `Temperature • Conditions` when available.
- Explore is navigation only; no insight computation.

---

## 10. Versioning

- This document is Locked.
- Any change to layout order, visible fields, or meaning requires `v2` (Draft → Locked).

---

## 11. System Summary

- The Receipt surface presents a calm, precise record of a single outflow moment.
- It shows: merchant, amount, moment, system position, place, environment signal, system anchors, and navigation.
- It never shows: formulas, summation law, symbolic mechanics, interpretive correlations.
- It expands via Environment (details) and Explore (navigation), not via analytics on the receipt.
- Footer always identifies the issuer: `Generated by Outflō` and `outflo.xyz`.

---

End of document.