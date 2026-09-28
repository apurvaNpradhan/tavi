import { useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/shared/providers/auth-provider/hooks/use-auth";
import { SettingsSection } from "@/features/settings/settings-section";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar";
import { Button } from "@/shared/ui/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";
import { toastManager } from "@/shared/ui/toast";
import { useRemoveUserAvatar } from "@/features/account/hooks/use-remove-user-avatar";
import { useUploadAvatar } from "@/features/account/hooks/use-upload-avatar";
import { refreshSession } from "@/features/authentication/hooks/use-session";
import { authClient } from "@/shared/auth/auth-client";
import { getInitials } from "@/shared/lib/get-initials";
import {
  ACCEPTED_AVATAR_TYPES,
  prepareAvatarImage,
  type PreparedAvatar,
} from "@/features/account/prepare-avatar-image";
import { resolveAvatarSrc } from "@/features/account/resolve-avatar-src";

/** Shortest name the server will accept, mirrored here for immediate feedback. */
const MIN_NAME_LENGTH = 2;

/**
 * The user's own profile: name, photo and the address on the account.
 *
 * A plain controlled field rather than the app's TanStack Form hook. This
 * section is the settings index, so anything it imports is fetched on the first
 * click; the form runtime is ~72KB, which is not a trade worth making for one
 * text input whose only rule is a minimum length.
 *
 * The photo is cropped and re-encoded as soon as it is chosen, so the preview is
 * exactly the bytes that get stored and an unreadable file fails while the
 * picker is still in view.
 *
 * Email is shown but not editable. Changing it is an identity change that has to
 * go through verification, and offering a field that silently cannot be saved
 * would be worse than saying who to ask.
 */
export function ProfileSection() {
  const { t } = useTranslation("settings");
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const uploadAvatar = useUploadAvatar();
  const removeAvatar = useRemoveUserAvatar();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(user?.name ?? "");
  const [prepared, setPrepared] = useState<PreparedAvatar | null>(null);
  const [clearedStoredAvatar, setClearedStoredAvatar] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showNameError, setShowNameError] = useState(false);

  const storedImage = clearedStoredAvatar ? null : (user?.image ?? null);
  const previewSrc = prepared
    ? `data:${prepared.contentType};base64,${prepared.data}`
    : (resolveAvatarSrc(storedImage ?? undefined) ?? "");
  const hasPhoto = Boolean(prepared) || Boolean(storedImage);
  const nameIsValid = name.trim().length >= MIN_NAME_LENGTH;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!nameIsValid) {
      setShowNameError(true);
      return;
    }

    setIsSaving(true);
    try {
      if (prepared) {
        await uploadAvatar.mutateAsync(prepared);
      } else if (clearedStoredAvatar) {
        await removeAvatar.mutateAsync();
      }

      const { error } = await authClient.updateUser({ name: name.trim() });
      if (error) throw new Error(error.message);

      await refreshSession(queryClient);
      setPrepared(null);
      setClearedStoredAvatar(false);
      toastManager.add({ type: "success", title: t("profile.saved") });
    } catch {
      toastManager.add({ type: "error", title: t("profile.failed") });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleFileSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    // Reset so re-picking the same file still fires a change event.
    event.target.value = "";

    if (!file) return;

    try {
      setPrepared(await prepareAvatarImage(file));
      setClearedStoredAvatar(false);
    } catch (error) {
      toastManager.add({
        type: "error",
        title: error instanceof Error ? error.message : t("profile.avatarFailed"),
      });
    }
  }

  function handleRemovePhoto() {
    setPrepared(null);
    // Nothing stored means there is nothing to delete server-side yet.
    if (storedImage) setClearedStoredAvatar(true);
  }

  return (
    <SettingsSection title={t("profile.title")} description={t("profile.description")}>
      <form className="flex flex-col gap-6" onSubmit={(event) => void handleSubmit(event)}>
        <div className="flex flex-col gap-3">
          <span className="font-medium text-sm">{t("profile.photo")}</span>
          <div className="flex items-center gap-4">
            <Avatar className="size-16 border">
              <AvatarImage src={previewSrc} alt="" />
              <AvatarFallback className="text-base">
                {getInitials(name || user?.email)}
              </AvatarFallback>
            </Avatar>

            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_AVATAR_TYPES}
              className="hidden"
              onChange={(event) => void handleFileSelected(event)}
            />

            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {hasPhoto ? t("profile.changePhoto") : t("profile.choosePhoto")}
                </Button>
                {hasPhoto ? (
                  <Button type="button" variant="ghost" size="sm" onClick={handleRemovePhoto}>
                    {t("profile.removePhoto")}
                  </Button>
                ) : null}
              </div>
              <p className="text-balance text-muted-foreground text-xs">{t("profile.photoHint")}</p>
            </div>
          </div>
        </div>

        <Field>
          <FieldLabel htmlFor="profile-name">{t("profile.name")}</FieldLabel>
          <Input
            id="profile-name"
            name="name"
            autoComplete="name"
            value={name}
            aria-invalid={showNameError && !nameIsValid ? true : undefined}
            placeholder={t("profile.namePlaceholder")}
            onChange={(event) => setName(event.target.value)}
            onBlur={() => setShowNameError(true)}
          />
          {showNameError && !nameIsValid ? (
            <FieldError>{t("profile.nameTooShort")}</FieldError>
          ) : null}
        </Field>

        <Field>
          <FieldLabel htmlFor="profile-email">{t("profile.email")}</FieldLabel>
          <Input id="profile-email" value={user?.email ?? ""} readOnly disabled />
          <FieldDescription>{t("profile.emailHint")}</FieldDescription>
        </Field>

        <div className="flex justify-end">
          <Button type="submit" loading={isSaving} disabled={isSaving}>
            {t("profile.save")}
          </Button>
        </div>
      </form>
    </SettingsSection>
  );
}

export default ProfileSection;
