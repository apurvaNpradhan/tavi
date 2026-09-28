import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AppI18nProvider } from "@/shared/i18n/provider";
import { BrandedPage } from "./branded-page";

/** Renders the shell the way login and onboarding both consume it. */
function renderPage(props?: {
  description?: string;
  brandMark?: boolean;
  header?: boolean;
  headerContent?: ReactNode;
}) {
  return render(
    <AppI18nProvider>
      <BrandedPage
        title="Create a workspace"
        brandMark={props?.brandMark}
        header={props?.header}
        headerContent={props?.headerContent}
        description={props?.description}
      >
        <p>Form goes here</p>
      </BrandedPage>
    </AppI18nProvider>,
  );
}

describe("branded page", () => {
  it("renders the shared chrome around its children", () => {
    renderPage({ description: "Workspaces group your projects." });

    expect(screen.getByRole("heading", { name: "Create a workspace" })).toBeInTheDocument();
    expect(screen.getByText("Workspaces group your projects.")).toBeInTheDocument();
    expect(screen.getByText("Form goes here")).toBeInTheDocument();
    expect(document.querySelector("img")).toHaveAttribute("src", "/favicon-196x196.png");
  });

  it("renders its header content in both the standalone and compact rows", () => {
    for (const header of [true, false]) {
      const { unmount } = renderPage({ header, headerContent: <span>Progress dots</span> });

      expect(screen.getByText("Progress dots")).toBeInTheDocument();
      unmount();
    }
  });

  it("renders no theme control of its own", () => {
    renderPage({ headerContent: <span>Progress dots</span> });

    expect(screen.queryByRole("button", { name: /theme/i })).toBeNull();
  });

  it("can render a text-only page without the brand mark", () => {
    renderPage({ brandMark: false });

    expect(document.querySelector("img")).toBeNull();
  });
});
