import { CheckIcon, CopyIcon, KeyIcon, PlusIcon } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { SettingsSection } from "@/features/settings/settings-section";
import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogPopup,
  AlertDialogTitle,
} from "@/shared/ui/alert-dialog";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
} from "@/shared/ui/dialog";
import { Field, FieldDescription, FieldLabel } from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";
import { Select, SelectItem, SelectPopup, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { Skeleton } from "@/shared/ui/skeleton";
import { toastManager } from "@/shared/ui/toast";
import { useCreateApiKey } from "@/features/api-keys/hooks/use-create-api-key";
import { useDeleteApiKey } from "@/features/api-keys/hooks/use-delete-api-key";
import { type ApiKey, useApiKeys } from "@/features/api-keys/hooks/use-api-keys";

/** Offered lifetimes, in days. `null` is a key that never expires. */
const EXPIRY_OPTIONS = [
  { value: "never", days: null },
  { value: "30", days: 30 },
  { value: "90", days: 90 },
  { value: "365", days: 365 },
] as const;

type ExpiryValue = (typeof EXPIRY_OPTIONS)[number]["value"];

function formatDate(value: Date | string | null | undefined) {
  if (!value) return null;

  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toLocaleDateString();
}

/**
 * Create, list and revoke API keys.
 *
 * The create flow is one dialog in two states: the form, then the reveal. That
 * is deliberate — the plaintext key exists in the create response and nowhere
 * else (the server stores a hash and the list endpoint omits the field), so the
 * reveal cannot be a separate screen the user might navigate away from before
 * copying.
 */
export function ApiKeysSection() {
  const { t } = useTranslation("settings");
  const { data: keys, isPending } = useApiKeys();
  const createKey = useCreateApiKey();
  const deleteKey = useDeleteApiKey();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [expiry, setExpiry] = useState<ExpiryValue>("never");
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [keyToRevoke, setKeyToRevoke] = useState<ApiKey | null>(null);

  function closeCreate() {
    setIsCreateOpen(false);
    // Reset only once the dialog is closed, so the reveal does not blank out
    // underneath the user while it is still on screen.
    setCreatedKey(null);
    setCopied(false);
    setName("");
    setExpiry("never");
  }

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const days = EXPIRY_OPTIONS.find((option) => option.value === expiry)?.days;

    try {
      const created = await createKey.mutateAsync({
        name: name.trim() || undefined,
        expiresInDays: days ?? undefined,
      });

      setCreatedKey(created.key);
    } catch {
      toastManager.add({ type: "error", title: t("apiKeys.createFailed") });
    }
  }

  async function handleCopy() {
    if (!createdKey) return;

    try {
      await navigator.clipboard.writeText(createdKey);
      setCopied(true);
    } catch {
      // Clipboard access can be denied; the key stays on screen to copy by hand.
      setCopied(false);
    }
  }

  async function handleRevoke() {
    if (!keyToRevoke) return;

    try {
      await deleteKey.mutateAsync(keyToRevoke.id);
      toastManager.add({ type: "success", title: t("apiKeys.revoked") });
    } catch {
      toastManager.add({ type: "error", title: t("apiKeys.revokeFailed") });
    } finally {
      setKeyToRevoke(null);
    }
  }

  function keyLabel(key: ApiKey) {
    return key.name?.trim() || t("apiKeys.unnamed");
  }

  return (
    <SettingsSection title={t("apiKeys.title")} description={t("apiKeys.description")}>
      <div className="flex flex-col gap-4">
        {isPending ? (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : keys && keys.length > 0 ? (
          <ul className="flex flex-col divide-y rounded-lg border">
            {keys.map((key) => (
              <li key={key.id} className="flex items-center gap-3 p-3">
                <KeyIcon aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="truncate font-medium text-sm">{keyLabel(key)}</span>
                  <span className="truncate font-mono text-muted-foreground text-xs">
                    {key.start ? `${key.start}…` : key.id}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {t("apiKeys.created")} {formatDate(key.createdAt) ?? "—"}
                    {" · "}
                    {t("apiKeys.lastUsed")} {formatDate(key.lastRequest) ?? t("apiKeys.never")}
                    {" · "}
                    {t("apiKeys.expires")} {formatDate(key.expiresAt) ?? t("apiKeys.never")}
                  </span>
                </div>
                <Button type="button" variant="ghost" size="sm" onClick={() => setKeyToRevoke(key)}>
                  {t("apiKeys.revoke")}
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground text-sm">{t("apiKeys.empty")}</p>
        )}

        <div>
          <Button type="button" variant="outline" onClick={() => setIsCreateOpen(true)}>
            <PlusIcon aria-hidden="true" />
            {t("apiKeys.create")}
          </Button>
        </div>
      </div>

      <Dialog
        open={isCreateOpen}
        onOpenChange={(open) => {
          if (!open) closeCreate();
        }}
      >
        <DialogPopup className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {createdKey ? t("apiKeys.createdTitle") : t("apiKeys.create")}
            </DialogTitle>
            <DialogDescription>
              {createdKey ? t("apiKeys.createdDescription") : t("apiKeys.description")}
            </DialogDescription>
          </DialogHeader>

          {createdKey ? (
            <>
              <DialogPanel>
                <div className="flex items-center gap-2">
                  <Input
                    aria-label={t("apiKeys.createdTitle")}
                    readOnly
                    value={createdKey}
                    className="font-mono text-xs"
                  />
                  <Button type="button" variant="outline" onClick={() => void handleCopy()}>
                    {copied ? <CheckIcon aria-hidden="true" /> : <CopyIcon aria-hidden="true" />}
                    {copied ? t("apiKeys.copied") : t("apiKeys.copy")}
                  </Button>
                </div>
              </DialogPanel>
              <DialogFooter>
                <Button type="button" onClick={closeCreate}>
                  {t("apiKeys.done")}
                </Button>
              </DialogFooter>
            </>
          ) : (
            // Header stays outside the form so the popup's flex column keeps
            // header, panel and footer as direct layout sections.
            <form className="contents" onSubmit={(event) => void handleCreate(event)}>
              <DialogPanel className="flex flex-col gap-4">
                <Field>
                  <FieldLabel htmlFor="api-key-name">{t("apiKeys.name")}</FieldLabel>
                  <Input
                    id="api-key-name"
                    value={name}
                    placeholder={t("apiKeys.namePlaceholder")}
                    onChange={(event) => setName(event.target.value)}
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="api-key-expiry">{t("apiKeys.expiresIn")}</FieldLabel>
                  <Select value={expiry} onValueChange={(value) => setExpiry(value as ExpiryValue)}>
                    <SelectTrigger id="api-key-expiry">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectPopup>
                      {EXPIRY_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.value === "never"
                            ? t("apiKeys.expiresNever")
                            : option.value === "30"
                              ? t("apiKeys.expires30")
                              : option.value === "90"
                                ? t("apiKeys.expires90")
                                : t("apiKeys.expires365")}
                        </SelectItem>
                      ))}
                    </SelectPopup>
                  </Select>
                  <FieldDescription>{t("apiKeys.createdDescription")}</FieldDescription>
                </Field>
              </DialogPanel>

              <DialogFooter>
                <DialogClose render={<Button type="button" variant="outline" />}>
                  {t("close")}
                </DialogClose>
                <Button type="submit" loading={createKey.isPending} disabled={createKey.isPending}>
                  {t("apiKeys.createSubmit")}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogPopup>
      </Dialog>

      <AlertDialog
        open={keyToRevoke !== null}
        onOpenChange={(open) => {
          if (!open) setKeyToRevoke(null);
        }}
      >
        <AlertDialogPopup>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("apiKeys.revokeTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("apiKeys.revokeDescription", {
                name: keyToRevoke ? keyLabel(keyToRevoke) : "",
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogClose render={<Button type="button" variant="outline" />}>
              {t("close")}
            </AlertDialogClose>
            <Button
              type="button"
              variant="destructive"
              loading={deleteKey.isPending}
              disabled={deleteKey.isPending}
              onClick={() => void handleRevoke()}
            >
              {t("apiKeys.revokeConfirm")}
            </Button>
          </AlertDialogFooter>
        </AlertDialogPopup>
      </AlertDialog>
    </SettingsSection>
  );
}

export default ApiKeysSection;
