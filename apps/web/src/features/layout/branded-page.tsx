import type { ReactNode } from "react";
import { cn } from "@/shared/lib/utils";

type BrandedPageProps = {
  title: string;
  /** Secondary line under the title: a subtitle, or where a link was sent. */
  description?: ReactNode;
  /** Optional content centered in the page header, such as onboarding progress. */
  headerContent?: ReactNode;
  /** Optional content between the global header and centered page content. */
  topBar?: ReactNode;
  /** Standalone pages such as onboarding can opt out of the brand mark. */
  brandMark?: boolean;
  /**
   * Reserves the standalone header row above the page content.
   *
   * Screens with nothing to put there still pass it to keep their top spacing;
   * focused onboarding screens pass `false` for the compact row that holds the
   * progress indicator.
   */
  header?: boolean;
  children: ReactNode;
};

/**
 * Chrome for the app's standalone pages.
 *
 * Login and onboarding both sit outside the dashboard shell and have nothing
 * else to navigate to, so they share one centered column, one header row, and
 * the brand mark above the title. Keeping the frame here is what stops the two
 * pages from drifting apart.
 */
export function BrandedPage({
  title,
  description,
  headerContent,
  topBar,
  brandMark = true,
  header = true,
  children,
}: BrandedPageProps) {
  return (
    <main className="flex min-h-svh flex-col bg-background text-foreground">
      {header || headerContent ? (
        <header
          className={header ? "grid grid-cols-[1fr_auto_1fr] items-center px-6 py-5" : "px-6 py-4"}
        >
          {headerContent}
        </header>
      ) : null}

      {topBar}

      <div className="flex flex-1 items-center justify-center px-6 py-10">
        <section aria-labelledby="branded-page-title" className="w-full max-w-[26rem]">
          <div className="mb-9 flex flex-col items-center text-center">
            {brandMark ? (
              <img
                src="/favicon-196x196.png"
                alt=""
                aria-hidden="true"
                className="size-14 rounded-xl border"
              />
            ) : null}
            <h1
              id="branded-page-title"
              className={cn("text-xl font-semibold", brandMark && "mt-6")}
            >
              {title}
            </h1>
            {description ? (
              <div className="mt-5 text-muted-foreground text-sm leading-6">{description}</div>
            ) : null}
          </div>
          {children}
        </section>
      </div>
    </main>
  );
}

export default BrandedPage;
