/** Paths that use passwordless links or one-time codes. */
const LOCAL_SIGN_IN_PATHS = new Set([
  "/sign-in/anonymous",
  "/sign-in/email-otp",
  "/sign-in/magic-link",
  "/email-otp/send-verification-otp",
  "/magic-link/verify",
]);

/** Checks whether a Better Auth endpoint must be disabled with local sign-in. */
export function isLocalSignInPath(path: string): boolean {
  return LOCAL_SIGN_IN_PATHS.has(path);
}
