import { useEffect, useState } from "react";
import {
  useWindowDimensions,
  BackHandler,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type AccessibilityState,
} from "react-native";
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import type { BottomTabBarProps } from "expo-router/tabs";
import { selectionTick } from "panelui-native";
import { useCSSVariable } from "uniwind";
import { Building, Ellipsis, ExternalLink } from "lucide-react-native";
import { BAR_TAB_ITEMS, TAB_ITEMS, type TabIcon } from "./tab-items";
import { webBaseUrl } from "../../shared/runtime-config";

/** Height of the collapsed strip, and the diameter its radius follows. */
const BAR_HEIGHT = 58;
/** Inset between the strip's edge and the controls inside it. */
const BAR_INSET = 5;
/** The collapsed strip stops growing here; narrower screens keep the margin. */
const BAR_MAX_WIDTH = 320;
/** Screen edge the collapsed strip keeps, and the smaller one the panel keeps. */
const BAR_SIDE_MARGIN = 32;
const PANEL_SIDE_MARGIN = 12;
const PANEL_RADIUS = 32;
/** The panel never grows past this, nor past the safe area it floats in. */
const PANEL_MAX_HEIGHT = 500;
const PANEL_TOP_GAP = 32;
const MENU_ROW_HEIGHT = 48;
const MENU_GAP = 2;
const MENU_PADDING = 10;
/** Expansion is slower than a tab change: it moves the whole surface, not a pill. */
const PANEL_DURATION = 260;
const TAB_DURATION = 160;

/**
 * Absolute fill, spelled out. React Native exposes it as
 * `StyleSheet.absoluteFillObject`, but that is missing from the 0.86 types.
 */
const ABSOLUTE_FILL = {
  position: "absolute",
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
} as const;

type BarColors = {
  surface: string;
  accent: string;
  border: string;
  foreground: string;
  muted: string;
};

/** One row of the expanded panel, already resolved to a label and a handler. */
type MenuRow = {
  key: string;
  label: string;
  Icon: TabIcon;
  /** Selected tabs take the accent fill; the actions under the rule never do. */
  selected: boolean;
  /** Tabs read at full contrast; the actions below the rule read as secondary. */
  kind: "tab" | "action";
  onPress: () => void;
};

/**
 * Linear-style floating tab bar: a compact strip of primary tabs beside a More
 * button that expands the surface upward into the full list of destinations.
 *
 * The strip is absolutely positioned, so scenes run the full height of the
 * screen behind it and each screen reserves its own bottom clearance.
 */
export function LinearTabBar({ state, navigation }: BottomTabBarProps) {
  const { t } = useTranslation(["settings", "auth"]);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const reduceMotion = useReducedMotion();
  // The route the panel was opened for, rather than a boolean: navigating from
  // anywhere else closes it by the name no longer matching, with no effect and
  // no second render to get there.
  const [openedFor, setOpenedFor] = useState<string | null>(null);
  const progress = useSharedValue(0);
  const [surface, accent, border, foreground, muted] = useCSSVariable([
    "--color-surface-secondary",
    "--color-accent",
    "--color-border",
    "--color-foreground",
    "--color-muted-foreground",
  ]) as (string | undefined)[];
  const colors: BarColors = {
    surface: surface ?? "transparent",
    accent: accent ?? "transparent",
    border: border ?? "transparent",
    foreground: foreground ?? "currentColor",
    muted: muted ?? "currentColor",
  };

  const activeName = state.routes[state.index].name;
  const open = openedFor === activeName;
  const overflowItem = TAB_ITEMS.find(
    (item) => item.kind === "overflow" && item.name === activeName,
  );

  const activate = (name: string) => {
    setOpenedFor(null);
    const route = state.routes.find((candidate) => candidate.name === name);
    if (!route) return;
    const focused = route.name === activeName;
    const event = navigation.emit({
      type: "tabPress",
      target: route.key,
      canPreventDefault: true,
    });
    if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
  };

  const announceLongPress = (name: string) => {
    const route = state.routes.find((candidate) => candidate.name === name);
    if (route) navigation.emit({ type: "tabLongPress", target: route.key });
  };

  const closeMenu = () => setOpenedFor(null);

  const tabRows: MenuRow[] = TAB_ITEMS.map((item) => ({
    key: item.name,
    label: t(item.labelKey),
    Icon: item.Icon,
    kind: "tab",
    selected: item.name === activeName,
    onPress: () => activate(item.name),
  }));
  const actionRows: MenuRow[] = [
    {
      key: "switch-workspace",
      label: t("auth:mobile.switchWorkspace"),
      Icon: Building,
      kind: "action",
      selected: false,
      onPress: () => {
        closeMenu();
        router.push("/(authenticated)/workspace-picker");
      },
    },
    {
      key: "open-web",
      label: t("auth:mobile.manageOnWeb"),
      Icon: ExternalLink,
      kind: "action",
      selected: false,
      onPress: () => {
        closeMenu();
        void Linking.openURL(webBaseUrl);
      },
    },
  ];

  // The panel is sized to the rows it holds rather than to the space available,
  // so three destinations and eight both look deliberate. The formula rounds up
  // by a pixel or two, which reads as slack at the bottom of the panel.
  const rowCount = tabRows.length + actionRows.length;
  const hasRule = tabRows.length > 0 && actionRows.length > 0;
  const menuHeight =
    MENU_PADDING * 2 +
    rowCount * MENU_ROW_HEIGHT +
    (rowCount + 1) * MENU_GAP +
    (hasRule ? MENU_GAP * 2 + StyleSheet.hairlineWidth : 0);

  const closedWidth = Math.min(width - BAR_SIDE_MARGIN, BAR_MAX_WIDTH);
  const expandedWidth = width - PANEL_SIDE_MARGIN * 2;
  const expandedHeight = Math.min(
    menuHeight,
    PANEL_MAX_HEIGHT,
    height - insets.top - insets.bottom - PANEL_TOP_GAP,
  );

  const wrapperStyle = useAnimatedStyle(() => ({
    width: interpolate(progress.value, [0, 1], [closedWidth, expandedWidth]),
    height: interpolate(progress.value, [0, 1], [BAR_HEIGHT, expandedHeight]),
    borderRadius: interpolate(progress.value, [0, 1], [BAR_HEIGHT / 2, PANEL_RADIUS]),
  }));
  const menuStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0.12, 0.5], [0, 1], Extrapolation.CLAMP),
  }));
  const barStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.35], [1, 0], Extrapolation.CLAMP),
  }));
  const menuTouchStyle = open ? styles.touchAuto : styles.touchNone;
  const barTouchStyle = open ? styles.touchNone : styles.touchAuto;

  useEffect(() => {
    progress.set(
      withTiming(open ? 1 : 0, {
        duration: reduceMotion ? 0 : PANEL_DURATION,
        easing: Easing.bezier(0.22, 1, 0.36, 1),
      }),
    );
  }, [open, progress, reduceMotion]);

  useEffect(() => {
    if (!open) return;
    if (Platform.OS === "web") {
      if (typeof window === "undefined") return;
      const onKeyDown = (event: KeyboardEvent) => {
        if (event.key === "Escape") setOpenedFor(null);
      };
      window.addEventListener("keydown", onKeyDown);
      return () => window.removeEventListener("keydown", onKeyDown);
    }
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      setOpenedFor(null);
      return true;
    });
    return () => subscription.remove();
  }, [open]);

  return (
    <View style={[styles.root, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      {open ? (
        <Pressable
          style={styles.scrim}
          onPress={closeMenu}
          accessibilityRole="button"
          accessibilityLabel={t("settings:close")}
        />
      ) : null}

      <Animated.View
        accessibilityViewIsModal={open}
        onAccessibilityEscape={closeMenu}
        style={[
          styles.wrapper,
          { backgroundColor: colors.surface, borderColor: colors.border },
          wrapperStyle,
        ]}
      >
        <Animated.View
          accessibilityElementsHidden={!open}
          importantForAccessibility={open ? "auto" : "no-hide-descendants"}
          style={[styles.menu, menuStyle, menuTouchStyle]}
        >
          {tabRows.map((row) => (
            <MenuItem key={row.key} row={row} colors={colors} />
          ))}
          {hasRule ? <View style={[styles.rule, { backgroundColor: colors.border }]} /> : null}
          {actionRows.map((row) => (
            <MenuItem key={row.key} row={row} colors={colors} />
          ))}
        </Animated.View>

        <Animated.View
          accessibilityRole="tablist"
          accessibilityElementsHidden={open}
          importantForAccessibility={open ? "no-hide-descendants" : "auto"}
          style={[styles.bar, barStyle, barTouchStyle]}
        >
          {BAR_TAB_ITEMS.map((item) => (
            <BarButton
              key={item.name}
              label={t(item.labelKey)}
              Icon={item.Icon}
              highlighted={item.name === activeName}
              colors={colors}
              onPress={() => activate(item.name)}
              onLongPress={() => announceLongPress(item.name)}
            />
          ))}
          <BarButton
            label={t("settings:mobile.nav.more")}
            Icon={overflowItem?.Icon ?? Ellipsis}
            highlighted={Boolean(overflowItem)}
            expanded={open}
            accessibilityRole="button"
            colors={colors}
            onPress={() => {
              selectionTick();
              setOpenedFor(open ? null : activeName);
            }}
          />
        </Animated.View>
      </Animated.View>
    </View>
  );
}

/** A primary tab, or the More button when it stands in for the active overflow tab. */
function BarButton({
  label,
  Icon,
  highlighted,
  expanded,
  accessibilityRole = "tab",
  colors,
  onPress,
  onLongPress,
}: {
  label: string;
  Icon: TabIcon;
  highlighted: boolean;
  expanded?: boolean;
  accessibilityRole?: "tab" | "button";
  colors: BarColors;
  onPress: () => void;
  onLongPress?: () => void;
}) {
  const selected = useSharedValue(highlighted ? 1 : 0);

  useEffect(() => {
    selected.set(withTiming(highlighted ? 1 : 0, { duration: TAB_DURATION }));
  }, [highlighted, selected]);

  const pillStyle = useAnimatedStyle(() => ({ opacity: selected.value }));
  const state: AccessibilityState = { selected: highlighted, expanded };

  return (
    <Pressable
      accessibilityRole={accessibilityRole}
      accessibilityLabel={label}
      accessibilityState={state}
      onPress={onPress}
      onLongPress={onLongPress}
      style={({ pressed }) => [styles.tab, pressed && styles.pressed]}
    >
      <Animated.View
        style={[styles.pill, { backgroundColor: colors.accent }, pillStyle, styles.touchNone]}
      />
      <Icon
        size={22}
        strokeWidth={highlighted ? 2.25 : 1.9}
        color={highlighted ? colors.foreground : colors.muted}
      />
    </Pressable>
  );
}

/** One destination in the expanded panel. */
function MenuItem({ row, colors }: { row: MenuRow; colors: BarColors }) {
  const isTab = row.kind === "tab";
  const iconColor = isTab && row.selected ? colors.foreground : colors.muted;

  return (
    <Pressable
      accessibilityRole={isTab ? "tab" : "button"}
      accessibilityLabel={row.label}
      accessibilityState={{ selected: row.selected }}
      onPress={row.onPress}
      style={({ pressed }) => [
        styles.menuRow,
        row.selected && { backgroundColor: colors.accent },
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.menuIcon}>
        <row.Icon size={20} strokeWidth={2} color={iconColor} />
      </View>
      <Text
        className="font-semibold"
        numberOfLines={1}
        style={[styles.menuLabel, { color: isTab ? colors.foreground : colors.muted }]}
      >
        {row.label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    ...ABSOLUTE_FILL,
    // Bottom-aligned, so the surface grows upward and its foot stays put.
    alignItems: "center",
    justifyContent: "flex-end",
    // Above the scenes, which render before the tab bar in the navigator.
    zIndex: 1,
    // Touches land on the strip and the panel, never on the empty space above.
    pointerEvents: "box-none",
  },
  scrim: ABSOLUTE_FILL,
  // The layers swap which one takes touches as the panel opens; an invisible
  // layer that still accepted them would swallow the whole screen.
  touchAuto: {
    pointerEvents: "auto",
  },
  touchNone: {
    pointerEvents: "none",
  },
  wrapper: {
    borderWidth: StyleSheet.hairlineWidth,
    borderCurve: "continuous",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 20,
    elevation: 12,
  },
  bar: {
    position: "absolute",
    right: 0,
    bottom: 0,
    left: 0,
    height: BAR_HEIGHT,
    flexDirection: "row",
    padding: BAR_INSET,
  },
  menu: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    padding: MENU_PADDING,
    gap: MENU_GAP,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: BAR_HEIGHT / 2,
  },
  pill: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderRadius: BAR_HEIGHT / 2,
  },
  menuRow: {
    height: MENU_ROW_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
  },
  menuIcon: {
    width: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  menuLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
  },
  rule: {
    height: StyleSheet.hairlineWidth,
    marginVertical: MENU_GAP,
  },
  pressed: {
    opacity: 0.6,
  },
});
