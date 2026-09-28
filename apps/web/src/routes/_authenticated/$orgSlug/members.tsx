import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Copy, MailPlus, UserMinus, X } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { useAppSession } from "@/features/authentication/hooks/use-session";
import { workspacesQueryKey } from "@/features/workspaces/hooks/use-workspaces";
import PageTitle from "@/shared/ui/page-title";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Select, SelectItem, SelectPopup, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { Spinner } from "@/shared/ui/spinner";
import { toastManager } from "@/shared/ui/toast";
import { authClient } from "@/shared/auth/auth-client";
import { client } from "@/shared/api/api-client";
import { copyToClipboard } from "@/shared/lib/copy-to-clipboard";
import {
  canViewPendingInvitations,
  memberRoleOptions,
} from "@/features/workspaces/member-management";

export const Route = createFileRoute("/_authenticated/$orgSlug/members")({
  component: WorkspaceMembersPage,
});

const memberKey = (organizationId: string) => ["organization", organizationId, "members"] as const;
const pendingKey = ["invitation", "pending"] as const;

/** Lists and manages the people invited to or already in this workspace. */
function WorkspaceMembersPage() {
  const { t } = useTranslation("dashboard");
  const { orgSlug } = Route.useParams();
  const { data: session } = useAppSession();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<string>("member");
  const [busyId, setBusyId] = useState<string | null>(null);
  const organizationsQuery = useQuery({
    queryKey: workspacesQueryKey,
    queryFn: async () => {
      const result = await authClient.organization.list();
      if (result.error) throw new Error(result.error.message);
      return result.data ?? [];
    },
  });
  const organizations = organizationsQuery.data ?? [];
  const organization = organizations.find((item) => item.slug === orgSlug);
  const organizationId = organization?.id;
  const capabilitiesQuery = useQuery({
    queryKey: ["invitation", "capabilities", organizationId],
    enabled: Boolean(organizationId),
    queryFn: () => client.invitation.capabilities({ workspaceId: organizationId! }),
  });
  const capabilitiesReady = Boolean(organizationId && !capabilitiesQuery.isPending);
  const canInvite = capabilitiesQuery.data?.canCreate ?? false;
  const canChangeMembers = capabilitiesQuery.data?.canChangeMembers ?? false;
  const canManageInvitations = capabilitiesQuery.data?.canCancel ?? false;
  const rolesQuery = useQuery({
    queryKey: ["workspace", organizationId, "roles"],
    enabled: Boolean(organizationId && capabilitiesReady && (canChangeMembers || canInvite)),
    queryFn: async () => {
      const result = await authClient.organization.listRoles({
        query: { organizationId: organizationId! },
      });
      if (result.error) throw new Error(result.error.message);
      return (result.data ?? []).map((workspaceRole) => workspaceRole.role);
    },
  });
  const membersQuery = useQuery({
    queryKey: memberKey(organizationId ?? ""),
    enabled: Boolean(organizationId),
    queryFn: async () => {
      return client.member.list({ workspaceId: organizationId! });
    },
  });
  const invitationsQuery = useQuery({
    queryKey: [...pendingKey, organizationId],
    enabled: Boolean(
      organizationId &&
      canViewPendingInvitations(capabilitiesReady, canInvite, canManageInvitations),
    ),
    queryFn: () => client.invitation.list({ workspaceId: organizationId! }),
  });

  const members = membersQuery.data ?? [];
  const roleOptions = rolesQuery.data ?? [];
  const inviteRoleOptions = memberRoleOptions(roleOptions);
  const invitations = useMemo(() => {
    const data = invitationsQuery.data;
    if (!Array.isArray(data)) return [];
    return data.filter((invitation) => invitation.status === "pending");
  }, [invitationsQuery.data]);
  const count = members.length;

  async function refreshPeople() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: memberKey(organizationId ?? "") }),
      queryClient.invalidateQueries({ queryKey: [...pendingKey, organizationId] }),
      queryClient.invalidateQueries({ queryKey: workspacesQueryKey }),
    ]);
  }

  async function inviteMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canInvite || !organizationId) return;
    setBusyId("invite");
    try {
      await client.invitation.create({ workspaceId: organizationId, email: email.trim(), role });
      setEmail("");
      await refreshPeople();
      toastManager.add({
        type: "success",
        title: t("members.inviteSent"),
      });
    } catch {
      toastManager.add({
        type: "error",
        title: t("members.inviteFailed"),
      });
    } finally {
      setBusyId(null);
    }
  }

  async function changeRole(memberId: string, nextRole: string) {
    if (!canChangeMembers) return;
    setBusyId(memberId);
    try {
      await client.member.updateRole({ memberId, role: nextRole });
      await refreshPeople();
    } catch {
      toastManager.add({
        type: "error",
        title: t("members.roleFailed"),
      });
    } finally {
      setBusyId(null);
    }
  }

  async function removeMember(memberId: string) {
    if (!canChangeMembers) return;
    setBusyId(memberId);
    try {
      await client.member.remove({ memberId });
      await refreshPeople();
    } catch {
      toastManager.add({
        type: "error",
        title: t("members.removeFailed"),
      });
    } finally {
      setBusyId(null);
    }
  }

  async function cancelInvitation(invitationId: string) {
    if (!canManageInvitations) return;
    setBusyId(invitationId);
    try {
      await client.invitation.cancel({ invitationId });
      await refreshPeople();
    } catch {
      toastManager.add({
        type: "error",
        title: t("members.cancelFailed"),
      });
    } finally {
      setBusyId(null);
    }
  }

  async function copyInvitation(invitationId: string) {
    const url = new URL(
      `/invitation/accept/${encodeURIComponent(invitationId)}`,
      window.location.origin,
    ).toString();
    const copied = await copyToClipboard(url);
    toastManager.add({
      type: copied ? "success" : "error",
      title: copied ? t("members.linkCopied") : t("members.copyFailed"),
      description: copied ? url : undefined,
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <PageTitle title={t("members.title")} />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="font-semibold text-2xl tracking-tight">{t("members.title")}</h1>
          <p className="text-sm text-muted-foreground">
            {t("members.subtitle", {
              name: organization?.name ?? orgSlug,
            })}
          </p>
        </div>
        {organization ? (
          <span className="font-mono text-xs text-muted-foreground">
            {count} {t("members.people")}
          </span>
        ) : null}
      </div>

      {organizationsQuery.isError ? (
        <Card role="alert" className="gap-3 p-6">
          <p className="text-sm text-destructive-foreground">{t("members.workspacesLoadFailed")}</p>
          <Button variant="outline" onClick={() => void organizationsQuery.refetch()}>
            {t("members.retry")}
          </Button>
        </Card>
      ) : organizationsQuery.isPending ? (
        <div className="flex justify-center p-8">
          <Spinner />
        </div>
      ) : canInvite && capabilitiesReady ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("members.inviteTitle")}</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="flex flex-wrap items-end gap-3" onSubmit={inviteMember}>
              <label className="flex min-w-56 flex-1 flex-col gap-2 text-sm font-medium">
                {t("members.email")}
                <Input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder={t("members.emailPlaceholder")}
                />
              </label>
              <label className="flex min-w-40 flex-col gap-2 text-sm font-medium">
                {t("members.role")}
                <Select value={role} onValueChange={(value) => value && setRole(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectPopup>
                    {inviteRoleOptions.map((value) => (
                      <SelectItem key={value} value={value}>
                        {t(`members.roles.${value}`, { defaultValue: value })}
                      </SelectItem>
                    ))}
                  </SelectPopup>
                </Select>
              </label>
              <Button type="submit" loading={busyId === "invite"}>
                <MailPlus aria-hidden="true" />
                {t("members.invite")}
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("members.current")}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {membersQuery.isPending || !capabilitiesReady ? (
            <div className="flex justify-center p-8">
              <Spinner />
            </div>
          ) : membersQuery.isError ? (
            <p className="p-6 text-sm text-destructive-foreground">{t("members.loadFailed")}</p>
          ) : members.length ? (
            <ul className="divide-y">
              {members.map((member) => {
                const isOwner = member.role === "owner";
                const isSelf = member.userId === session?.user.id;
                return (
                  <li key={member.id} className="flex flex-wrap items-center gap-3 px-6 py-4">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{member.name || member.email}</p>
                      <p className="truncate text-sm text-muted-foreground">{member.email}</p>
                    </div>
                    {canChangeMembers && !isOwner ? (
                      <Select
                        value={member.role}
                        onValueChange={(value) => value && void changeRole(member.id, value)}
                      >
                        <SelectTrigger
                          aria-label={t("members.changeRoleFor", {
                            email: member.email,
                          })}
                          className="w-36"
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectPopup>
                          {memberRoleOptions(roleOptions, member.role).map((value) => (
                            <SelectItem key={value} value={value}>
                              {t(`members.roles.${value}`, { defaultValue: value })}
                            </SelectItem>
                          ))}
                        </SelectPopup>
                      </Select>
                    ) : (
                      <span className="rounded-md bg-muted px-2 py-1 text-xs capitalize">
                        {t(`members.roles.${member.role}`, { defaultValue: member.role })}
                      </span>
                    )}
                    {isSelf ? (
                      <span className="text-xs text-muted-foreground">{t("members.you")}</span>
                    ) : null}
                    {canChangeMembers && !isOwner && !isSelf ? (
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        aria-label={t("members.removeMember", {
                          email: member.email,
                        })}
                        loading={busyId === member.id}
                        onClick={() => void removeMember(member.id)}
                      >
                        <UserMinus aria-hidden="true" />
                      </Button>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="px-6 py-8 text-sm text-muted-foreground">{t("members.empty")}</p>
          )}
        </CardContent>
      </Card>

      {canViewPendingInvitations(capabilitiesReady, canInvite, canManageInvitations) ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("members.pending")}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {invitationsQuery.isPending ? (
              <div className="flex justify-center p-8">
                <Spinner />
              </div>
            ) : invitationsQuery.isError ? (
              <div role="alert" className="flex flex-wrap items-center justify-between gap-3 p-6">
                <p className="text-sm text-destructive-foreground">
                  {t("members.invitationsLoadFailed")}
                </p>
                <Button variant="outline" onClick={() => void invitationsQuery.refetch()}>
                  {t("members.retry")}
                </Button>
              </div>
            ) : invitations.length ? (
              <ul className="divide-y">
                {invitations.map((invitation) => (
                  <li key={invitation.id} className="flex flex-wrap items-center gap-3 px-6 py-4">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{invitation.email}</p>
                      <p className="text-sm text-muted-foreground">
                        {t(`members.roles.${invitation.role}`, { defaultValue: invitation.role })}
                        {invitation.expiresAt
                          ? ` · ${t("members.expires", { date: new Date(invitation.expiresAt).toLocaleDateString() })}`
                          : ""}
                      </p>
                    </div>
                    {canManageInvitations ? (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => void copyInvitation(invitation.id)}
                        >
                          <Copy aria-hidden="true" />
                          {t("members.copyLink")}
                        </Button>
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          aria-label={t("members.cancelInvitation", {
                            email: invitation.email,
                          })}
                          loading={busyId === invitation.id}
                          onClick={() => void cancelInvitation(invitation.id)}
                        >
                          <X aria-hidden="true" />
                        </Button>
                      </>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-6 py-8 text-sm text-muted-foreground">{t("members.noPending")}</p>
            )}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
