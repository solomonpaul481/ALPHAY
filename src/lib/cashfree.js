const crypto = require("crypto");

function getCashfreeConfig() {
  const appId = (process.env.CASHFREE_APP_ID || "").trim();
  const secretKey = (process.env.CASHFREE_SECRET_KEY || "").trim();
  const env = (process.env.CASHFREE_ENV || "SANDBOX").trim().toUpperCase();
  const apiVersion = process.env.CASHFREE_API_VERSION || "2023-08-01";

  if (!appId || !secretKey || secretKey.includes("*")) {
    throw new Error(
      "CASHFREE_SECRET_KEY or CASHFREE_APP_ID is not properly configured in .env. Please set your credentials from Cashfree Merchant Dashboard."
    );
  }

  const isProduction = env === "PRODUCTION" || env === "PROD";
  const baseUrl = isProduction
    ? "https://api.cashfree.com/pg"
    : "https://sandbox.cashfree.com/pg";

  return { appId, secretKey, env, isProduction, baseUrl, apiVersion };
}

/**
 * Creates a Cashfree order for the given amount (in INR Rupees).
 * Cashfree V3 API expects order_amount as a float/number (e.g. 150.50).
 */
async function createCashfreeOrder({
  amountInRupees,
  orderId,
  customerDetails = {},
  returnUrl,
  notifyUrl,
  notes,
}) {
  const config = getCashfreeConfig();

  const formattedOrderId =
    orderId || `cf_ord_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  const body = {
    order_id: formattedOrderId,
    order_amount: Math.max(1, Math.round(Number(amountInRupees) * 100) / 100),
    order_currency: "INR",
    customer_details: {
      customer_id: customerDetails.customerId || `cust_${Date.now()}`,
      customer_name: customerDetails.name || customerDetails.customerName || "Dining Guest",
      customer_email: customerDetails.email || customerDetails.customerEmail || "guest@alphay.app",
      customer_phone: customerDetails.phone || customerDetails.customerPhone || "9999999999",
    },
    order_meta: {
      return_url: returnUrl || undefined,
      notify_url: notifyUrl || undefined,
    },
  };

  if (notes) {
    body.order_note = typeof notes === "string" ? notes : JSON.stringify(notes);
  }

  const response = await fetch(`${config.baseUrl}/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-client-id": config.appId,
      "x-client-secret": config.secretKey,
      "x-api-version": config.apiVersion,
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("Cashfree Create Order Error Payload:", data);
    throw new Error(data.message || data.error || "Failed to create Cashfree order.");
  }

  return {
    orderId: data.order_id,
    paymentSessionId: data.payment_session_id,
    orderStatus: data.order_status,
    orderAmount: data.order_amount,
    currency: data.order_currency,
    cfOrder: data,
  };
}

/**
 * Fetches order details directly from Cashfree API server to verify payment status authoritatively.
 */
async function fetchCashfreeOrder(orderId) {
  const config = getCashfreeConfig();

  const response = await fetch(`${config.baseUrl}/orders/${encodeURIComponent(orderId)}`, {
    method: "GET",
    headers: {
      "x-client-id": config.appId,
      "x-client-secret": config.secretKey,
      "x-api-version": config.apiVersion,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch order status from Cashfree.");
  }

  return data;
}

/**
 * Verifies webhook payload HMAC signature or checks with Cashfree API.
 */
function verifyCashfreeWebhookSignature({ rawBody, signature, timestamp }) {
  const secretKey = (process.env.CASHFREE_WEBHOOK_SECRET || process.env.CASHFREE_SECRET_KEY || "").trim();
  if (!secretKey) return false;

  try {
    const dataToSign = timestamp ? `${timestamp}${rawBody}` : rawBody;

    // Check base64 signature match
    const expectedBase64 = crypto
      .createHmac("sha256", secretKey)
      .update(dataToSign)
      .digest("base64");

    // Check hex signature match
    const expectedHex = crypto
      .createHmac("sha256", secretKey)
      .update(dataToSign)
      .digest("hex");

    return signature === expectedBase64 || signature === expectedHex;
  } catch (err) {
    console.warn("Cashfree Webhook Signature Verification Error:", err);
    return false;
  }
}

module.exports = {
  getCashfreeConfig,
  createCashfreeOrder,
  fetchCashfreeOrder,
  verifyCashfreeWebhookSignature,
};
