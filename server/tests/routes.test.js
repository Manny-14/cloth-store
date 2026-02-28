import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { spawn } from "node:child_process";

let serverProcess;
let baseUrl;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const waitForServer = async (url, timeoutMs = 8000) => {
  const start = Date.now();
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      const response = await fetch(`${url}/health`);
      if (response.ok) return;
    } catch {
      // keep polling
    }

    if (Date.now() - start > timeoutMs) {
      throw new Error("Timed out waiting for server to boot");
    }
    await sleep(150);
  }
};

beforeAll(async () => {
  const port = 4400 + Math.floor(Math.random() * 400);
  baseUrl = `http://127.0.0.1:${port}`;

  serverProcess = spawn("node", ["index.js"], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      PORT: String(port),
      CLIENT_ORIGIN: "http://localhost:5173",
      STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || "not-a-real-key",
      ALLOWED_PRICE_IDS: "",
      FIREBASE_SERVICE_ACCOUNT_KEY_PATH: "",
      FIREBASE_SERVICE_ACCOUNT_JSON: "",
    },
    stdio: "pipe",
  });

  serverProcess.on("error", (error) => {
    // surface startup failures during boot wait
    console.error("Server process failed:", error);
  });

  await waitForServer(baseUrl);
}, 15000);

afterAll(() => {
  if (serverProcess && !serverProcess.killed) {
    serverProcess.kill("SIGTERM");
  }
});

describe("server routes", () => {
  it("GET /health returns ok payload", async () => {
    const response = await fetch(`${baseUrl}/health`);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(typeof body.timestamp).toBe("string");
  });

  it("POST /checkout/session rejects missing sessionId", async () => {
    const response = await fetch(`${baseUrl}/checkout/session`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });

    const body = await response.json();
    expect(response.status).toBe(400);
    expect(body.error).toBe("sessionId is required");
  });

  it("POST /create-checkout-session rejects empty line items", async () => {
    const response = await fetch(`${baseUrl}/create-checkout-session`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ lineItems: [] }),
    });

    const body = await response.json();
    expect(response.status).toBe(400);
    expect(body.error).toContain("lineItems is required");
  });

  it("POST /create-checkout-session returns 503 when checkout auth is not configured", async () => {
    const response = await fetch(`${baseUrl}/create-checkout-session`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        lineItems: [{ priceId: "price_test_123", quantity: 1 }],
      }),
    });

    const body = await response.json();
    expect(response.status).toBe(503);
    expect(body.error).toContain("Checkout auth is not configured");
  });

  it("POST /checkout/finalize-session rejects missing sessionId", async () => {
    const response = await fetch(`${baseUrl}/checkout/finalize-session`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });

    const body = await response.json();
    expect(response.status).toBe(400);
    expect(body.error).toBe("sessionId is required");
  });

  it("POST /checkout/finalize-session returns 503 when server finalization is not configured", async () => {
    const response = await fetch(`${baseUrl}/checkout/finalize-session`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ sessionId: "cs_test_dummy" }),
    });

    const body = await response.json();
    expect(response.status).toBe(503);
    expect(body.error).toContain("not configured");
  });

  it("POST /admin/orders/:orderId/delivery returns 503 when admin API is not configured", async () => {
    const response = await fetch(`${baseUrl}/admin/orders/order_1/delivery`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        status: "packed",
      }),
    });

    const body = await response.json();
    expect(response.status).toBe(503);
    expect(body.error).toContain("not configured");
  });
});
