import { describe, expect, it, vi } from "vitest";
import { resolveCheckoutAuthToken } from "../checkoutAuth";

describe("checkout auth token resolver", () => {
  it("returns token when current user exposes getIdToken", async () => {
    const currentUser = {
      getIdToken: vi.fn().mockResolvedValue("token_123"),
    };

    await expect(resolveCheckoutAuthToken(currentUser)).resolves.toBe("token_123");
    expect(currentUser.getIdToken).toHaveBeenCalledTimes(1);
  });

  it("throws readable error when current user does not expose getIdToken", async () => {
    await expect(resolveCheckoutAuthToken({ uid: "abc" })).rejects.toThrow(
      "Unable to authenticate checkout. Please sign in again."
    );
  });

  it("throws readable error when token is empty", async () => {
    const currentUser = {
      getIdToken: vi.fn().mockResolvedValue(""),
    };

    await expect(resolveCheckoutAuthToken(currentUser)).rejects.toThrow(
      "Unable to authenticate checkout. Please sign in again."
    );
  });
});
