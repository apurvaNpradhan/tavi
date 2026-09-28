---
version: alpha
name: Tavi
description: Tavi's design system for web and native. A restrained neutral language
  shared across the web app and Expo app, implemented with coss/Base UI on web and
  PanelUI/Uniwind on native. Use semantic tokens rather than raw literals; platform
  components and theme systems own their implementation details.
stack:
  web:
    styling: Tailwind CSS v4 (theme declared with @theme inline)
    primitives: Base UI via local coss-style components (useRender / mergeProps, cva, cn)
    token_source: apps/web/src/index.css
    components: apps/web/src/shared/ui
  native:
    styling: Tailwind CSS v4 via Uniwind
    primitives: PanelUI for Expo / React Native
    token_source: panelui-native/theme.css, imported by apps/native/global.css
    components: panelui-native and apps/native/shared/ui
colors:
  # Web values are documented here; native values come from PanelUI's semantic
  # theme tokens. Hierarchy comes from tone and hairlines, not decoration. Hue is
  # limited to semantic roles, never used as ornament.
  background: "#ffffff" # dark: #141414   page and app root
  foreground: "#262626" # dark: #f5f5f5   primary text and icons
  card: "#ffffff" # dark: #191919   cards, dialogs, dropdowns, menus
  card-foreground: "#262626" # dark: #f5f5f5
  popover: "#ffffff" # dark: #1d1d1d   surfaces stacked on surfaces
  popover-foreground: "#262626" # dark: #f5f5f5
  primary: "#262626" # dark: #f5f5f5   solid fill, one key action
  primary-foreground: "#fafafa" # dark: #262626
  secondary: "#f5f5f5" # dark: #1d1d1d   black/4% -> white/4%
  secondary-foreground: "#262626" # dark: #f5f5f5
  muted: "#f5f5f5" # dark: #1d1d1d
  muted-foreground: "#696969" # dark: #818181   secondary text, metadata
  accent: "#f5f5f5" # dark: #1d1d1d   hover and selected surface
  accent-foreground: "#262626" # dark: #f5f5f5
  destructive: "#b4261a" # dark: #c4433a   destructive fill
  destructive-foreground: "#8f1d14" # dark: #e0726a destructive text and icons
  info: "#262626" # dark: #e5e5e5   status roles are neutral
  info-foreground: "#525252" # dark: #a3a3a3
  success: "#262626" # dark: #e5e5e5
  success-foreground: "#525252" # dark: #a3a3a3
  warning: "#737373" # dark: #a3a3a3
  warning-foreground: "#525252" # dark: #a3a3a3
  border: "#ebebeb" # dark: #222222   default hairline, black/8%
  input: "#e6e6e6" # dark: #272727   field stroke, black/10%
  ring: "#a3a3a3" # dark: #737373   focus
  chart-1: "#262626" # dark: #f5f5f5   grayscale chart ramp
  chart-2: "#525252" # dark: #d4d4d4
  chart-3: "#737373" # dark: #a3a3a3
  chart-4: "#a3a3a3" # dark: #737373
  chart-5: "#d4d4d4" # dark: #525252
  sidebar: "#fafafa" # dark: #111111   app chrome, one step off background
  sidebar-foreground: "#727272" # dark: #a3a3a3
  sidebar-primary: "#262626" # dark: #f5f5f5
  sidebar-primary-foreground: "#fafafa" # dark: #262626
  sidebar-accent: "#f5f5f5" # dark: #1d1d1d   selected nav item
  sidebar-accent-foreground: "#262626" # dark: #f5f5f5
  sidebar-border: "#f0f0f0" # dark: #1d1d1d
  sidebar-ring: "#a3a3a3" # dark: #a3a3a3
  code: "#ffffff" # dark: #191919   code block surface
  code-foreground: "{colors.foreground}"
  code-highlight: "#f5f5f5" # dark: #1d1d1d
typography:
  # Inter Variable and JetBrains Mono Variable are shared on web. Native loads
  # Inter and JetBrains Mono faces through Expo and maps them to PanelUI tokens.
  font-sans: "Inter Variable, ui-sans-serif, system-ui, sans-serif"
  font-mono: "JetBrains Mono Variable, ui-monospace, SF Mono, Menlo, monospace"
  font-heading: "{typography.font-sans}"
  heading: { fontFamily: font-sans, fontSize: 17-50px, fontWeight: 600, tracking: -0.04em }
  body: { fontFamily: font-sans, fontSize: 14-16px, fontWeight: 400, lineHeight: 1.55 }
  label: { fontFamily: font-sans, fontSize: 14px, fontWeight: 500 }
  mono: { fontFamily: font-mono, fontSize: 11-13px, fontWeight: 400 }
  sec-label:
    {
      fontFamily: font-mono,
      fontSize: 11px,
      fontWeight: 500,
      tracking: 0.08em,
      transform: uppercase,
      color: muted-foreground,
    }
spacing:
  1: 4px
  2: 8px
  3: 12px
  4: 16px
  6: 24px
  8: 32px
  10: 40px
  base: 4px
rounded:
  # Derived from --radius: 0.625rem (10px) in @theme inline.
  sm: 6px # --radius-sm, calc(--radius - 4px), inline controls
  md: 8px # --radius-md, calc(--radius - 2px), buttons and inputs
  lg: 10px # --radius-lg, --radius, panels and menus
  xl: 14px # --radius-xl, calc(--radius + 4px), overlays
  2xl: 16px # Tailwind default; registry Card and Sheet
  full: 9999px
components:
  # Web recipes. Native controls use the active PanelUI component variants and theme.
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: 36px
  button-outline:
    backgroundColor: transparent
    border: "1px solid {colors.input}"
    textColor: "{colors.foreground}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: 36px
  button-ghost:
    backgroundColor: transparent
    textColor: "{colors.foreground}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: 36px # tints to {colors.muted} on hover
  button-destructive:
    backgroundColor: "{colors.destructive}"
    textColor: "#ffffff"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: 36px
  input:
    backgroundColor: "{colors.card}"
    border: "1px solid {colors.input}"
    textColor: "{colors.foreground}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "0 12px"
    height: 36px
  card:
    backgroundColor: "{colors.card}"
    border: "1px solid {colors.border}"
    rounded: "{rounded.lg}"
    padding: "20px"
  sec-label:
    textColor: "{typography.sec-label.color}"
    typography: "{typography.sec-label}"
---

# Tavi

This file is the canonical design contract for Tavi's web and native surfaces. It
covers `apps/web` (React, Tailwind CSS v4, and coss-style Base UI components) and
`apps/native` (Expo, Uniwind, and PanelUI). The frontmatter color values specify
the web palette; native resolves the corresponding semantic roles through
PanelUI's active theme. Both platforms share a restrained neutral visual language,
but not one implementation: use each platform's semantic tokens and component
library rather than forcing web CSS or component APIs onto native.

## Overview

Identity comes from restraint, not decoration:

- **Shared typefaces, platform-native loading.** Inter Variable carries UI and
  prose; JetBrains Mono carries code and machine-readable text. Web loads
  Fontsource variable files; Expo loads named Inter and JetBrains Mono font faces
  and maps them to PanelUI's font tokens.
- **Neutral first.** A neutral ramp carries hierarchy through tone and hairline
  borders. Color is reserved for semantic states supplied by each platform's theme.
- **Hairlines over shadows.** Depth is a 1px border and a tonal step. The coss
  hairline treatment (`shadow-xs` plus a 1px `before:` inset ring) is the
  exception, and it is still a hairline.
- **Mono is the voice of metadata.** If it is a label, a count, an ID, a shortcut,
  or an index, it is JetBrains Mono, uppercase and tracked when it labels a section.

The same restraint applies to copy: it is part of the design (see Voice and
content).

## Where it lives (sources of truth)

| Surface / source        | File                                                     | Notes                                                                               |
| ----------------------- | -------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Web tokens and theme    | `apps/web/src/index.css`                                 | Tailwind `@theme inline`, `:root` / `.dark` variables, and base layer               |
| Web fonts               | `apps/web/src/index.css`                                 | Inter Variable + JetBrains Mono Variable, bundled through Fontsource                |
| Web components          | `apps/web/src/shared/ui/*.tsx`                           | Local coss-style Base UI components, styled with `cva` and `cn`                     |
| Web theme switch        | `apps/web/src/shared/providers/theme-provider/index.tsx` | Toggles `.dark` on `<html>`                                                         |
| Native tokens and theme | `apps/native/global.css` + `panelui-native/theme.css`    | Palette overrides and PanelUI font tokens; system/light/dark modes                  |
| Native font loading     | `apps/native/app/_layout.tsx`                            | Expo registers Inter and JetBrains Mono before mounting the provider                |
| Native components       | `panelui-native`                                         | Import and compose PanelUI components; `PanelUIProvider` is mounted at the app root |
| Native theme control    | PanelUI `ThemeSelector` / `useThemeMode()`               | Current settings select system/light/dark in the neutral Panel family               |

The CSS is the runtime source of truth; this file is its serialization. Keep them
in sync.

Web loads `@fontsource-variable/inter` and
`@fontsource-variable/jetbrains-mono` from `apps/web/src/index.css`. The Tailwind
font contract is `--font-sans: "Inter Variable"`, `--font-mono: "JetBrains Mono
Variable"`, and `--font-heading: var(--font-sans)`; coss reads these variables
for UI, prose, headings, and machine-readable text.

Expo registers font files by the keys passed to `useFonts` in
`apps/native/app/_layout.tsx`, then PanelUI's weight tokens point to those exact
keys in `apps/native/global.css`:

| PanelUI token     | Registered font face       |
| ----------------- | -------------------------- |
| `--font-normal`   | `Inter_400Regular`         |
| `--font-medium`   | `Inter_500Medium`          |
| `--font-semibold` | `Inter_600SemiBold`        |
| `--font-bold`     | `Inter_700Bold`            |
| `--font-mono`     | `JetBrainsMono_400Regular` |

These weight tokens resolve to separately registered faces on native, rather
than CSS-like weights on one family. Keep the font keys identical between the
Expo loader and `@theme`; do not replace them with the family name or a font
stack. Wait for fonts to load before mounting `PanelUIProvider` so the first
screen is rendered with the intended faces. Add a PanelUI weight utility (for
example `font-normal` or `font-semibold`) to raw React Native `Text` nodes so
they use the mapped face; components with their own font props keep their
component contract. Restart Expo with cache clearing after changing Uniwind font
tokens.

## How the theme is structured

Tailwind v4 splits the theme in two, and both halves matter:

1. `@theme inline` maps each utility to a variable — `--color-background:
var(--background)`. Because it is `inline`, `bg-background` compiles to
   `background-color: var(--background)`, and radius utilities inline their
   `calc()` directly.
2. `:root` and `.dark` assign those variables. Re-theming is a change here and
   nowhere else.

Dark mode is class-based (`@custom-variant dark (&:where(.dark, .dark *))`) so the
provider can toggle it explicitly instead of following the OS alone.

The palette uses explicit semantic values for surfaces and borders. Some web
component effects use Tailwind's `--alpha()` function, which is processed at
build time. **Do not rewrite `--alpha()` as `color-mix()` or `rgba()`.** Native
PanelUI overrides use static hex and rgba values because Uniwind resolves native
tokens at build time.

Keep the token block complete. A missing variable does not fail loudly — it
produces a utility that resolves to an invalid value at runtime.

## Colors

Pick a surface by what an element is, not how it looks:

- `background` is the page and app root. `card` and `popover` are containers on top
  of it (cards, dialogs, dropdowns, menus); in Dark, `popover` lifts one step above
  `card`.
- `sidebar` is the persistent chrome, one step off `background`, with its own
  `sidebar-border`, `sidebar-foreground`, and `sidebar-accent` for the selected nav
  item.
- `secondary` / `muted` / `accent` are quiet fills and hover or selected states,
  not page backgrounds.
- `foreground` is primary text and icons; `muted-foreground` is secondary text and
  metadata.

Rank information with tone: primary text at `foreground`, secondary at
`muted-foreground`, separation with `border`. `primary` is a near-black solid
(neutral-100 in Dark) used only for the single most important action on a view.

`destructive` is a solid fill for irreversible actions; `destructive-foreground` is
the same role tinted for text and icons. Pair a destructive signal with a word or
an icon — never rely on hue alone.

Status roles remain semantic. Web and the native Panel family map `info`,
`success`, and `warning` onto the neutral ramp. On both platforms, use the
semantic role or the component's status variant, pair it with a word or icon, and
never invent a one-off color. Keep native palette changes in the theme source,
not in a screen component.
Web's `chart-1` … `chart-5` scale is grayscale and currently unused. Native chart
colors belong to the active PanelUI theme; consume its chart tokens rather than
hardcoding series colors.

## Typography

Inter is the UI and prose face on web and native; JetBrains Mono is used for
code and machine-readable text on both. Use no more than two weights per view for
ordinary UI; use semibold for headings and bold only when hierarchy needs it.

The **mono metadata system** is Tavi's voice: use JetBrains Mono for the `tavi`
wordmark, section labels, counts, durations, IDs, slugs, and keyboard shortcuts.
Native screens should favor platform-readable sizing and avoid overusing tracked
uppercase labels on small screens.

Web headings use Inter Variable with tight tracking. Native uses PanelUI's
weight-token mapping to the loaded Inter faces; do not restyle PanelUI components
with per-screen font declarations.

## Layout

Spacing follows a 4px rhythm: 4, 8, 12, 16, 24, 32, 40px. Keep a three-step
cadence: 8px inside a group, 16px between groups, 32 to 40px between sections.

Web layouts are responsive from mobile upward; use a centered content column,
readable max-widths, and hairline section dividers. Keep desktop app chrome from
crowding narrow screens.

Native layouts start with the device viewport: respect safe areas, keyboard
insets, touch targets, and platform navigation conventions. Use PanelUI compound
layouts (for example `Frame`, `Frame.Panel`, and `Frame.Row`) before assembling
custom view trees. Keep a shared 4px spacing rhythm, adapting outer padding to the
screen rather than forcing web breakpoints onto mobile.

On web, stack with `flex flex-col gap-*`; do not use `space-x-*` / `space-y-*`.
On native, use Uniwind `gap-*` utilities; React Native does not support Tailwind
`space-*` utilities.

## Elevation and depth

Depth comes from tonal surfaces and hairlines first. On web, the coss treatment is
one step beyond a plain border:

- a 1px `border` on the element, plus
- `shadow-xs/5`, plus a `before:` pseudo-element carrying a 1px inset ring
  (`shadow-[0_1px_--theme(--color-black/4%)]`, inverted to
  `0_-1px_--theme(--color-white/6%)` in Dark).

That ring is what makes light surfaces read as inset rather than pasted on. It is
still a hairline, not a drop shadow. Floating surfaces (menus, dialogs) may add one
diffuse shadow. In Dark, lift with a lighter surface (`card` to `popover`) instead
of a heavier shadow. Pair every elevation with the matching radius.

## Motion

Motion clarifies a change; it is never decoration. Most interactions should feel
instant. On web, keep state changes near 150ms, popovers near 200ms, and overlays
near 300ms; honor `prefers-reduced-motion`. On native, use PanelUI's Reanimated
animations and honor reduced-motion preferences. Never use React Native core
`Animated` or run animation loops through React state.

## Shapes

Web radii derive from `--radius: 0.625rem`: 6px inline controls, 8px buttons and
inputs, 10px panels and menus, 14px overlays, 16px for registry Cards and Sheets,
and full rounding for pills, avatars, and dots. Native radii come from the active
PanelUI theme family (Panel is the neutral default; Moon and Grass change both
palette and shape). Do not recreate PanelUI component shapes with arbitrary
radius overrides.

## Styling rules

### Web (coss / Base UI)

These are coss conventions, and they are not optional in this repo.

- **Semantic tokens only.** `text-muted-foreground`, `bg-accent`,
  `border-input` — never `bg-neutral-200` or a raw hex in a component.
- **Variants before overrides.** Reach for the `cva` variant or size prop first.
  A `className` override is the last resort.
- **`cn()` for conditional classes.** Literal class strings stay literal.
- **No redundant classes.** The base layer already gives every element
  `border-border` and `outline-ring/50`. Skip `border-border`.
- **`size-*` for square sizing.** `size-4`, not `h-4 w-4`.
- **`flex flex-col gap-*` for stacking.** Never `space-y-*`.
- **Icons:** no numeric `size` prop. Let the primitive size the inner SVG, or use
  `size-*`. Mark decorative or redundant icons `aria-hidden="true"`; do not hide an
  icon that carries meaning no text does.
- **Do not re-add icon opacity.** Primitives already set inner-SVG opacity
  (commonly `opacity-80`).
- **`in-*` + `data-slot`, not `group`.** Prefer selectors like
  `in-[[data-slot=button]:hover]:translate-x-0.5` over a parent `group`.
- **Dismissing is `variant="ghost"`.** Cancel and close buttons in Dialog,
  AlertDialog, Sheet, and Drawer footers use `ghost`. Reserve `variant="outline"`
  for triggers that open overlays.
- **Compose triggers correctly.** For Dialog, Menu, Select, Popover, Tooltip and
  friends, follow that primitive's documented trigger/content hierarchy. Do not mix
  one primitive's composition pattern into another's.

### Composition

Local primitives are built on Base UI's `useRender` and `mergeProps`. Compose with
the **`render` prop**, not Radix's `asChild`, so the same styling lands on an `<a>`
or a router `<Link>`:

```tsx
<Button render={<Link to="/dashboard" />}>Open Dashboard</Button>
```

Interactive elements surface state on `data-*` attributes (`data-slot`,
`data-variant`, `data-size`, `data-loading`, and Base UI's `data-*` state), so
behaviour can be reasoned about without parsing class soup.

## Components

Local web primitives live in `apps/web/src/shared/ui/`. Anything not there comes
from the coss registry:

```bash
npx shadcn@latest add @coss/<component>
```

Treat registry code as the local pattern: keep imports on `@/shared/ui/...`,
keep `cn` from `@/shared/lib/cn`, and keep the composition API.

### Installed

- **Button** (`button.tsx`) — Base UI `useRender`. Variants `default`, `outline`,
  `ghost`, `destructive`; sizes `default` (h-9), `sm`, `icon`. Leading icons
  auto-size. Owns the `loading` prop, which disables and swaps in `Spinner`.
- **Input** (`input.tsx`) — `h-9`, `rounded-md`, `border-input`, `bg-card`.
- **Card** (`card.tsx`) — `bg-card`, hairline, `rounded-lg`, `shadow-sm`. Compose
  with `CardHeader` / `CardTitle` / `CardContent`.
- **Label** (`label.tsx`) — Base UI `useRender`, `label` type token.
- **Spinner** (`spinner.tsx`) — `<output aria-label="Loading">` wrapping
  `Loader2Icon`, so assistive tech announces the change without an explicit role.

### Registry APIs to adopt when these primitives are next touched

The local primitives are a trimmed subset of the coss registry. Close the gap
rather than growing a second dialect:

- Button gains `secondary`, `link`, and `destructive-outline` variants, and
  `xs` / `lg` / `xl` / `icon-xs` / `icon-sm` / `icon-lg` sizes. Its inner SVG
  picks up `opacity-80`.
- Card gains `CardDescription`, `CardFooter`, and `CardPanel` (the registry name
  for the body slot), moves to `rounded-2xl`, and adopts the `before:` inset ring.
- Input becomes a Base UI `Input` inside a `span[data-slot="input-control"]` that
  owns the border, ring, and focus-within styling; the element itself is
  unstyled and inherits radius.
- Spinner becomes `Loader2Icon` with `role="status"`.

The frontmatter `components` block gives the recipes for what is installed today,
at the local control height of 36px.

### Native (PanelUI / Uniwind)

- **Use PanelUI first.** Search PanelUI's component catalog and component
  reference before building custom controls. Compose compound parts under their
  owning root, and read the local PanelUI skill/reference for exact props.
- **Provider is required.** Keep exactly one `PanelUIProvider` at the app root;
  overlays depend on its portal host. Do not conditionally unmount open overlays;
  use their `open` / `onOpenChange` API so exit animations can finish.
- **Semantic tokens only.** Use classes such as `bg-background`,
  `text-foreground`, and `border-border`. Never hardcode a palette literal or add
  `dark:` overrides; the selected named theme resolves the tokens. For runtime
  colors, use `useCSSVariable`, not a copied hex value.
- **Class names are for layout.** Use PanelUI variants and props to style
  components; do not repaint their colors or typography with `className`. Use
  `cn()` for conditional utility classes and `gap-*`, never `space-y-*`.
- **Respect PanelUI composition and motion.** A field is `Field` + `Label` + the
  control. Use Reanimated 4 through PanelUI; do not use React Native core
  `Animated` or state-driven animation loops. Native controls that opt into the
  platform appearance may ignore tokens and `className` by design.
- **Themes:** The app aligns PanelUI's `light` and `dark` themes to the shared Tavi
  palette. The current `ThemeSelector` offers system, light, and dark in the
  neutral Panel family. PanelUI also ships Moon and Grass families; they are
  registered in Metro but are not exposed as app choices. If those become user
  selectable, align their palette tokens with Tavi first.

## Status and semantics

State uses semantic tokens plus an icon or text label, never hue alone. Web maps
status roles to the neutral ramp; native PanelUI maps semantic status roles to its
active theme palette. Use the platform's status variant (including destructive
for errors and irreversible actions), pair it with a clear label, and avoid
one-off colors. Positive, pending, and connected states should use their semantic
roles rather than borrowing the destructive role.

## Accessibility

- Hold WCAG AA contrast: 4.5:1 for body text, 3:1 for icons and graphics. Check
  all supported web and PanelUI themes; do not assume a token's contrast is
  identical across theme families.
- Web interactive elements show a visible `:focus-visible` ring. Native controls
  retain accessible focus and interaction states provided by PanelUI and the
  platform.
- Disabled state drops to reduced opacity and `pointer-events-none`, and keeps the
  element's accessible name.
- Icon-only buttons need an `aria-label` on the button, not just on the icon.
- Never signal state with colour alone.

## Voice and content

Copy is part of the design; keep it precise, technical, and free of filler.

- Title Case for labels, buttons, titles, and tabs; sentence case for body, helper
  text, toasts.
- Name actions with a verb and a noun (`Add Item`, `Revoke Token`), never `Confirm`,
  `OK`, or a bare verb.
- Errors are what happened plus what to do next: `Couldn't reach the server. Check
it is running, then retry.`
- Toasts name the specific thing that changed, drop the trailing period, never say
  `successfully`: `Item added`, not `Successfully added the item.`
- Empty states point to the first action: `Nothing here yet. Add one to get
started.`
- Present participle with an ellipsis for in-progress states: `Connecting...`,
  `Syncing...`
- Use numerals (`3 items`); skip `please` and marketing superlatives (powerful,
  seamless, robust, leverage, unlock, game-changing).

## For agents

Tavi is built with agents in the loop, so its interface follows agent-friendly
rules:

- The token values are the contract. Read a token; do not hardcode a hex literal or
  a raw size.
- Do not add decorative hues. If a design needs another color, use an existing
  semantic role from the platform theme.
- Web state lives on `data-*` attributes and semantic tokens. Native state uses
  PanelUI props and semantic tokens; use the appropriate platform contract.
- This file is the serialized system. Keep it in sync with the sources listed in
  Where it lives.

## Do's and Don'ts

- Rank information with the neutral ramp and hairlines, not decorative color.
- Use the semantic `primary` token for the single most important action; one per view.
- Hold WCAG AA contrast (4.5:1 for body text).
- Apply web type tokens and native PanelUI typography variants instead of
  composing ad-hoc font styles.
- Use JetBrains Mono for metadata and code on both web and native; use the
  platform-specific font loading contract for each app.
- Use semantic tokens on both platforms. Web uses `size-*`, `flex ... gap-*`,
  and `in-*` + `data-slot`; native uses PanelUI components, Uniwind `gap-*`, and
  PanelUI state props.
- Don't introduce decorative hues or local palettes; extend the semantic scales
  in the appropriate theme source instead.
- Don't rewrite web `--alpha()` as `color-mix()` or `rgba()`.
- Don't use an icon pack as decoration or monogram placeholders; use real brand
  marks, or nothing.
- Don't use `card` / `popover` as a page background, or `muted` / `accent` as a
  general fill.
- Don't mix rounded and sharp corners, or more than two font weights, in one view.
- Don't override a primitive's variant styling with ad-hoc colour classes.
