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

// ── Theme A: 雾灰暗房 (default) ─────────────────────────────────────────

const mistDarkroom: ThemeTokens = {
  id: "mist-darkroom",
  name: "雾灰暗房",
  bgBase: "#16181B",
  bgSoft: "#1D2024",
  accent: "#B07A5A",
  accentSoft: "#8F5A47",
  accentGlow: "rgba(143,90,71,0.28)",
  textPrimary: "#F3EFE7",
  statusError: "#C77B6B",
  shader: {
    glowColor1: [0.38, 0.30, 0.22],
    glowColor2: [0.30, 0.22, 0.16],
    glowIntensity: 0.028,
    grainOpacity: 0.025,
    bgBase: [0.086, 0.094, 0.106],
  },
};

// ── Theme B: 暮色豆沙 ────────────────────────────────────────────────────

const duskBean: ThemeTokens = {
  id: "dusk-bean",
  name: "暮色豆沙",
  bgBase: "#221D20",
  bgSoft: "#2B2529",
  accent: "#C0846A",
  accentSoft: "#9B6157",
  accentGlow: "rgba(155,97,87,0.30)",
  textPrimary: "#F1E9E4",
  statusError: "#C97972",
  shader: {
    glowColor1: [0.55, 0.28, 0.20],
    glowColor2: [0.40, 0.20, 0.14],
    glowIntensity: 0.032,
    grainOpacity: 0.022,
    bgBase: [0.133, 0.114, 0.125],
  },
};

// ── Theme C: 晨雾米灰 ────────────────────────────────────────────────────

const morningGrey: ThemeTokens = {
  id: "morning-grey",
  name: "晨雾米灰",
  bgBase: "#EAE5DC",
  bgSoft: "#E1DBD0",
  accent: "#A56F52",
  accentSoft: "#C89E85",
  accentGlow: "rgba(200,158,133,0.34)",
  textPrimary: "#2E2A27",
  statusError: "#B86B61",
  shader: {
    glowColor1: [0.72, 0.62, 0.52],
    glowColor2: [0.65, 0.55, 0.45],
    glowIntensity: 0.018,
    grainOpacity: 0.012,
    bgBase: [0.918, 0.898, 0.863],
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
