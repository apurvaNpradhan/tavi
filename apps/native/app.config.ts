import type { ExpoConfig } from "expo/config";

/** Adds optional Sentry source-map upload settings without bundling its token. */
export default function appConfig(): ExpoConfig {
  const sentryAuthToken = process.env.SENTRY_AUTH_TOKEN;
  const sentryOrganization = process.env.SENTRY_ORG;
  const sentryProject = process.env.SENTRY_PROJECT;
  const plugins: NonNullable<ExpoConfig["plugins"]> = [
    "expo-router",
    "expo-secure-store",
    "expo-localization",
    "expo-web-browser",
  ];

  if (
    process.env.NODE_ENV === "production" &&
    sentryAuthToken &&
    sentryOrganization &&
    sentryProject
  ) {
    plugins.push([
      "@sentry/react-native/expo",
      {
        url: "https://sentry.io/",
        organization: sentryOrganization,
        project: sentryProject,
      },
    ]);
  }

  return {
    name: "Tavi",
    slug: "tavi",
    version: "1.0.0",
    orientation: "portrait",
    scheme: "tavi",
    platforms: ["ios", "android"],
    userInterfaceStyle: "automatic",
    icon: "./assets/icon.png",
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.tavi.app.dev",
    },
    android: {
      package: "com.tavi.app.dev",
      // The generator's tile is full-bleed, so the adaptive foreground is the
      // glyph alone on the brand background; a full-bleed foreground would be
      // clipped by the system mask at the tile edges.
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#1c1c1d",
      },
    },
    plugins,
    experiments: { typedRoutes: true },
  };
}
