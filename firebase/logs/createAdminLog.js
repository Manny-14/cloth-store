import { auth } from "../firebase";

const STRIPE_SERVER_URL =
  import.meta.env.VITE_STRIPE_SERVER_URL?.trim() || "http://localhost:4242";

const normalizeValue = (value) => {
  if (value === undefined || value === null) return undefined;
  if (typeof value === "string") return value.trim();
  return value;
};

const compactObject = (value) => {
  if (!value || typeof value !== "object") return undefined;
  const entries = Object.entries(value)
    .map(([key, val]) => [key, normalizeValue(val)])
    .filter(([, val]) => val !== undefined && val !== "");
  return entries.length ? Object.fromEntries(entries) : undefined;
};

export const createAdminLog = async ({
  event,
  severity = "info",
  source = "client",
  message,
  context,
} = {}) => {
  const normalizedEvent = normalizeValue(event);
  if (!normalizedEvent) return;

  try {
    const idToken = await auth.currentUser?.getIdToken();
    const response = await fetch(`${STRIPE_SERVER_URL}/client-diagnostics`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
      },
      body: JSON.stringify({
        event: normalizedEvent,
        severity: normalizeValue(severity) || "info",
        source: normalizeValue(source) || "client",
        message: normalizeValue(message) || "",
        context: compactObject(context),
      }),
    });

    if (!response.ok) {
      throw new Error(`Diagnostic endpoint returned ${response.status}`);
    }
  } catch (error) {
    console.warn("Failed to send admin diagnostic", error);
  }
};
