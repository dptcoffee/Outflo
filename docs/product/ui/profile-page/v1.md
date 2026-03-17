# OUTFLO — PROFILE PAGE LAYOUT CONTRACT
Version: v1
Status: LOCKED
Scope: Profile hub, routing spine, and footer architecture

----------------------------------------------------------------

## 1. Purpose

This document defines the canonical layout of the Outflō
Profile page for launch.

The Profile page functions as the account control hub.

It is intentionally navigation-first.

The page does not surface detailed settings, toggles,
or account fields directly on the hub itself.

Instead, the page defines a stable drill-down architecture
so all detailed controls can live inside dedicated subpages.

The goal is to ensure:

- structural clarity
- launch readiness
- scalable account architecture
- minimal code drift
- stable top-level navigation

----------------------------------------------------------------

## 2. Layout Rule

The Profile page is a hub.

It surfaces only:

- identity
- navigation entry points
- official product statement
- institutional footer content

It does not surface:

- detailed settings
- toggles
- forms
- internal IDs
- drill-down subcomponents

All detailed functionality belongs inside drill-down pages.

----------------------------------------------------------------

## 3. Identity Surface

The top of the page contains the identity surface.

It includes:

- avatar
- name
- @username
- Edit Profile action

Structure:

Avatar  
Name  
@username  

Edit Profile

Notes:

- Avatar supports upload
- Avatar fallback may use gradient + initial
- Detailed profile fields do not appear here
- Identity surface remains visually simple

----------------------------------------------------------------

## 4. Navigation Hub

The main body of the page contains the account navigation hub.

The following items are surfaced for launch:

Account →  
Environment →  
Money →  
Privacy →  
Notifications →  
Records →  
Invite Friends →  
Support →

These items define the account architecture of the app.

They are intentionally surfaced now, even if their
destination pages are initially simple.

----------------------------------------------------------------

## 5. Drill-Down Rule

Each navigation item must route to its own dedicated page.

For launch, these pages may be minimal.

A minimal drill-down page may contain:

- title
- short description
- back to Profile link

This is sufficient to lock routing and architecture.

The structure is considered complete once the routes exist.

----------------------------------------------------------------

## 6. Routing Spine

The following routes define the launch account spine:

/account  
/account/environment  
/account/money  
/account/privacy  
/account/notifications  
/account/records  
/account/invite  
/account/support  

Note:

The exact Account route may resolve to the profile page
or dedicated account surface depending on implementation,
but the top-level architecture is considered locked.

----------------------------------------------------------------

## 7. Official System Statement

Below the navigation hub, the page includes a short
official Outflō statement.

This statement is not locked in wording yet.

Its purpose is to give the page an official,
institutional ending and clarify what Outflō is.

The statement may reference concepts such as:

- personal telemetry
- Unix time
- user-defined epochs
- records across money, time, and environment
- Outflō not being a bank

This statement is part of the layout contract,
but not yet part of the text contract.

----------------------------------------------------------------

## 8. Institutional Footer

Below the official statement, the page includes
the institutional footer.

The following items are surfaced:

Privacy Notice →  
Terms of Service →  
References →

These items are not part of the main account hub.

They function as official product and legal references.

----------------------------------------------------------------

## 9. Final Footer Layer

The page ends with a final footer layer containing:

Social →  
Version

This footer layer gives the page a complete,
product-level ending.

Exact links and version formatting are not locked here.

Only placement is locked.

----------------------------------------------------------------

## 10. Launch Canon

For launch, the Profile page must follow this structure:

Identity Surface  
Navigation Hub  
Official System Statement  
Institutional Footer  
Final Footer Layer

This layout is LOCKED.

Future expansion should occur inside drill-down pages,
not by adding detailed controls directly to the hub.