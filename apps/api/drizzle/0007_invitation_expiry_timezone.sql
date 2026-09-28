-- Legacy invitation expiries were UTC wall times; preserve them as UTC instants.
ALTER TABLE "invitation" ALTER COLUMN "expires_at" SET DATA TYPE timestamp with time zone USING "expires_at" AT TIME ZONE 'UTC';
