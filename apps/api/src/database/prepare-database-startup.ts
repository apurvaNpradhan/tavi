type StartupSteps = {
  waitForDatabase: () => Promise<void>;
  runStartupMigrations: () => Promise<void>;
};

/**
 * Orders the boot sequence that every environment shares.
 *
 * Kept separate from `index.ts` so integration tests can run the exact same
 * sequence against a throwaway database without booting an HTTP server.
 */
export async function prepareDatabaseStartup({
  waitForDatabase,
  runStartupMigrations,
}: StartupSteps): Promise<void> {
  await waitForDatabase();
  await runStartupMigrations();
}
