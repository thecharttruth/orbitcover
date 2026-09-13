import { it } from "node:test";
import assert from "node:assert/strict";
import { resolveOAuthCredentials } from "./oauth-config.ts";

it("keeps the explicitly disabled app usable without credentials", () => {
  assert.equal(resolveOAuthCredentials({ VITE_AUTH_ENABLED: "false" }), null);
});

it("fails closed when enabled or unset without a complete credential pair", () => {
  for (const flag of [undefined, "true"]) {
    for (const credentials of [
      {}, { GROK_AUTH_CLIENT_ID: "test-client" },
      { GROK_AUTH_CLIENT_SECRET: "dummy-test-value" },
      { GROK_AUTH_CLIENT_ID: "test-client", GROK_AUTH_CLIENT_SECRET: "  " },
    ]) {
      assert.throws(
        () => resolveOAuthCredentials({ VITE_AUTH_ENABLED: flag, ...credentials }),
        /have not both been configured/,
      );
    }
  }
});

it("uses the server-supplied pair with no public fallback", () => {
  assert.deepEqual(resolveOAuthCredentials({
    VITE_AUTH_ENABLED: "true",
    GROK_AUTH_CLIENT_ID: " test-client ",
    GROK_AUTH_CLIENT_SECRET: " dummy-test-value ",
  }), { clientId: "test-client", clientSecret: "dummy-test-value" });
});

it("configuration errors do not disclose supplied credentials", () => {
  assert.throws(
    () => resolveOAuthCredentials({ GROK_AUTH_CLIENT_SECRET: "dummy-sensitive-input" }),
    (error: Error) => !error.message.includes("dummy-sensitive-input"),
  );
});
