const STRIPE_SERVER_URL =
  import.meta.env.VITE_STRIPE_SERVER_URL?.trim() || "http://localhost:4242";

export async function updateOrderDeliveryByAdmin({
  orderId,
  status,
  carrier = "",
  trackingNumber = "",
  trackingUrl = "",
  note = "Updated by admin",
  currentUser,
}) {
  if (!orderId) throw new Error("orderId is required");
  if (!status) throw new Error("status is required");
  if (!currentUser) throw new Error("You must be logged in as admin");

  const token = await currentUser.getIdToken();

  const response = await fetch(`${STRIPE_SERVER_URL}/admin/orders/${orderId}/delivery`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      status,
      carrier,
      trackingNumber,
      trackingUrl,
      note,
    }),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload?.error || `Failed to update order delivery (${response.status})`);
  }

  return response.json();
}
