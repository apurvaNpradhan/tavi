import { I18nextProvider } from "react-i18next";
import { Suspense } from "react";
import { createI18n } from ".";

/**
 * A single i18n instance for the app's lifetime.
 *
 * Created at module scope rather than in a `useMemo`: i18next's `init()` is
 * async, and re-creating the instance on a render would discard loaded
 * namespaces and re-trigger the fetch.
 */
const { instance, init } = createI18n();

export function AppI18nProvider({ children }: { children: React.ReactNode }) {
  return (
    <I18nextProvider i18n={instance}>
      <Suspense
        fallback={
          <div className="flex h-svh items-center justify-center text-sm">
            {instance.t("loading")}
          </div>
        }
      >
        {children}
      </Suspense>
    </I18nextProvider>
  );
}

export { init as i18nReady };
export default AppI18nProvider;
