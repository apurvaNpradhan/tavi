import { pixelBasedPreset, type TailwindConfig } from "@react-email/components";

/**
 * Email design tokens, transcribed from `DESIGN.md` (`apps/web/src/index.css`).
 *
 * `pixelBasedPreset` converts Tailwind's rem units to pixels because several
 * email clients do not support `rem`. The palette is the light theme only:
 * email clients do not support `dark:` selectors, so dark mode is reached by the
 * client's own inversion and is kept readable through contrast instead.
 *
 * Keep this table in sync with `@theme inline` in `apps/web/src/index.css`. A
 * missing token does not fail loudly — it renders an unstyled utility.
 */
export default {
  presets: [pixelBasedPreset],
  theme: {
    extend: {
      colors: {
        background: "#ffffff",
        foreground: "#262626",
        card: "#ffffff",
        secondary: "#f5f5f5",
        muted: "#f5f5f5",
        "muted-foreground": "#696969",
        accent: "#f5f5f5",
        border: "#ebebeb",
        input: "#e6e6e6",
        primary: "#262626",
        "primary-foreground": "#fafafa",
        destructive: "#b4261a",
        "destructive-foreground": "#8f1d14",
      },
      fontFamily: {
        sans: ["Inter Variable", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono Variable"', "ui-monospace", "SF Mono", "Menlo", "monospace"],
      },
      borderRadius: {
        sm: "6px",
        md: "8px",
        lg: "10px",
        xl: "14px",
      },
    },
  },
} satisfies TailwindConfig;
