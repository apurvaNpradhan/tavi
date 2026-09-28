// Deliberately reads `process.env` with defaults rather than `@tavi/env`: the
// react-email design tool bundles these templates and would pull the server-side
// env module (dotenv, validated snapshot) into that bundle. These are display
// values only; the runtime path that sends mail reads the typed env in
// `resend-config.ts`.
export const APP_NAME = process.env.TAVI_APP_NAME || "Tavi";

export const CLIENT_URL = process.env.TAVI_CLIENT_URL || "http://localhost:5173";
