import { Apple, Dumbbell, House, Settings } from "lucide-react-native";
import type { Href } from "expo-router";

/**
 * A glyph from the lucide set.
 *
 * Every icon in the set shares one shape, so the tab configuration can name a
 * glyph without narrowing itself to a single icon's type.
 */
export type TabIcon = typeof House;

/** Which row of the compact bar a route belongs to. */
export type TabItemKind = "bar" | "overflow";

/** One entry in the native tab surface: a route, its glyph, and where it lives. */
export interface TabItem {
  /** Route name inside `(tabs)`, and the key the tab navigator is built from. */
  name: string;
  /** Path the overview screen links to. */
  href: Href;
  /** Glyph used by the compact bar and the expanded menu. */
  Icon: TabIcon;
  /** Key in the `settings` namespace, for the bar label and the screen title. */
  labelKey: string;
  /** Key in the `settings` namespace describing the section, for the overview row. */
  descriptionKey: string;
  /** `bar` sits in the compact strip; `overflow` opens from the More button. */
  kind: TabItemKind;
}

/**
 * The native tab surface, in bar order.
 *
 * This is the layout's only source of route names: `(tabs)/_layout.tsx` builds
 * one `Tabs.Screen` per entry and `linear-tab-bar.tsx` renders one control per
 * entry, so a tab cannot appear in one place and be missing from the other.
 */
export const TAB_ITEMS: readonly TabItem[] = [
  {
    name: "index",
    href: "/",
    Icon: House,
    labelKey: "settings:mobile.nav.home",
    descriptionKey: "settings:description",
    kind: "bar",
  },
  {
    name: "workouts",
    href: "/workouts",
    Icon: Dumbbell,
    labelKey: "settings:mobile.nav.workouts",
    descriptionKey: "settings:mobile.workoutsDescription",
    kind: "bar",
  },
  {
    name: "nutrition",
    href: "/nutrition",
    Icon: Apple,
    labelKey: "settings:mobile.nav.nutrition",
    descriptionKey: "settings:mobile.nutritionDescription",
    kind: "bar",
  },
  {
    name: "settings",
    href: "/settings",
    Icon: Settings,
    labelKey: "settings:title",
    descriptionKey: "settings:description",
    kind: "overflow",
  },
];

/** Tabs drawn in the compact strip, left to right. */
export const BAR_TAB_ITEMS: readonly TabItem[] = TAB_ITEMS.filter((item) => item.kind === "bar");

/** Sections the workspace overview links to; the overview itself is not one. */
export const SECTION_TAB_ITEMS: readonly TabItem[] = TAB_ITEMS.filter(
  (item) => item.name !== "index",
);
