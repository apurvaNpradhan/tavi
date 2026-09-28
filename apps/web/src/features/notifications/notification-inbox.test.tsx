import { fireEvent, render as rtlRender, screen } from "@testing-library/react";
import { createElement, type ReactElement } from "react";
import { createInstance } from "i18next";
import { I18nextProvider } from "react-i18next";
import { beforeAll, describe, expect, it, vi } from "vitest";
import notifications from "@i18n/en-US/notifications.json";
import { NotificationInbox } from "./notification-inbox";

const testI18n = createInstance();
beforeAll(async () => {
  await testI18n.init({
    lng: "en-US",
    resources: { "en-US": { notifications } },
    defaultNS: "notifications",
  });
});

function render(ui: ReactElement) {
  return rtlRender(createElement(I18nextProvider, { i18n: testI18n }, ui));
}

const callbacks = () => ({
  onMarkRead: vi.fn<(notificationId: string) => void>(),
  onClear: vi.fn<() => void>(),
  onRetry: vi.fn<() => void>(),
});

describe("NotificationInbox", () => {
  it("shows the loading state", () => {
    render(<NotificationInbox {...callbacks()} notifications={[]} isLoading />);

    expect(screen.getByLabelText("Loading notifications")).toBeInTheDocument();
  });

  it("offers retry after a load error", () => {
    const actions = callbacks();
    render(<NotificationInbox {...actions} notifications={[]} isError />);

    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(actions.onRetry).toHaveBeenCalledOnce();
  });

  it("shows an empty state and disables clear", () => {
    render(<NotificationInbox {...callbacks()} notifications={[]} />);

    expect(screen.getByText("No notifications yet")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Clear all" })).toBeDisabled();
  });

  it("marks unread notifications as read and reports the unread count", () => {
    const actions = callbacks();
    render(
      <NotificationInbox
        {...actions}
        notifications={[
          {
            id: "notice-1",
            title: "A new member joined",
            createdAt: "2026-01-12T09:00:00Z",
          },
          {
            id: "notice-2",
            title: "Workspace updated",
            createdAt: "2026-01-11T09:00:00Z",
            readAt: "2026-01-11T09:30:00Z",
          },
        ]}
      />,
    );

    expect(screen.getByText("1 unread")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Mark A new member joined as read" }));
    expect(actions.onMarkRead).toHaveBeenCalledWith("notice-1");
    expect(
      screen.queryByRole("button", { name: "Mark Workspace updated as read" }),
    ).not.toBeInTheDocument();
  });

  it("clears the inbox", () => {
    const actions = callbacks();
    render(
      <NotificationInbox
        {...actions}
        notifications={[
          { id: "notice-1", title: "A new member joined", createdAt: "2026-01-12T09:00:00Z" },
        ]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Clear all" }));
    expect(actions.onClear).toHaveBeenCalledOnce();
  });

  it("renders the API notification shape without assuming invitation details", () => {
    render(
      <NotificationInbox
        {...callbacks()}
        notifications={[
          {
            id: "notice-3",
            type: "invitation.accepted",
            createdAt: "2026-01-12T09:00:00Z",
            readAt: null,
          },
        ]}
      />,
    );

    expect(screen.getByText("Invitation accepted")).toBeInTheDocument();
    expect(screen.queryByText(/workspace invitation was accepted/i)).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Mark Invitation accepted as read" }),
    ).toBeInTheDocument();
  });
});
