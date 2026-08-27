const EVENT_DEFINITIONS = {
  "auth.google_sign_in_failed": { access: "public", severity: "warning", message: "Google sign-in failed." },
  "checkout.missing_stripe_price": { access: "authenticated", severity: "critical", message: "Checkout blocked because a Stripe price was missing." },
  "checkout.session_create_failed": { access: "authenticated", severity: "critical", message: "Stripe checkout session failed to start." },
  "checkout.flow_failed": { access: "authenticated", severity: "critical", message: "Checkout flow failed before redirect." },
  "checkout.finalize_failed": { access: "authenticated", severity: "critical", message: "Checkout finalization failed after payment." },
  "admin.product_archive_failed": { access: "admin", severity: "warning", message: "Admin failed to archive a product." },
  "admin.product_restore_failed": { access: "admin", severity: "warning", message: "Admin failed to restore an archived product." },
  "admin.order_delivery_update_failed": { access: "admin", severity: "warning", message: "Admin failed to update delivery details." },
  "admin.product_image_upload_failed": { access: "admin", severity: "warning", message: "Admin product image upload failed." },
  "admin.product_image_replace_failed": { access: "admin", severity: "warning", message: "Admin product image replacement failed." },
  "admin.product_upload_failed": { access: "admin", severity: "warning", message: "Admin product upload failed." },
  "admin.product_update_failed": { access: "admin", severity: "warning", message: "Admin product update failed." },
};

const enumValue = (value, allowed, fallback = "unknown") => allowed.has(value) ? value : fallback;

const safeIdentifier = (value, maxLength = 128) => {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
};

const safeHostname = (value) => {
  const hostname = safeIdentifier(value, 253).toLowerCase();
  return /^[a-z0-9.-]+(?::\d{1,5})?$/.test(hostname) ? hostname : "unknown";
};

const normalizeContext = (event, context = {}) => {
  if (!context || typeof context !== "object" || Array.isArray(context)) return {};

  if (event === "auth.google_sign_in_failed") {
    return {
      code: safeIdentifier(context.code, 80) || "auth/unknown",
      page: enumValue(context.page, new Set(["login", "signup"])),
      hostname: safeHostname(context.hostname),
      mode: enumValue(context.mode, new Set(["popup", "redirect", "profile_document", "unknown"])),
      device: enumValue(context.device, new Set(["mobile", "desktop", "unknown"])),
      provider: "google",
    };
  }

  if (event.startsWith("checkout.")) {
    const normalized = {
      checkoutMode: enumValue(context.checkoutMode, new Set(["cart", "buy_now"])),
    };

    if (event === "checkout.missing_stripe_price") {
      const missingCount = Number(context.missingCount);
      normalized.missingCount = Number.isInteger(missingCount) && missingCount >= 0 && missingCount <= 100
        ? missingCount
        : 0;
    }

    return normalized;
  }

  const normalized = {};
  const productId = safeIdentifier(context.productId);
  const orderId = safeIdentifier(context.orderId);
  const productType = safeIdentifier(context.productType, 80);
  const status = safeIdentifier(context.status, 80);

  if (productId) normalized.productId = productId;
  if (orderId) normalized.orderId = orderId;
  if (productType) normalized.productType = productType;
  if (status) normalized.status = status;
  return normalized;
};

export const normalizeClientDiagnostic = ({ event, context } = {}) => {
  const definition = EVENT_DEFINITIONS[event];
  if (!definition) return null;

  return {
    event,
    access: definition.access,
    log: {
      event,
      severity: definition.severity,
      source: "client",
      message: definition.message,
      context: normalizeContext(event, context),
    },
  };
};

export const createClientDiagnosticHandler = ({ adminAuth, adminDb, FieldValue }) => async (req, res) => {
  const diagnostic = normalizeClientDiagnostic(req.body || {});
  if (!diagnostic) {
    return res.status(400).json({ error: "Unsupported diagnostic event" });
  }

  if (!adminDb) {
    return res.status(503).json({ error: "Diagnostic logging is not configured on server." });
  }

  if (diagnostic.access !== "public") {
    if (!adminAuth) {
      return res.status(503).json({ error: "Diagnostic logging is not configured on server." });
    }

    const authHeader = req.headers.authorization || "";
    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Authentication is required" });
    }

    try {
      const token = authHeader.slice("Bearer ".length).trim();
      const decoded = await adminAuth.verifyIdToken(token);

      if (diagnostic.access === "admin") {
        const userDoc = await adminDb.collection("users").doc(decoded.uid).get();
        if (String(userDoc.data()?.role || "").toUpperCase() !== "ADMIN") {
          return res.status(403).json({ error: "Admin access required" });
        }
      }
    } catch (error) {
      console.error("Diagnostic auth verification failed", error);
      return res.status(401).json({ error: "Unauthorized" });
    }
  }

  try {
    await adminDb.collection("adminLogs").add({
      ...diagnostic.log,
      createdAt: FieldValue.serverTimestamp(),
    });
    return res.status(204).end();
  } catch (error) {
    console.error("Failed to store client diagnostic", error);
    return res.status(500).json({ error: "Unable to store diagnostic" });
  }
};
