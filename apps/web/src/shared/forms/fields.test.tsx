import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { AppI18nProvider } from "@/shared/i18n/provider";
import { useAppForm } from ".";

/**
 * Exercises the fields through a real form.
 *
 * The error path depends on TanStack marking fields touched on submit and on
 * `FieldError` rendering children it did not compute itself; a unit test of the
 * field in isolation would not catch either.
 */
function SignUpHarness({
  onSubmit,
}: {
  onSubmit: (value: { email: string; password: string }) => void;
}) {
  const form = useAppForm({
    defaultValues: { email: "", password: "" },
    onSubmit: ({ value }) => {
      onSubmit(value);
    },
    validators: {
      onSubmit: z.object({
        email: z.email("Enter a valid email address."),
        password: z.string().min(8, "Password must be at least 8 characters."),
      }),
    },
  });

  return (
    <AppI18nProvider>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void form.handleSubmit();
        }}
      >
        <form.AppField name="email">
          {(field) => <field.EmailField label="Email" placeholder="you@example.com" />}
        </form.AppField>

        <form.AppField name="password">
          {(field) => <field.PasswordField label="Password" placeholder="Create a password" />}
        </form.AppField>

        <form.AppForm>
          <form.SubmitButton>Create account</form.SubmitButton>
        </form.AppForm>
      </form>
    </AppI18nProvider>
  );
}

function submit() {
  fireEvent.click(screen.getByRole("button", { name: "Create account" }));
}

describe("form fields", () => {
  it("shows schema errors and marks the input invalid after a failed submit", async () => {
    const onSubmit = vi.fn<(value: { email: string; password: string }) => void>();
    render(<SignUpHarness onSubmit={onSubmit} />);

    submit();

    expect(await screen.findByText("Enter a valid email address.")).toBeInTheDocument();
    expect(screen.getByText("Password must be at least 8 characters.")).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByLabelText("Email")).toHaveAttribute("aria-invalid", "true");
    });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("toggles the password between hidden and visible", () => {
    render(
      <SignUpHarness onSubmit={vi.fn<(value: { email: string; password: string }) => void>()} />,
    );

    const password = screen.getByLabelText("Password");
    expect(password).toHaveAttribute("type", "password");

    fireEvent.click(screen.getByRole("button", { name: "Show password" }));
    expect(password).toHaveAttribute("type", "text");

    fireEvent.click(screen.getByRole("button", { name: "Hide password" }));
    expect(password).toHaveAttribute("type", "password");
  });

  it("submits the typed values when they pass validation", async () => {
    const onSubmit = vi.fn<(value: { email: string; password: string }) => void>();
    render(<SignUpHarness onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "ada@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "correct horse battery" },
    });

    submit();

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        email: "ada@example.com",
        password: "correct horse battery",
      });
    });
  });
});
