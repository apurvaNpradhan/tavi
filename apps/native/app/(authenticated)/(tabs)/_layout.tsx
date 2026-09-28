import { Tabs, type BottomTabBarProps } from "expo-router/tabs";
import { useTranslation } from "react-i18next";
import { LinearTabBar } from "../../../components/navigation";
import { TAB_ITEMS } from "../../../components/navigation/tab-items";

// Expo Router invokes tabBar as a callback. Render a component so its hooks have their own dispatcher.
function renderTabBar(props: BottomTabBarProps) {
  return <LinearTabBar {...props} />;
}

/**
 * Primary native sections.
 *
 * The screens come from `TAB_ITEMS`, which is also what the tab bar renders, so
 * a route cannot be declared here and missing from the bar or the reverse.
 * Overflow routes stay navigable from the bar's expanded menu.
 */
export default function TabsLayout() {
  const { t } = useTranslation("settings");

  return (
    <Tabs tabBar={renderTabBar} screenOptions={{ headerShown: false }}>
      {TAB_ITEMS.map((item) => {
        const options =
          item.kind === "bar"
            ? { title: t(item.labelKey) }
            : { title: t(item.labelKey), href: null };
        return <Tabs.Screen key={item.name} name={item.name} options={options} />;
      })}
    </Tabs>
  );
}
