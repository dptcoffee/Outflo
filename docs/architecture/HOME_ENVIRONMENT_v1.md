# OUTFLO — HOME ENVIRONMENT SPEC v1

Status: Locked  
Scope: Authenticated Home (`/app/home`)  
Public Threshold excluded

---

## 1. Surface Separation

### Threshold (Public, Not Logged In)
- Void background
- O centered
- System state indicator
- No atmosphere
- No time layer
- No weather
- No motion

### Orbit (Authenticated Home)
- Time-aware
- Location-aware
- Weather-modulated
- Perceptible environmental drift
- O remains central mass

Threshold and Orbit are separate experiences.

---

## 2. Time Model

- Source: Local device time (timezone-aware)
- Midnight boundary: Local 00:00
- Continuous 24-hour interpolation
- No discrete “modes” (no hard Morning/Day/Night switches)
- Brightness driven by cosine-based curve
- Slight derivative amplification around dawn and dusk
- No theatrical sunrise/sunset coloration
- No seasonal adjustment in v1

Time defines environment state continuously.

---

## 3. Environment Function

Environment = f(time, weather)

Inputs:
- time_now (local device time)
- cloud_density
- rain_factor
- storm_factor

---

## 4. Layer Stack (Back to Front)

1. Sky Gradient
   - Continuous interpolation
   - Luminance + hue shift across 24h
   - Light vector rotates continuously

2. Star Field
   - Always rendered
   - Fixed low density
   - No twinkle
   - No independent animation
   - Visibility = (1 - brightness) × (1 - cloud_density)

3. Cloud Layer (Conditional)
   - Enabled only when cloud_density ≥ 0.6
   - Single soft mass layer
   - Extremely slow lateral drift
   - No parallax
   - No object edges
   - No stacking

4. Rain / Storm Modifiers
   - No particles
   - Rain:
     - Slight desaturation
     - Contrast reduction
     - Midtone darkening
   - Storm:
     - Additional luminance compression
     - Slight vignette increase
     - Slight O glow reduction

5. O (Mass)
   - Static
   - No pulse
   - No rotation
   - Glow slightly increases on Threshold → Orbit entry only
   - Shadow direction derived from light vector

6. Orientation Layer
   - Time (primary)
   - Temp · Condition (secondary)
   - Location (tertiary)
   - Lower third placement
   - No forecast
   - No scroll

7. Navigation
   - Money (left)
   - Profile (right)
   - No containers
   - No button styling
   - Quiet doorway presence

---

## 5. Motion Philosophy

- Motion must be perceptible within ~20 seconds
- Motion must not be noticeable within 3 seconds
- No recognizable loops
- No twinkle
- No pulse
- No user-triggered animation
- Drift derived strictly from time delta

Motion implies time passing.
Motion does not entertain.

---

## 6. Entry Transition (Threshold → Orbit Only)

Occurs only when crossing authentication boundary.

Sequence:
1. O persists
2. Background luminance blooms
3. O glow increases slightly
4. Atmosphere layers emerge
5. Orientation fades in last

Transition does not repeat within authenticated navigation.

---

## 7. Location & Weather

- Device location requested after login
- Environment renders immediately without blocking
- Weather modifies environment once resolved
- Graceful fallback if denied
- No loading spinners
- No blocking states

Weather affects atmosphere only.
Weather does not dominate hierarchy.

---

## 8. Non-Negotiables

- No gamification
- No progress indicators
- No alerts
- No forecast panels
- No decorative animation
- No theatrical sunrise/sunset effects
- O must never be visually competed with

---

End of Spec  
Version: v1