type CookieAttributeInput = {
  apiUrl: string;
  clientUrl: string;
  cookieDomain?: string;
};

type CookieAttributes = {
  httpOnly: true;
  sameSite: "none" | "lax";
  secure: boolean;
  path: "/";
  domain?: string;
};

function originOf(rawUrl: string): string | null {
  try {
    return new URL(rawUrl).origin;
  } catch {
    return null;
  }
}

/**
 * Chooses cookie attributes for the API and web origins.
 *
 * When the two sit on different origins the cookie must be
 * `SameSite=None; Secure` or the browser never sends it. When they share an
 * origin (the bundled single-image setup) the stricter `Lax` is kept.
 */
export function getDefaultCookieAttributes({
  apiUrl,
  clientUrl,
  cookieDomain,
}: CookieAttributeInput) {
  const apiOrigin = originOf(apiUrl);
  const clientOrigin = originOf(clientUrl);
  const crossSite = Boolean(apiOrigin && clientOrigin && apiOrigin !== clientOrigin);
  const isHttps = apiOrigin?.startsWith("https://") ?? false;

  const attributes: CookieAttributes = {
    httpOnly: true,
    // Cross-origin requires `none`; same-origin keeps the stricter `lax`.
    sameSite: crossSite ? ("none" as const) : ("lax" as const),
    secure: crossSite || isHttps,
    path: "/",
  };

  if (cookieDomain) {
    attributes.domain = cookieDomain;
  }

  return attributes;
}
