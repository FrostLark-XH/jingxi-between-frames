---
version: alpha
name: 镜隙之间 (Between the Frames)
description: >
  A quiet, healing AI diary app. Darkroom-inspired dark themes with warm amber
  safelight accents, or light rice-paper theme. WebGL shader backgrounds, grain
  texture, fogged-glass panels. The visual language draws from darkroom photography,
  aged photo paper, mirror gaps, and low-light warmth — never flashy, never loud.
  Every surface breathes.

colors:
  # ── Darkroom default (mist-darkroom) ──
  bg-base-dark: "#13161A"
  bg-soft-dark: "#1A1D22"
  accent-dark: "#C08850"
  accent-soft-dark: "#9A6840"
  accent-glow-dark: "rgba(154,104,64,0.26)"
  text-primary-dark: "#F2EDE4"
  status-error-dark: "#C4786A"

  # ── Warm rose dark (dusk-bean) ──
  bg-base-rose: "#1F191B"
  bg-soft-rose: "#292024"
  accent-rose: "#C88070"
  accent-soft-rose: "#A06055"
  accent-glow-rose: "rgba(160,96,85,0.28)"
  text-primary-rose: "#F1E8E3"
  status-error-rose: "#C4756E"

  # ── Light rice-paper (morning-grey) ──
  bg-base-light: "#ECE6DC"
  bg-soft-light: "#E3DCCF"
  accent-light: "#A07858"
  accent-soft-light: "#C8A890"
  accent-glow-light: "rgba(200,168,144,0.32)"
  text-primary-light: "#2C2824"
  status-error-light: "#B56860"

  # ── Semantic ──
  hairline: "rgba(255,255,255,0.06)"
  hairline-light: "rgba(0,0,0,0.08)"
  overlay: "rgba(0,0,0,0.45)"
  toast-bg: "rgba(26,29,34,0.92)"
  shader-grain-opacity: 0.028

typography:
  display:
    fontFamily: "system-ui, -apple-system, 'Noto Serif SC', serif"
    fontSize: 24px
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: 0.02em
  title:
    fontFamily: "system-ui, -apple-system, 'Noto Sans SC', sans-serif"
    fontSize: 18px
    fontWeight: 500
    lineHeight: 1.5
    letterSpacing: 0.01em
  body:
    fontFamily: "system-ui, -apple-system, 'Noto Sans SC', sans-serif"
    fontSize: 15px
    fontWeight: 400
    lineHeight: 1.75
    letterSpacing: 0
  caption:
    fontFamily: "system-ui, -apple-system, 'Noto Sans SC', sans-serif"
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0.04em
    textTransform: uppercase
  code:
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace"
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.6

rounded:
  sm: 6px
  md: 10px
  lg: 16px
  xl: 24px
  full: 9999px

spacing:
  xs: 6px
  sm: 12px
  md: 20px
  lg: 32px
  xl: 48px
  section: 80px

shadows:
  card: "0 1px 3px rgba(0,0,0,0.3)"
  card-hover: "0 4px 16px rgba(0,0,0,0.4)"
  overlay: "0 8px 32px rgba(0,0,0,0.5)"
  glow-soft: "0 0 40px {colors.accent-glow-dark}"

components:
  page-shell:
    description: Full-viewport dark container with WebGL shader background and grain texture overlay
    backgroundColor: "{colors.bg-base-dark}"
    textColor: "{colors.text-primary-dark}"
    minHeight: 100dvh

  memory-card:
    description: Time-film frame card — the core content unit. Thin hairline border, subtle shadow, rounded
    backgroundColor: "{colors.bg-soft-dark}"
    textColor: "{colors.text-primary-dark}"
    rounded: "{rounded.md}"
    padding: "{spacing.md}"
    border: "1px solid {colors.hairline}"
    shadow: "{shadows.card}"
    hover:
      shadow: "{shadows.card-hover}"

  memory-input:
    description: Full-width textarea for recording moments. Transparent bg on soft surface, no visible border when idle
    backgroundColor: transparent
    textColor: "{colors.text-primary-dark}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "{spacing.md}"
    minHeight: 120px
    placeholder:
      textColor: "rgba(255,255,255,0.2)"

  action-bar:
    description: Fixed bottom bar with primary action button. Safe-area-aware on mobile
    position: "fixed bottom-0"
    backgroundColor: "{colors.bg-soft-dark}"
    borderTop: "1px solid {colors.hairline}"
    padding: "{spacing.sm} {spacing.md}"
    paddingBottom: "env(safe-area-inset-bottom)"

  button-primary:
    description: Warm amber safelight button — the only colored CTA on the page
    backgroundColor: "{colors.accent-dark}"
    textColor: "{colors.bg-base-dark}"
    typography: "{typography.title}"
    rounded: "{rounded.md}"
    padding: "10px 24px"
    height: 44px
    active:
      backgroundColor: "{colors.accent-soft-dark}"

  button-ghost:
    description: Transparent button with hairline border, used for secondary actions
    backgroundColor: transparent
    textColor: "{colors.text-primary-dark}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "8px 20px"
    border: "1px solid {colors.hairline}"

  day-summary-card:
    description: Chapter-head card shown at day boundary in the timeline
    backgroundColor: transparent
    textColor: "{colors.accent-dark}"
    typography: "{typography.caption}"
    padding: "{spacing.lg} 0"
    borderBottom: "1px solid {colors.hairline}"

  frame-detail-overlay:
    description: Full-screen overlay when tapping a memory frame
    backgroundColor: "{colors.overlay}"
    backdropFilter: "blur(20px)"
    rounded: "{rounded.xl}"

  status-toast:
    description: Brief floating toast for save/delete confirmations
    backgroundColor: "{colors.toast-bg}"
    textColor: "{colors.text-primary-dark}"
    typography: "{typography.caption}"
    rounded: "{rounded.full}"
    padding: "8px 20px"
    shadow: "{shadows.overlay}"

  theme-switcher:
    description: Small icon button cycling through 3 themes
    size: 36px
    rounded: "{rounded.full}"
    backgroundColor: transparent
    textColor: "{colors.text-primary-dark}"
    hover:
      backgroundColor: "rgba(255,255,255,0.06)"

  developing-dot:
    description: Small glowing dot on the timeline rail showing current position
    size: 6px
    rounded: "{rounded.full}"
    backgroundColor: "{colors.accent-dark}"
    shadow: "{shadows.glow-soft}"

  empty-state:
    description: Shown when no frames recorded yet. Centered, quiet, with guiding copy
    textColor: "rgba(255,255,255,0.3)"
    typography: "{typography.body}"
    padding: "{spacing.xl}"

  archive-panel:
    description: Slide-up panel for batch-exporting frames
    backgroundColor: "{colors.bg-soft-dark}"
    rounded: "{rounded.lg}"
    padding: "{spacing.lg}"
    shadow: "{shadows.overlay}"

---

## Overview

镜隙之间 (Between the Frames) is a personal AI diary app with a darkroom photography metaphor.
The visual language is quiet, healing, restrained — never flashy, never loud.

**Core visual metaphor**: A darkroom safelight. The page is a dim room; the accent color
is the warm amber glow of a safelight bulb. Memory cards are like photo prints hanging
on a line. The WebGL shader background adds subtle grain and low-frequency glow — like
chemicals swirling in a developing tray.

**Three themes** express the same design language at different color temperatures:
1. **冷灰暗房** (mist-darkroom, default) — cool blue-gray darkroom, amber safelight
2. **暖玫旧纸** (dusk-bean) — warm rose darkroom, aged photo paper in chemical bath
3. **晨雾米纸** (morning-grey) — light rice-paper, misted morning warmth

**Key characteristics:**
- Dark-first. The default theme is deep cool-gray, never pure black.
- Grain texture at very low opacity over every surface — never clean/flat.
- Amber safelight accent is the ONLY colored element; everything else is neutral.
- Chinese typography with breathing room — line-height ≥ 1.75 for body text.
- Cards have subtle shadows, not heavy ones. The room is dim, not pitch black.
- Fixed bottom action bar on mobile with safe-area padding.
- All overlays use backdrop-filter blur ("fogged glass" metaphor).
- Animation via Framer Motion — spring physics, gentle easing, never abrupt.

## Colors

### Three-theme system
All colors come from CSS custom properties set by `applyThemeToDocument()`.
Surfaces, borders, and text variants are derived via `color-mix()` in globals.css.
Each theme defines only 8 base values; everything else is computed.

### Accent philosophy
The accent color is the warm safelight — amber, terracotta, or brown depending on theme.
It's used on:
- One primary button per screen (the "显影" / Develop CTA)
- The timeline developing dot
- Day summary card text
- Active/focus rings

It is NEVER used as:
- Background fill for large surfaces
- Decorative gradients
- Multiple competing CTAs on the same screen

### Surface hierarchy (dark themes)
- `bg-base` — page floor (deepest)
- `bg-soft` — card surfaces, panel backgrounds (one step lighter)
- Derived surfaces: borders at 6% white, hover at 6% white, pressed at 10%

## Typography

### Font philosophy
System fonts only. No web font loading — the app works offline. Chinese text uses
system serif for display moments and system sans for body. Numbers and metadata
use tabular-nums where applicable.

### Hierarchy
| Token | Size | Weight | Use |
|---|---|---|---|
| `{typography.display}` | 24px | 400 | Day headers, empty state titles |
| `{typography.title}` | 18px | 500 | Card titles, button labels |
| `{typography.body}` | 15px | 400 | Memory text, input content |
| `{typography.caption}` | 12px | 400 | Timestamps, metadata, labels |
| `{typography.code}` | 13px | 400 | Export preview, debug info |

### Breathing room
Body line-height at 1.75 is non-negotiable. Chinese characters need more vertical
space than Latin text. Tight line-height on Chinese body text reads as cramped
and breaks the quiet atmosphere.

## Layout

### Mobile-first
- Single column, full-width. No sidebars, no grids.
- Fixed bottom action bar with `env(safe-area-inset-bottom)`.
- Touch targets minimum 44px.
- Cards stack vertically in the timeline.

### Timeline rail
The left-side timeline rail has a subtle vertical line and a `{component.developing-dot}`
at the current scroll position. The rail is the page's only structural element —
everything else is content flowing in time order.

### Empty state
When no frames exist: centered layout with one quiet guiding sentence and the
input area. No illustrations, no feature tours. Just: "记录今天的第一帧" in
muted text.

### Archive panel
Slide-up from bottom with backdrop blur. Checkbox + export format selector.
Panel height adapts to content, never full-screen.

## Elevation & depth

| Level | Treatment | Use |
|---|---|---|
| Floor | `{colors.bg-base}` + shader grain | Page background |
| Surface | `{colors.bg-soft}` + hairline border + card shadow | Memory cards |
| Overlay | `{colors.overlay}` + blur(20px) | Frame detail, archive panel |
| Toast | `{colors.toast-bg}` + strong shadow | Status confirmations |
| Glow | `{shadows.glow-soft}` on `{colors.accent-glow}` | Developing dot |

No z-index war. Floor < Surface < Overlay < Toast. The glow is always on Surface level.

## Animation

- Spring physics via Framer Motion, never duration-based easing.
- Develop animation: 600ms blur-in + overlay pulse when saving a frame.
- Timeline dot: `useSpring` driven by scroll position.
- Page transitions: subtle fade, no slide or scale.
- Hover states: 150ms color transition only — no transform scale.

## Do's and Don'ts

### Do
- Use system fonts. No web font loading.
- Keep the accent scarce — one colored element per screen.
- Line-height ≥ 1.75 for Chinese body text.
- Subtle shadows only. The room is dim, not harsh.
- Backdrop blur on overlays ("fogged glass").
- Safe-area padding on mobile bottom bar.
- Grain texture always present at low opacity.

### Don't
- Never use pure black (#000) or pure white (#fff). Always tinted.
- Never use saturated/bright colors beyond the accent.
- Never use bold font-weight on body text.
- Never animate with duration-based easing — spring physics only.
- Never show more than one primary button per screen.
- Never use gradients for decoration. The shader background provides visual texture.
- Never use box-shadow for focus rings — use a 1px accent ring.

## Responsive behavior

### Breakpoints
| Name | Width | Changes |
|---|---|---|
| Mobile | < 768px | Fixed bottom bar, full-width cards, stacked timeline |
| Desktop | ≥ 768px | Centered max-width container (640px), cards get subtle hover lift |

### Desktop note
The app is mobile-first. Desktop is a centered narrow column — it's a diary,
not a dashboard. Max content width caps at 640px. The extra horizontal space
is filled by the shader background.

## Iteration guide

1. Colors come from theme tokens, never hardcoded. Use `--bg-base`, `--accent`, etc.
2. New components inherit existing spacing, rounded, and shadow tokens.
3. Animation uses Framer Motion spring configs — copy from existing components.
4. Chinese text always needs extra line-height. Test with actual Chinese content.
5. Every component has 3 states: rest, hover, active/pressed.
6. Dark theme is the default. Light theme inherits the same structure, not a redesign.
