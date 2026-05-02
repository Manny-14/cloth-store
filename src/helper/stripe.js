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

export async function ensureStripePriceForProduct({
  productId = "",
  productData = {},
  authToken = "",
} = {}) {
  if (!authToken) {
    throw new Error("Admin authentication is required to sync Stripe pricing.");
  }

  const body = {
    productId,
    productName: productData?.productName || productData?.name || "",
    description: productData?.description || productData?.productDescription || "",
    price: productData?.price ?? productData?.sellingPrice ?? 0,
    images: Array.isArray(productData?.images)
      ? productData.images
      : Array.isArray(productData?.image)
      ? productData.image
      : productData?.image
      ? [productData.image]
      : [],
    stripeProductId: productData?.stripeProductId || "",
    stripePriceId: productData?.stripePriceId || "",
  };

  const response = await fetch(`${STRIPE_SERVER_URL}/admin/stripe/ensure-product-price`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    const message = error?.error || `Stripe sync failed (${response.status})`;
    throw new Error(message);
  }

  return response.json();
}
