import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { describe, expect, it } from "vitest";

const emailDir = resolve(import.meta.dirname, "../../packages/email");
const distEntry = join(emailDir, "dist/index.js");
const built = existsSync(distEntry);

/**
 * Guards the shape of the *published* email output.
 *
 * `moduleResolution: bundler` leaves relative specifiers extensionless in tsc
 * output, which Node's ESM loader rejects at runtime. Type checking, unit tests
 * and the API's own bundle all pass while the container still crashes on boot
 * with ERR_MODULE_NOT_FOUND — so this asserts the built artifact directly
 * rather than the source.
 */
describe.skipIf(!built)("built email package", () => {
  it("declares itself as an ES module", () => {
    const manifest = JSON.parse(readFileSync(join(emailDir, "package.json"), "utf8")) as {
      type?: string;
      main?: string;
      exports?: Record<string, unknown>;
    };

    // Without `type: module`, Node re-parses the file and warns on every import.
    expect(manifest.type).toBe("module");
    expect(manifest.main).toBe("./dist/index.js");
    expect(manifest.exports).toBeDefined();
  });

  it("has no extensionless relative imports in its runtime entry", () => {
    const source = readFileSync(distEntry, "utf8");
    const relativeImports = source.match(/from\s+"\.\/[^"]*"/g) ?? [];

    // These are exactly what Node refuses to resolve.
    expect(relativeImports).toEqual([]);
  });

  it("ships the Resend backend and no Nodemailer dependency", () => {
    const source = readFileSync(distEntry, "utf8");
    expect(source).toMatch(/from\s+"resend"/);
    expect(source).not.toMatch(/nodemailer/i);

    const manifest = JSON.parse(readFileSync(join(emailDir, "package.json"), "utf8")) as {
      dependencies?: Record<string, string>;
    };
    expect(manifest.dependencies?.resend).toBeDefined();
    expect(manifest.dependencies?.nodemailer).toBeUndefined();
  });

  it("loads under plain Node ESM and exposes the sender helpers", () => {
    // A child process is used deliberately: Vitest may transform or externalize
    // modules in its own pipeline, which could hide a genuine resolution
    // failure. Plain `node` is the environment that actually matters.
    const script = `
      const url = ${JSON.stringify(pathToFileURL(distEntry).href)};
      const module = await import(url);
      const required = ["sendEmail", "isEmailConfigured", "sendMagicLinkEmail", "sendOtpEmail", "sendDeleteAccountEmail", "sendWorkspaceInvitationEmail", "OTP_EXPIRY_SECONDS", "DELETE_ACCOUNT_TOKEN_EXPIRY_SECONDS"];
      const missing = required.filter((name) => module[name] === undefined);
      if (missing.length > 0) {
        console.error("missing exports: " + missing.join(", "));
        process.exit(1);
      }
      console.log("ok:" + required.length);
    `;

    const output = execFileSync(process.execPath, ["--input-type=module", "-e", script], {
      cwd: emailDir,
      encoding: "utf8",
    });

    expect(output.trim()).toBe("ok:8");
  });
});
