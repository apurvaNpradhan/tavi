import { useQuery } from "@tanstack/react-query";
import { orpc } from "../../../shared/api-client";

/**
 * Public runtime flags that decide which sign-in methods this instance offers.
 *
 * Both auth screens read the same query, so the cached result is shared and a
 * method the instance has disabled is never rendered as a dead end.
 */
export function useAuthConfig() {
  const config = useQuery(orpc.config.get.queryOptions());

  return {
    config,
    emailEnabled: Boolean(config.data?.emailOtpEnabled),
    googleEnabled: Boolean(config.data?.socialProviders.google),
  };
}
