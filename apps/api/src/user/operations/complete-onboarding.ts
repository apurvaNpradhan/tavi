import { eq } from "drizzle-orm";
import db, { schema } from "../../database";
import { COMPLETED_ONBOARDING_STEP } from "../onboarding";

/**
 * Marks first-run setup complete for a user who has just created a workspace.
 *
 * Called from the organization plugin's `afterCreateOrganization` hook, and
 * exposed as a function rather than left inline because of how it fails: a
 * predicate that matches no rows does not throw, it silently leaves an account
 * pointed at first-run setup forever. Integration tests call this directly to
 * assert the row actually changed.
 *
 * Creating any workspace completes onboarding. This is unconditional because
 * every path that reaches here — the onboarding flow, a workspace made later
 * from the account menu, an API client — has done the one thing setup asks
 * for, and re-completing is a no-op.
 */
export async function completeOnboardingWithWorkspace(userId: string): Promise<void> {
  await db
    .update(schema.userTable)
    .set({ onboardingStep: COMPLETED_ONBOARDING_STEP })
    .where(eq(schema.userTable.id, userId));
}

export default completeOnboardingWithWorkspace;
