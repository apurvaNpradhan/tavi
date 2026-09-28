const { getSentryExpoConfig } = require("@sentry/react-native/metro");
const { withUniwindConfig } = require("uniwind/metro");

const config = getSentryExpoConfig(__dirname, { includeWebReplay: false });

module.exports = withUniwindConfig(config, {
  cssEntryFile: "./global.css",
  dtsFile: "./uniwind-types.d.ts",
  extraThemes: ["moon", "moon-dark", "grass", "grass-dark"],
});
