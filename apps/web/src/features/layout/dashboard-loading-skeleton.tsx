import { Skeleton } from "@/shared/ui/skeleton";

/**
 * The app shell in placeholder form, shown while the first session fetch settles.
 *
 * Mirrors the dashboard's real geometry (a 16rem sidebar and the content area)
 * so the swap to the live layout does not move anything.
 */
export function DashboardLoadingSkeleton({ label }: { label: string }) {
  return (
    <output aria-label={label} className="flex h-svh w-full bg-background">
      <div className="flex w-64 shrink-0 flex-col border-border border-r bg-card p-4">
        <Skeleton className="mb-4 h-4 w-24" />
        <div className="flex flex-col gap-1">
          <Skeleton className="h-7 w-full" />
          <Skeleton className="h-7 w-full" />
          <Skeleton className="h-7 w-11/12" />
        </div>
        <div className="mt-auto flex items-center justify-end border-border border-t pt-4">
          <Skeleton className="size-9 rounded-md" />
        </div>
      </div>

      <div className="flex flex-1 flex-col p-6">
        <Skeleton className="h-5 w-40" />
        <div className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Skeleton className="size-14 rounded-xl" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-64" />
          </div>
        </div>
      </div>
    </output>
  );
}
