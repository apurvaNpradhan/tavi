type WaitOptions = {
  query: () => Promise<void>;
  retries?: number;
  delayMs?: number;
  onAttempt?: (attempt: number, error: unknown) => void;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Blocks until the database answers, or gives up after `retries` attempts.
 *
 * Containers frequently start before Postgres accepts connections; retrying
 * here is far clearer than letting every request fail with a connection error.
 */
export async function waitForDatabase({
  query,
  retries = 30,
  delayMs = 2_000,
  onAttempt,
}: WaitOptions): Promise<void> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      await query();
      return;
    } catch (error) {
      lastError = error;
      onAttempt?.(attempt, error);
      if (attempt < retries) {
        await sleep(delayMs);
      }
    }
  }

  throw new Error(
    `Database did not become available after ${retries} attempts: ${
      lastError instanceof Error ? lastError.message : String(lastError)
    }`,
  );
}
