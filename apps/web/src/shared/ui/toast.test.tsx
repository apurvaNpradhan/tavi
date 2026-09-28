import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Button } from "@/shared/ui/button";
import { ToastProvider, toastManager } from "./toast";

/**
 * Exercises the vendored coss toast through its real public API.
 *
 * The provider wiring is the failure mode worth covering: `toastManager` is a
 * module-level object, so a missing `ToastProvider` would silently swallow
 * every notification the app raises.
 */
describe("toast", () => {
  it("renders a notification raised through toastManager", async () => {
    render(
      <ToastProvider>
        <Button
          onClick={() =>
            toastManager.add({
              type: "success",
              title: "Sign-in link sent",
              description: "user@example.com",
            })
          }
        >
          Send
        </Button>
      </ToastProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Send" }));

    expect(await screen.findByText("Sign-in link sent")).toBeInTheDocument();
    expect(screen.getByText("user@example.com")).toBeInTheDocument();
  });

  it("removes a notification when its id is closed", async () => {
    let toastId: string | undefined;
    render(
      <ToastProvider>
        <Button
          onClick={() => {
            toastId = toastManager.add({ type: "error", title: "Could not complete sign-in" });
          }}
        >
          Fail
        </Button>
      </ToastProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Fail" }));
    expect(await screen.findByText("Could not complete sign-in")).toBeInTheDocument();

    await act(async () => {
      toastManager.close(toastId);
    });
    await waitFor(() =>
      expect(screen.queryByText("Could not complete sign-in")).not.toBeInTheDocument(),
    );
  });
});
