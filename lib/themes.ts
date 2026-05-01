// ── Theme token system for 镜隙之间 ──────────────────────────────────────
// Each theme defines only ~8 base values. Surfaces, borders, text variants
// are all derived via color-mix() in globals.css, ensuring every theme
// automatically gets surfaces tinted by its accent color.

export type ThemeId = "mist-darkroom" | "dusk-bean" | "morning-grey";

export type ThemeTokens = {
  id: ThemeId;
  name: string;
  bgBase: string;
  bgSoft: string;
  accent: string;
  accentSoft: string;
  accentGlow: string;
  textPrimary: string;
  statusError: string;
  shader: {
    glowColor1: [number, number, number];
    glowColor2: [number, number, number];
    glowIntensity: number;
    grainOpacity: number;
    bgBase: [number, number, number];
  };
};

// ── Theme A: 冷灰暗房 (default) ─────────────────────────────────────────
// Cold darkroom with amber safelight — the darkest, coolest theme.
// Background leans blue-gray; accent is a warm amber glow like a safelight bulb.

const mistDarkroom: ThemeTokens = {
  id: "mist-darkroom",
  name: "冷灰暗房",
  bgBase: "#13161A",
  bgSoft: "#1A1D22",
  accent: "#C08850",
  accentSoft: "#9A6840",
  accentGlow: "rgba(154,104,64,0.26)",
  textPrimary: "#F2EDE4",
  statusError: "#C4786A",
  shader: {
    glowColor1: [0.42, 0.33, 0.22],
    glowColor2: [0.32, 0.24, 0.16],
    glowIntensity: 0.026,
    grainOpacity: 0.028,
    bgBase: [0.075, 0.086, 0.102],
  },
};

// ── Theme B: 暖玫旧纸 ────────────────────────────────────────────────────
// Warm rose-tinted darkroom — aged photo paper in chemical bath.
// Background has a subtle rose/brown warmth; accent leans terracotta.

const duskBean: ThemeTokens = {
  id: "dusk-bean",
  name: "暖玫旧纸",
  bgBase: "#1F191B",
  bgSoft: "#292024",
  accent: "#C88070",
  accentSoft: "#A06055",
  accentGlow: "rgba(160,96,85,0.28)",
  textPrimary: "#F1E8E3",
  statusError: "#C4756E",
  shader: {
    glowColor1: [0.58, 0.30, 0.22],
    glowColor2: [0.42, 0.20, 0.15],
    glowIntensity: 0.030,
    grainOpacity: 0.024,
    bgBase: [0.122, 0.098, 0.106],
  },
};

// ── Theme C: 晨雾米纸 ────────────────────────────────────────────────────
// Light rice-paper theme — misted glass, morning warmth.
// Warm off-white background with muted brown accents; soft and airy.

const morningGrey: ThemeTokens = {
  id: "morning-grey",
  name: "晨雾米纸",
  bgBase: "#ECE6DC",
  bgSoft: "#E3DCCF",
  accent: "#A07858",
  accentSoft: "#C8A890",
  accentGlow: "rgba(200,168,144,0.32)",
  textPrimary: "#2C2824",
  statusError: "#B56860",
  shader: {
    glowColor1: [0.74, 0.64, 0.54],
    glowColor2: [0.68, 0.58, 0.48],
    glowIntensity: 0.016,
    grainOpacity: 0.014,
    bgBase: [0.925, 0.902, 0.863],
  },
};

// ── Theme map ────────────────────────────────────────────────────────────

export const themes: Record<ThemeId, ThemeTokens> = {
  "mist-darkroom": mistDarkroom,
  "dusk-bean": duskBean,
  "morning-grey": morningGrey,
};

export const themeList: ThemeTokens[] = [mistDarkroom, duskBean, morningGrey];

export const DEFAULT_THEME: ThemeId = "mist-darkroom";

// ── Apply theme to CSS variables ─────────────────────────────────────────
// Only sets base values. All surfaces/borders/text variants are derived
// from these via color-mix() in globals.css.

function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r} ${g} ${b}`;
}

export function applyThemeToDocument(theme: ThemeTokens): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.style.setProperty("--bg-base", theme.bgBase);
  root.style.setProperty("--bg-soft", theme.bgSoft);
  root.style.setProperty("--accent", theme.accent);
  root.style.setProperty("--accent-soft", theme.accentSoft);
  root.style.setProperty("--accent-glow", theme.accentGlow);
  root.style.setProperty("--text-primary", theme.textPrimary);
  root.style.setProperty("--status-error", theme.statusError);

  // RGB variants for Tailwind opacity modifier compatibility
  root.style.setProperty("--bg-base-rgb", hexToRgb(theme.bgBase));
  root.style.setProperty("--bg-soft-rgb", hexToRgb(theme.bgSoft));
  root.style.setProperty("--accent-rgb", hexToRgb(theme.accent));
  root.style.setProperty("--text-primary-rgb", hexToRgb(theme.textPrimary));
  root.style.setProperty("--status-error-rgb", hexToRgb(theme.statusError));
}
