const STRIPE_SERVER_URL =
  import.meta.env.VITE_STRIPE_SERVER_URL?.trim() || "http://localhost:4242";

export async function fetchCheckoutSession(sessionId) {
  const response = await fetch(`${STRIPE_SERVER_URL}/checkout/session`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ sessionId }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    const message = error?.error || `Failed to load session (${response.status})`;
    throw new Error(message);
  }

  return response.json();
}
