const STRIPE_SERVER_URL =
  import.meta.env.VITE_STRIPE_SERVER_URL?.trim() || "http://localhost:4242";

export async function createStripeCheckoutSession(payload, { authToken = "" } = {}) {
  try {
    const response = await fetch(`${STRIPE_SERVER_URL}/create-checkout-session`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      const message = error?.error || `Checkout failed (${response.status})`;
      throw new Error(message);
    }

    return response.json();
  } catch (err) {
    // Surface network/CORS issues as a readable error
    throw new Error(err?.message || "Network error contacting Stripe server");
  }
}
