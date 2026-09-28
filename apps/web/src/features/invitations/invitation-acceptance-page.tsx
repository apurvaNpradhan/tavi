import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { BrandedPage } from "@/features/layout/branded-page";
import { refreshSession, sessionQueryKey } from "@/features/authentication/hooks/use-session";
import { workspacesQueryKey } from "@/features/workspaces/hooks/use-workspaces";
import { orpc } from "@/shared/api/api-client";
import { authClient } from "@/shared/auth/auth-client";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Spinner } from "@/shared/ui/spinner";
import { toastManager } from "@/shared/ui/toast";

/** Invitation landing page, including safe auth return and account matching. */
export function InvitationAcceptancePage({ invitationId }: { invitationId: string }) {
  const { t } = useTranslation(["auth", "common"]);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: session, isPending: sessionPending } = authClient.useSession();
  const invitationQuery = useQuery(
    orpc.invitation.getDetails.queryOptions({ input: { invitationId } }),
  );
  const [pending, setPending] = useState(false);
  const invitation = invitationQuery.data?.invitation;
  const valid = invitationQuery.data?.valid === true && Boolean(invitation);
  const emailMatches =
    session?.user?.email?.trim().toLocaleLowerCase() ===
    invitation?.email?.trim().toLocaleLowerCase();
  const returnPath = `/invitation/accept/${encodeURIComponent(invitationId)}`;

  async function switchAccount() {
    setPending(true);
    try {
      const result = await authClient.signOut();
      if (result.error) throw new Error(result.error.message);
      queryClient.removeQueries({ queryKey: sessionQueryKey });
      await navigate({ to: "/auth/login", search: { redirect: returnPath } });
    } catch (error) {
      toastManager.add({
        type: "error",
        title:
          error instanceof Error ? error.message : t("invitation.switchFailed", { ns: "auth" }),
      });
    } finally {
      setPending(false);
    }
  }

  async function acceptInvitation() {
    setPending(true);
    try {
      const result = await authClient.organization.acceptInvitation({ invitationId });
      if (result.error || !result.data?.invitation?.organizationId) {
        throw new Error(result.error?.message ?? t("invitation.acceptFailed", { ns: "auth" }));
      }
      const organizationId = result.data.invitation.organizationId;
      const active = await authClient.organization.setActive({ organizationId });
      if (active.error) throw new Error(active.error.message);
      await Promise.all([
        refreshSession(queryClient),
        queryClient.invalidateQueries({ queryKey: workspacesQueryKey }),
      ]);
      const organizations = await queryClient.fetchQuery({
        queryKey: workspacesQueryKey,
        queryFn: async () => {
          const listed = await authClient.organization.list();
          if (listed.error) throw new Error(listed.error.message);
          return listed.data ?? [];
        },
        staleTime: 0,
      });
      const organization = organizations.find((item) => item.id === organizationId);
      if (!organization) throw new Error(t("invitation.joinedWorkspaceMissing", { ns: "auth" }));
      toastManager.add({
        type: "success",
        title: t("invitation.accepted", { ns: "auth" }),
      });
      await navigate({ to: "/$orgSlug", params: { orgSlug: organization.slug } });
    } catch (error) {
      toastManager.add({
        type: "error",
        title:
          error instanceof Error ? error.message : t("invitation.acceptFailed", { ns: "auth" }),
      });
    } finally {
      setPending(false);
    }
  }

  if (sessionPending || invitationQuery.isPending) {
    return (
      <BrandedPage title={t("common:loading")}>
        <div className="flex justify-center">
          <Spinner />
        </div>
      </BrandedPage>
    );
  }

  if (invitationQuery.isError || !invitationQuery.data) {
    return (
      <BrandedPage title={t("invitation.unavailableTitle", { ns: "auth" })}>
        <Card>
          <CardContent className="flex flex-col gap-4 pt-6">
            <p className="text-sm text-muted-foreground">
              {t("invitation.unavailable", {
                ns: "auth",
              })}
            </p>
            <Button render={<Link to="/auth/login" />}>{t("signIn", { ns: "auth" })}</Button>
          </CardContent>
        </Card>
      </BrandedPage>
    );
  }

  if (!valid || !invitation) {
    return (
      <BrandedPage title={t("invitation.invalidTitle", { ns: "auth" })}>
        <Card>
          <CardContent className="flex flex-col gap-4 pt-6">
            <p className="text-sm text-muted-foreground">
              {t("invitation.invalidDescription", {
                ns: "auth",
              })}
            </p>
            {invitation ? <p className="text-sm">{invitation.workspaceName}</p> : null}
          </CardContent>
        </Card>
      </BrandedPage>
    );
  }

  const signedIn = Boolean(session?.user);
  return (
    <BrandedPage
      title={t("invitation.title", { ns: "auth" })}
      description={t("invitation.subtitle", {
        ns: "auth",
        organization: invitation.workspaceName,
      })}
    >
      <Card>
        <CardHeader>
          <CardTitle>{invitation.workspaceName}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            {t("invitation.invitedEmail", {
              ns: "auth",
              email: invitation.email,
            })}
          </p>
          <p className="text-sm text-muted-foreground">
            {t("invitation.invitedBy", {
              ns: "auth",
              name: invitation.inviterName,
            })}
          </p>
          {signedIn && !emailMatches ? (
            <>
              <p className="text-sm text-muted-foreground">
                {t("invitation.accountMismatch", {
                  ns: "auth",
                  currentEmail: session?.user.email,
                })}
              </p>
              <Button loading={pending} onClick={switchAccount}>
                {t("invitation.switchAccount", { ns: "auth" })}
              </Button>
            </>
          ) : signedIn ? (
            <Button loading={pending} onClick={acceptInvitation}>
              {t("invitation.accept", { ns: "auth" })}
            </Button>
          ) : (
            <Button render={<Link to="/auth/login" search={{ redirect: returnPath }} />}>
              {t("invitation.continueWithEmail", { ns: "auth" })}
            </Button>
          )}
        </CardContent>
      </Card>
    </BrandedPage>
  );
}
