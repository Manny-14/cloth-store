import { createAdminLog } from "../../firebase/logs/createAdminLog";

const getDeviceType = () => {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return "unknown";
  }

  const mobileUserAgent = /Android|iPhone|iPad|iPod|IEMobile|Opera Mini/i.test(
    navigator.userAgent || ""
  );
  const touchDevice = Number(navigator.maxTouchPoints || 0) > 0;
  const narrowViewport = window.matchMedia?.("(max-width: 768px)")?.matches;

  return mobileUserAgent || (touchDevice && narrowViewport) ? "mobile" : "desktop";
};

export const logGoogleSignInFailure = async (error, { page } = {}) => {
  if (error?.message === "Google sign-in was canceled.") return;

  await createAdminLog({
    event: "auth.google_sign_in_failed",
    severity: "warning",
    source: "client",
    message: error?.message || "Google sign-in failed.",
    context: {
      code: error?.code || "auth/unknown",
      page,
      hostname: typeof window !== "undefined" ? window.location.hostname : "unknown",
      mode: error?.phase || "unknown",
      device: getDeviceType(),
      provider: error?.provider || "google",
    },
  });
};
