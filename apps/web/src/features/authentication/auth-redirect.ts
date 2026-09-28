/** Accepts same-origin app paths or URLs for authentication return navigation. */
export function getSafeAuthRedirect(value: unknown): string {
  if (typeof value !== "string" || value.startsWith("//")) return "/";

  try {
    const url = new URL(value, window.location.origin);
    if (
      url.origin !== window.location.origin ||
      url.pathname.startsWith("/auth/") ||
      url.username ||
      url.password
    ) {
      return "/";
    }
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return "/";
  }
}
