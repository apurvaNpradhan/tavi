export function getTrustedAuthOrigins({
  clientUrl,
  apiUrl,
  isProduction,
}: {
  clientUrl: string;
  apiUrl: string;
  isProduction: boolean;
}): string[] {
  const trustedOrigins = [clientUrl, "tavi://", "tavi://*"];
  if (!isProduction) {
    trustedOrigins.push("exp://", "exp://**", "exp://192.168.*.*:*/**");
  }

  try {
    const apiOrigin = new URL(apiUrl);
    trustedOrigins.push(`${apiOrigin.protocol}//${apiOrigin.host}`);
  } catch {
    // The caller reports malformed API URLs elsewhere.
  }

  return trustedOrigins;
}
