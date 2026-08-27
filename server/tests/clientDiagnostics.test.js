import { describe, expect, it } from "vitest";
import { normalizeClientDiagnostic } from "../lib/clientDiagnostics.js";

describe("client diagnostics", () => {
  it("accepts the Google sign-in event and keeps only its approved context", () => {
    const diagnostic = normalizeClientDiagnostic({
      event: "auth.google_sign_in_failed",
      context: {
        code: "auth/unauthorized-domain",
        page: "login",
        hostname: "store.example.com",
        mode: "redirect",
        device: "mobile",
        provider: "not-google",
        attemptedEmail: "customer@example.com",
      },
    });

    expect(diagnostic).toMatchObject({
      access: "public",
      log: {
        severity: "warning",
        context: {
          code: "auth/unauthorized-domain",
          page: "login",
          hostname: "store.example.com",
          mode: "redirect",
          device: "mobile",
          provider: "google",
        },
      },
    });
    expect(diagnostic.log.context.attemptedEmail).toBeUndefined();
  });

  it("requires an approved event name", () => {
    expect(normalizeClientDiagnostic({ event: "anything.else" })).toBeNull();
  });

  it("uses the stricter admin access class for admin events", () => {
    const diagnostic = normalizeClientDiagnostic({
      event: "admin.product_restore_failed",
      context: { productId: "prod_1", unexpected: "discarded" },
    });

    expect(diagnostic.access).toBe("admin");
    expect(diagnostic.log.context).toEqual({ productId: "prod_1" });
  });
});
