import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DashboardLoadingSkeleton } from "./dashboard-loading-skeleton";

describe("dashboard loading skeleton", () => {
  it("announces itself as a loading status for assistive tech", () => {
    render(<DashboardLoadingSkeleton label="Loading…" />);

    // `<output>` carries the implicit status role, so the shell is announced
    // once while the placeholders themselves stay decorative.
    expect(screen.getByRole("status", { name: "Loading…" })).toBeInTheDocument();
  });
});
