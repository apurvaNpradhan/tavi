import { useEffect } from "react";

type PageTitleProps = {
  title: string;
  suffix?: string;
  /** Omit the app name, for pages whose own title is enough. */
  hideAppName?: boolean;
};

/**
 * Sets `document.title` for the route that renders it.
 *
 * Renders nothing: the SPA has one `<title>` in `index.html`, and each route
 * overwrites it on mount.
 */
export function PageTitle({ title, suffix = "Tavi", hideAppName = false }: PageTitleProps) {
  useEffect(() => {
    document.title = hideAppName || !suffix ? title : `${title} · ${suffix}`;
  }, [title, suffix, hideAppName]);

  return null;
}

export default PageTitle;
