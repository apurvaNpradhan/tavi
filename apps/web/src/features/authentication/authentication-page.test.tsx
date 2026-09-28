import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AppI18nProvider } from "@/shared/i18n/provider";
import {
  AuthenticationPage,
  type AuthenticationNotice,
  type AuthenticationServices,
} from "@/features/authentication/authentication-page";

function renderAuthenticationPage(options?: {
  google?: boolean;
  magicLink?: boolean;
  code?: boolean;
  linkError?: string;
  linkDeliveryFails?: boolean;
  pending?: boolean;
  sendMagicLink?: AuthenticationServices["sendMagicLink"];
}) {
  const sentLinks: { email: string; callbackURL: string; errorCallbackURL: string }[] = [];
  const sentCodes: string[] = [];
  const verifiedCodes: { email: string; code: string }[] = [];
  const destinations: string[] = [];
  const notices: AuthenticationNotice[] = [];
  const services: AuthenticationServices = {
    sendMagicLink:
      options?.sendMagicLink ??
      (async (email, callbackURL, errorCallbackURL) => {
        sentLinks.push({ email, callbackURL, errorCallbackURL });
        return !options?.linkDeliveryFails;
      }),
    sendCode: async (email) => {
      sentCodes.push(email);
      return true;
    },
    verifyCode: async (email, code) => {
      verifiedCodes.push({ email, code });
      return true;
    },
    signInWithGoogle: async () => true,
    finishCodeSignIn: async (destination) => {
      destinations.push(destination);
    },
    notify: (notice) => {
      notices.push(notice);
    },
  };
  render(
    <AppI18nProvider>
      <AuthenticationPage
        redirect="/onboarding?view=mine"
        linkError={options?.linkError}
        config={{
          data: options?.pending
            ? undefined
            : {
                appName: "Tavi",
                magicLinkEnabled: options?.magicLink ?? true,
                emailOtpEnabled: options?.code ?? true,
                socialProviders: { google: options?.google ?? true },
              },
          isPending: options?.pending ?? false,
          isError: false,
        }}
        services={services}
      />
    </AppI18nProvider>,
  );
  return { sentLinks, sentCodes, verifiedCodes, destinations, notices };
}

/** The height utility classes a rendered element actually carries. */
function heightClasses(element: HTMLElement): Set<string> {
  return new Set(element.className.split(" ").filter((token) => /^(sm:)?h-/.test(token)));
}

describe("passwordless authentication page", () => {
  it("sends a magic link, confirms it, and offers a code alternative", async () => {
    const records = renderAuthenticationPage();
    fireEvent.change(await screen.findByLabelText("Email"), {
      target: { value: "user@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));

    await waitFor(() =>
      expect(records.sentLinks).toEqual([
        {
          email: "user@example.com",
          callbackURL: `${window.location.origin}/onboarding?view=mine`,
          errorCallbackURL: `${window.location.origin}/auth/login?redirect=%2Fonboarding%3Fview%3Dmine`,
        },
      ]),
    );
    expect(await screen.findByRole("heading", { name: "Check your email" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Use a code instead" })).toBeInTheDocument();
    expect(records.notices).toEqual([
      {
        type: "success",
        title: "Sign-in link sent",
        description: "If the email doesn't arrive, check your spam folder.",
      },
    ]);
  });

  it("shows a pending indicator only on the action that was pressed", async () => {
    let resolveSend: ((delivered: boolean) => void) | undefined;
    renderAuthenticationPage({
      sendMagicLink: () =>
        new Promise<boolean>((resolve) => {
          resolveSend = resolve;
        }),
    });
    fireEvent.change(await screen.findByLabelText("Email"), {
      target: { value: "user@example.com" },
    });

    const continueButton = screen.getByRole("button", { name: "Continue" });
    const googleButton = screen.getByRole("button", { name: "Continue with Google" });
    fireEvent.click(continueButton);

    // Only the pressed button turns pending; the label stays readable on both.
    expect(continueButton.querySelector('[data-slot="auth-pending-indicator"]')).not.toBeNull();
    expect(googleButton.querySelector('[data-slot="auth-pending-indicator"]')).toBeNull();
    expect(continueButton).toHaveTextContent("Continue");
    expect(googleButton).toHaveTextContent("Continue with Google");
    expect(document.querySelectorAll('[data-slot="auth-pending-indicator"]')).toHaveLength(1);

    await act(async () => {
      resolveSend?.(true);
    });
    expect(await screen.findByRole("heading", { name: "Check your email" })).toBeInTheDocument();
  });

  it("gives the social and submit actions the same size", async () => {
    renderAuthenticationPage();
    await screen.findByLabelText("Email");

    const googleButton = screen.getByRole("button", { name: "Continue with Google" });
    const continueButton = screen.getByRole("button", { name: "Continue" });

    expect(googleButton).toHaveClass("w-full");
    expect(continueButton).toHaveClass("w-full");
    // Compared as classes rather than fixed values, so a change to the shared
    // button size scale cannot silently make the two actions differ.
    expect(heightClasses(googleButton)).toEqual(heightClasses(continueButton));
  });

  it("switches from a sent link to a code and lets the user change email", async () => {
    const records = renderAuthenticationPage();
    fireEvent.change(await screen.findByLabelText("Email"), {
      target: { value: "user@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    fireEvent.click(await screen.findByRole("button", { name: "Use a code instead" }));
    expect(await screen.findByText("Enter the 6-digit code sent to")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Resend code" }));
    await waitFor(() =>
      expect(records.sentCodes).toEqual(["user@example.com", "user@example.com"]),
    );
    fireEvent.click(screen.getByRole("button", { name: "Change email" }));
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
  });

  it("reports a delivery failure as an error notice instead of a sent state", async () => {
    const records = renderAuthenticationPage({ linkDeliveryFails: true });
    fireEvent.change(await screen.findByLabelText("Email"), {
      target: { value: "user@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));

    await waitFor(() =>
      expect(records.notices).toEqual([
        {
          type: "error",
          title: "Could not complete sign-in. Check your details and try again.",
          description: undefined,
        },
      ]),
    );
    expect(screen.queryByRole("heading", { name: "Check your email" })).toBeNull();
  });

  it("sends and verifies a six-digit code", async () => {
    const records = renderAuthenticationPage();
    fireEvent.change(await screen.findByLabelText("Email"), {
      target: { value: "user@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Email me a code instead" }));
    expect(await screen.findByRole("heading", { name: "Enter your code" })).toBeInTheDocument();

    // The OTP field is a labelled group of six single-character slots.
    expect(screen.getByRole("group", { name: "6-digit code" })).toBeInTheDocument();
    const slots = screen.getAllByRole("textbox");
    expect(slots).toHaveLength(6);

    fireEvent.change(slots[0], { target: { value: "123456" } });
    fireEvent.click(screen.getByRole("button", { name: "Verify" }));

    await waitFor(() =>
      expect(records.verifiedCodes).toEqual([{ email: "user@example.com", code: "123456" }]),
    );
    expect(records.sentCodes).toEqual(["user@example.com"]);
    expect(records.destinations).toEqual(["/onboarding?view=mine"]);
  });

  it("shows the logo and welcome title above the methods, without a method summary", async () => {
    renderAuthenticationPage();
    await screen.findByLabelText("Email");

    expect(document.querySelector("img")).toHaveAttribute("src", "/favicon-196x196.png");
    expect(screen.getByRole("heading", { name: "Welcome to Tavi" })).toBeInTheDocument();
    // The method summary line was deliberately dropped from this page.
    expect(screen.queryByText("Continue with Google or your email.")).toBeNull();
  });

  it("notifies instead of rendering inline text when a sign-in link is invalid", async () => {
    const records = renderAuthenticationPage({ linkError: "INVALID_TOKEN" });
    await waitFor(() =>
      expect(records.notices).toEqual([
        { type: "error", title: "That sign-in link could not be used. Request a new one." },
      ]),
    );
  });

  it("shows shaped placeholders while options load", () => {
    renderAuthenticationPage({ pending: true });
    expect(screen.getByLabelText("Loading sign-in options…")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Continue with Google" })).toBeNull();
  });

  it("hides unavailable methods", async () => {
    renderAuthenticationPage({ google: false, magicLink: false, code: false });
    expect(await screen.findByText("Sign-in is not available right now.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Continue with Google" })).toBeNull();
  });
});
