/**
 * Stripe dispute lifecycle handler.
 *
 * Disputes arrive on a charge, which belongs to a payment intent.
 * We look up the Firestore order by `paymentIntentId` and attach /
 * update a `dispute` sub-object on the order document.
 */

const DISPUTE_STATUS = {
  OPEN: "dispute-open",
  UNDER_REVIEW: "dispute-under-review",
  WON: "dispute-won",
  LOST: "dispute-lost",
};

export { DISPUTE_STATUS };

export const createHandleDispute = ({ adminDb, FieldValue }) => {
  /**
   * Find the Firestore order linked to a payment intent.
   * Returns { ref, data } or null.
   */
  const findOrderByPaymentIntent = async (paymentIntentId) => {
    if (!adminDb || !paymentIntentId) return null;

    const snapshot = await adminDb
      .collection("orders")
      .where("paymentIntentId", "==", paymentIntentId)
      .limit(1)
      .get();

    if (snapshot.empty) return null;

    const doc = snapshot.docs[0];
    return { ref: doc.ref, data: doc.data() };
  };

  /**
   * charge.dispute.created
   *
   * Stripe has opened a dispute against a charge.  We mark the order
   * so admins can see it immediately and prepare evidence.
   */
  const onDisputeCreated = async (dispute) => {
    const paymentIntentId =
      typeof dispute.payment_intent === "string"
        ? dispute.payment_intent
        : dispute.payment_intent?.id;

    const order = await findOrderByPaymentIntent(paymentIntentId);
    if (!order) {
      console.warn(
        `[dispute.created] No order found for payment_intent ${paymentIntentId}`
      );
      return { matched: false };
    }

    const disputePayload = {
      stripeDisputeId: dispute.id,
      status: DISPUTE_STATUS.OPEN,
      reason: dispute.reason || "unknown",
      amount: dispute.amount ?? 0,
      currency: dispute.currency || "usd",
      evidenceDueBy: dispute.evidence_details?.due_by
        ? new Date(dispute.evidence_details.due_by * 1000).toISOString()
        : null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await order.ref.update({
      dispute: disputePayload,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return { matched: true, orderId: order.ref.id };
  };

  /**
   * charge.dispute.updated
   *
   * Evidence has been submitted or Stripe updated the dispute status.
   */
  const onDisputeUpdated = async (dispute) => {
    const paymentIntentId =
      typeof dispute.payment_intent === "string"
        ? dispute.payment_intent
        : dispute.payment_intent?.id;

    const order = await findOrderByPaymentIntent(paymentIntentId);
    if (!order) {
      console.warn(
        `[dispute.updated] No order found for payment_intent ${paymentIntentId}`
      );
      return { matched: false };
    }

    const existingDispute = order.data?.dispute || {};

    const nextStatus =
      dispute.status === "won"
        ? DISPUTE_STATUS.WON
        : dispute.status === "lost"
          ? DISPUTE_STATUS.LOST
          : dispute.status === "needs_response" || dispute.status === "warning_needs_response"
            ? DISPUTE_STATUS.OPEN
            : DISPUTE_STATUS.UNDER_REVIEW;

    await order.ref.update({
      "dispute.status": nextStatus,
      "dispute.reason": dispute.reason || existingDispute.reason || "unknown",
      "dispute.amount": dispute.amount ?? existingDispute.amount ?? 0,
      "dispute.evidenceDueBy": dispute.evidence_details?.due_by
        ? new Date(dispute.evidence_details.due_by * 1000).toISOString()
        : existingDispute.evidenceDueBy || null,
      "dispute.updatedAt": new Date().toISOString(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    return { matched: true, orderId: order.ref.id, status: nextStatus };
  };

  /**
   * charge.dispute.closed
   *
   * The dispute has been resolved — either won, lost, or withdrawn.
   */
  const onDisputeClosed = async (dispute) => {
    const paymentIntentId =
      typeof dispute.payment_intent === "string"
        ? dispute.payment_intent
        : dispute.payment_intent?.id;

    const order = await findOrderByPaymentIntent(paymentIntentId);
    if (!order) {
      console.warn(
        `[dispute.closed] No order found for payment_intent ${paymentIntentId}`
      );
      return { matched: false };
    }

    const finalStatus =
      dispute.status === "won"
        ? DISPUTE_STATUS.WON
        : DISPUTE_STATUS.LOST;

    await order.ref.update({
      "dispute.status": finalStatus,
      "dispute.updatedAt": new Date().toISOString(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    return { matched: true, orderId: order.ref.id, status: finalStatus };
  };

  return { onDisputeCreated, onDisputeUpdated, onDisputeClosed };
};
