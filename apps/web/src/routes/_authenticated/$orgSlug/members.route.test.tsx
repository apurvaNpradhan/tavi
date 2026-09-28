import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from "@tanstack/react-router";
import { render, screen, waitFor } from "@testing-library/react";
import { StrictMode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AppI18nProvider } from "@/shared/i18n/provider";
import AuthProvider from "@/shared/providers/auth-provider";
import { Route as AuthenticatedRoute } from "../route";
import { Route as MembersRoute } from "./members";
import { Route as OrganizationRoute } from "./route";

type TestSessionResponse = {
  data: {
    user: { id: string; name: string; email: string; onboardingStep: string };
    session: { activeOrganizationId: string };
  };
  error: null;
};
type TestOrganization = { id: string; slug: string; name: string };
type TestOrganizationListResponse = { data: TestOrganization[]; error: null };
type TestActionResponse = { data: { success: boolean }; error: null };
type TestRoleListResponse = { data: { role: string }[]; error: null };

const { authClient, memberList, capabilities, unreadCount } = vi.hoisted(() => ({
  authClient: {
    getSession: vi.fn<() => Promise<TestSessionResponse>>(),
    organization: {
      list: vi.fn<() => Promise<TestOrganizationListResponse>>(),
      setActive: vi.fn<(input: { organizationId: string }) => Promise<TestActionResponse>>(),
      hasPermission:
        vi.fn<
          (input: {
            permissions: Record<string, string[]>;
            organizationId: string;
          }) => Promise<TestActionResponse>
        >(),
      listRoles:
        vi.fn<(input: { query: { organizationId: string } }) => Promise<TestRoleListResponse>>(),
    },
  },
  memberList: vi.fn<(input: { workspaceId: string }) => Promise<never[]>>(),
  capabilities: vi.fn<
    (input: { workspaceId: string }) => Promise<{
      canList: boolean;
      canCreate: boolean;
      canCancel: boolean;
      canChangeMembers: boolean;
    }>
  >(),
  unreadCount: vi.fn<() => { data: { count: number } }>(),
}));

// These singleton clients are the network boundary shared by the route guards
// and page. Keep the route hierarchy real while controlling their responses.
// oxlint-disable-next-line anti-slop/no-module-mocking
vi.mock("@/shared/auth/auth-client", () => ({ authClient }));
// oxlint-disable-next-line anti-slop/no-module-mocking
vi.mock("@/shared/api/api-client", () => ({
  client: { member: { list: memberList }, invitation: { capabilities } },
}));
// oxlint-disable-next-line anti-slop/no-module-mocking
vi.mock("@/features/notifications/hooks/use-notifications", () => ({
  useNotificationUnreadCount: unreadCount,
}));
// oxlint-disable-next-line anti-slop/no-module-mocking
vi.mock("@/features/layout/app-sidebar", () => ({
  AppSidebar: () => <div data-testid="app-sidebar" />,
}));

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

function createMembersRouter(queryClient: QueryClient) {
  const root = createRootRoute({ component: Outlet });
  const authenticated = AuthenticatedRoute.update({
    id: "/_authenticated",
    getParentRoute: () => root,
  } as Parameters<typeof AuthenticatedRoute.update>[0]);
  const organization = OrganizationRoute.update({
    id: "/$orgSlug",
    path: "/$orgSlug",
    getParentRoute: () => authenticated,
  } as Parameters<typeof OrganizationRoute.update>[0]);
  const members = MembersRoute.update({
    id: "/members",
    path: "/members",
    getParentRoute: () => organization,
  } as Parameters<typeof MembersRoute.update>[0]);

  return createRouter({
    routeTree: root.addChildren([authenticated.addChildren([organization.addChildren([members])])]),
    context: { queryClient, user: null },
    history: createMemoryHistory({ initialEntries: ["/acme/members"] }),
  });
}

describe("members route request counts", () => {
  const originalScrollTo = window.scrollTo;

  beforeEach(() => {
    window.scrollTo = () => {};
    authClient.organization.hasPermission.mockResolvedValue({
      data: { success: true },
      error: null,
    });
    authClient.organization.listRoles.mockResolvedValue({ data: [], error: null });
    authClient.organization.setActive.mockResolvedValue({ data: { success: true }, error: null });
    authClient.organization.list.mockImplementation(async () => {
      await Promise.resolve();
      return {
        data: [{ id: "org-1", slug: "acme", name: "Acme" }],
        error: null,
      };
    });
    memberList.mockImplementation(async () => {
      await Promise.resolve();
      return [];
    });
    capabilities.mockResolvedValue({
      canList: true,
      canCreate: true,
      canCancel: true,
      canChangeMembers: true,
    });
    unreadCount.mockReturnValue({ data: { count: 0 } });
  });

  afterEach(() => {
    vi.clearAllMocks();
    window.scrollTo = originalScrollTo;
  });

  it("loads one member list and one capability request through the async authenticated route chain", async () => {
    const session = deferred<TestSessionResponse>();
    authClient.getSession.mockReturnValue(session.promise);

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: 0 } },
    });
    const router = createMembersRouter(queryClient);
    render(
      <StrictMode>
        <QueryClientProvider client={queryClient}>
          <AppI18nProvider>
            <AuthProvider>
              <RouterProvider router={router} />
            </AuthProvider>
          </AppI18nProvider>
        </QueryClientProvider>
      </StrictMode>,
    );

    expect(authClient.getSession).toHaveBeenCalledTimes(1);
    expect(authClient.organization.list).not.toHaveBeenCalled();

    session.resolve({
      data: {
        user: {
          id: "user-1",
          name: "Ada Lovelace",
          email: "ada@example.test",
          onboardingStep: "completed",
        },
        session: { activeOrganizationId: "org-1" },
      },
      error: null,
    });

    await screen.findByRole("heading", { name: "Members" });
    await waitFor(() => expect(memberList).toHaveBeenCalled());
    await waitFor(() => expect(capabilities).toHaveBeenCalled());

    expect({
      memberList: memberList.mock.calls.length,
      hasPermission: authClient.organization.hasPermission.mock.calls.length,
      capabilityRequest: capabilities.mock.calls.length,
    }).toEqual({ memberList: 1, hasPermission: 0, capabilityRequest: 1 });
  });
});
