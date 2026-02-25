# OUTFLO — ENVIRONMENT ENGINE CONTRACT v1

Status: Locked  
Scope: Pure environment state generator (no UI)

---

## Function Signature

getEnvironmentState(time, weather) → EnvironmentState

---

## Inputs

time:
- localHour (0–23)
- localMinute (0–59)
- localSecond (0–59)

weather:
- cloud_density (0–1)
- rain_factor (0–1)
- storm_factor (0–1)

---

## Output: EnvironmentState

{
  brightness: number (0–1),
  hueShift: number,
  lightAngle: number (0–360),
  starOpacity: number (0–1),
  cloudEnabled: boolean,
  cloudDriftOffset: number,
  contrastModifier: number,
  glowModifier: number
}

---

## Invariants

- Continuous across time (no step changes)
- Midnight boundary is smooth
- No discrete mode switching
- Motion derived from time delta only
- No randomization inside function
- Deterministic for same inputs