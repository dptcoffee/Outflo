# OUTFLO — ACCOUNT PROFILE (v1)

Status: Draft  
Scope: Identity, account setup, and environment preferences

This document defines the canonical `/account/profile` surface for Outflō.

Purpose:
- Define the profile surface as the setup owner
- Separate identity from Home rendering
- Define account setup fields
- Define environment preferences consumed by Home
- Prevent Home from becoming a setup surface

---

# Core Principle

Profile defines.  
Home consumes.

`/account/profile` is the canonical surface where the user defines:

- identity
- account setup
- environment preferences

Home reads these values and renders the live system state from them.

---

# Route Contract

Canonical route:

/account/profile

Namespace:

/account/*

Protection:

app/account/layout.tsx

Rules:

- `/account/profile` is authenticated only
- `/account/profile` owns user-defined setup state
- Home must not own setup state

---

# Why Profile Comes First

Outflō is identity-bound.

The following system objects bind to user identity:

- profile
- user epoch
- account setup state
- ingest alias
- email mirror state
- environment preferences

Therefore the correct sequence is:

Auth  
Begin  
Profile  
Home

Profile exists before Home because Home consumes the values defined there.

---

# Surface Model

`/account/profile` contains three canonical sections:

1. Identity
2. Account Setup
3. Environment Preferences

These sections should remain stable.

---

# Section 1 — Identity

Purpose: define the visible user identity for the system.

Fields:

display_name  
avatar_url  
gallery_urls

Definitions:

display_name  
Human-readable profile label.

avatar_url  
Primary profile image used for identity surfaces.

gallery_urls  
Optional uploaded images belonging to the user profile.

Rules:

- gallery images are profile-owned assets
- gallery images belong to identity, not Home
- Home may read them later but does not define them

Invariant:

Identity assets are owned by Profile.

---

# Section 2 — Account Setup

Purpose: define the user’s account-level ingest and forwarding setup.

Fields:

ingest_alias  
email_mirror_enabled  
forwarding_verification_status

---

## ingest_alias

The user’s canonical receipt-ingest address.

Example:

2174441244514@outflo.xyz

Rules:

- alias uniquely maps to one user
- alias is identity-bound
- alias is displayed in Profile as setup information

---

## email_mirror_enabled

Defines whether automatic forwarding ingestion is enabled.

Rules:

- one mirror state per user
- Profile displays current state
- enabling or disabling mirror belongs to account setup

---

## forwarding_verification_status

Lifecycle state of forwarding activation.

Allowed states:

not_started  
pending  
confirmed  
active

Rules:

- verification must succeed before forwarding becomes active
- Profile displays verification state

Invariant:

Ingest setup is account state.

---

# Section 3 — Environment Preferences

Purpose: define how Home renders reality.

Fields:

base_currency  
time_display  
location_mode  
manual_city  
weather_mode

These are rendering preferences, not ledger truth.

---

## base_currency

Controls money display formatting.

Examples:

USD  
EUR  
GBP  
JPY

Rules:

- computation remains in atomic cents
- currency preference affects display only
- ledger storage remains unchanged

---

## time_display

Controls time rendering mode.

Allowed values:

auto  
fixed

auto  
Uses device timezone behavior.

fixed  
Uses a user-selected display mode if implemented later.

Rules:

- time display affects presentation only
- epoch math remains unchanged

---

## location_mode

Controls how location enters the environment engine.

Allowed values:

off  
device  
manual_city

off  
No location context.

device  
Uses device geolocation.

manual_city  
Uses a manually entered city.

Rules:

manual_city must be null unless location_mode = manual_city.

---

## manual_city

User-provided fallback city.

Examples:

Miami, FL  
London, UK

Rules:

- required only when location_mode = manual_city
- ignored when location_mode = off
- ignored when location_mode = device

---

## weather_mode

Controls whether weather is included in the environment snapshot.

Allowed values:

off  
on

Rules:

- weather fetch is skipped when off
- weather may run only when a valid location exists
- weather is environment context, not ledger truth

---

# Conditional Logic

Location behavior:

location_mode = off  
→ no location used

location_mode = device  
→ use device location

location_mode = manual_city  
→ require manual city

Weather behavior:

weather_mode = off  
→ no weather fetch

weather_mode = on  
→ weather fetch only if location exists

Invariant:

Weather requires location.

---

# Ownership Boundary

Profile owns:

- display name
- avatar
- uploaded images
- ingest alias visibility
- email mirror setup visibility
- verification state
- environment preferences

Home owns:

- runtime rendering
- device context
- environment snapshot display
- receipt environment display
- merchant orbit
- time scroll

Rule:

Home must not become a setup surface.

---

# Home Consumption Contract

Home reads:

profile identity  
environment preferences  
device context  
environment signals  
receipts  
derived merchant views  
time state

Resulting stack:

Profile  
Preferences  
Device Context  
Environment Snapshot  
Receipt Environment Display  
Merchant Orbit  
Home Time Scroll

---

# Suggested Data Shape

ProfileSettings

display_name: string or null  
avatar_url: string or null  
gallery_urls: string array  

ingest_alias: string or null  
email_mirror_enabled: boolean  
forwarding_verification_status: not_started | pending | confirmed | active  

base_currency: string  
time_display: auto | fixed  
location_mode: off | device | manual_city  
manual_city: string or null  
weather_mode: off | on

---

# UI Skeleton

/account/profile

Identity  
Profile image  
Upload images  
Display name  

Account Setup  
Your Outflō address  
Email mirror  
Verification status  

Environment Preferences  
Base currency  
Time display  
Location mode  
Manual city  
Weather mode

---

# Invariants

Profile defines identity.  
Profile defines account setup visibility.  
Profile defines environment preferences.  
Home consumes but does not define setup.  
Currency affects display, not computation.  
Time display affects rendering, not epoch law.  
Weather requires valid location.

---

# System Summary

`/account/profile` is the canonical setup owner for Outflō.

It defines:

- who the user is
- how account ingestion is configured
- how Home should render reality

Home then consumes this state and renders the live telemetry surface.

---

End of Document.