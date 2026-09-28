import {
  MutationCache,
  QueryCache,
  QueryClient,
  focusManager,
  onlineManager,
} from "@tanstack/react-query";
import { AppState, type AppStateStatus } from "react-native";
import * as Network from "expo-network";
import * as Sentry from "@sentry/react-native";

/** In-memory request cache with conservative mobile retry and error reporting. */
export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => {
      if (error instanceof Error && error.name !== "AbortError") {
        Sentry.captureException(error, { tags: { area: "api.query" } });
      }
    },
  }),
  mutationCache: new MutationCache({
    onError: (error) => {
      if (error instanceof Error && error.name !== "AbortError") {
        Sentry.captureException(error, { tags: { area: "api.mutation" } });
      }
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: (failureCount, error) =>
        !(error instanceof Error && error.message.includes("UNAUTHORIZED")) && failureCount < 2,
    },
    mutations: { retry: false },
  },
});

/** Registers app-wide network and foreground listeners from the native entrypoint. */
export function configureNativeQueryLifecycle() {
  onlineManager.setEventListener((setOnline) => {
    const subscription = Network.addNetworkStateListener((state) => {
      setOnline(Boolean(state.isConnected && state.isInternetReachable !== false));
    });
    void (async () => {
      try {
        const state = await Network.getNetworkStateAsync();
        setOnline(Boolean(state.isConnected && state.isInternetReachable !== false));
      } catch {
        setOnline(false);
      }
    })();
    return () => subscription.remove();
  });

  focusManager.setEventListener((setFocused) => {
    const subscription = AppState.addEventListener("change", (status: AppStateStatus) => {
      setFocused(status === "active");
    });
    return () => subscription.remove();
  });
}
