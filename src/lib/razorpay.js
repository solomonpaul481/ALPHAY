const Razorpay = require("razorpay");
const crypto = require("crypto");

let instance = null;

function getRazorpay() {
  if (!instance) {
    const keyId = (process.env.RAZORPAY_KEY_ID || "").trim();
    const keySecret = (process.env.RAZORPAY_KEY_SECRET || "").trim();

    if (!keyId || !keySecret || keySecret.includes("*")) {
      throw new Error(
        "RAZORPAY_KEY_SECRET is not configured or is set to placeholder asterisks ('*****'). Replace it with your actual key secret from Razorpay Dashboard -> Settings -> API Keys."
      );
    }
    instance = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });
  }
  return instance;
}

/**
 * Creates a Razorpay order for the given amount (in the smallest currency
 * unit — paise for INR). This is the ONLY step that happens before payment.
 * We never create our own Order record as PAID until the webhook below
 * verifies the signature.
 */
async function createRazorpayOrder({ amountInPaise, receipt, notes }) {
  const razorpay = getRazorpay();
  return razorpay.orders.create({
    amount: amountInPaise,
    currency: "INR",
    receipt,
    notes,
  });
}

/**
 * Verifies the signature Razorpay sends back to the CHECKOUT SUCCESS
 * callback on the client (razorpay_order_id + razorpay_payment_id +
 * razorpay_signature).
 */
function verifyCheckoutSignature(params = {}) {
  const orderId = params.orderId || params.razorpayOrderId || params.order_id || params.razorpay_order_id;
  const paymentId = params.paymentId || params.razorpayPaymentId || params.payment_id || params.razorpay_payment_id;
  const signature = params.signature || params.razorpaySignature || params.razorpay_signature;

  if (!orderId || !paymentId || !signature) {
    return false;
  }

  const keySecret = (process.env.RAZORPAY_KEY_SECRET || "").trim();
  if (!keySecret) return false;

  const expected = crypto
    .createHmac("sha256", keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");
  return expected === signature;
}

const verifyPaymentSignature = verifyCheckoutSignature;

/**
 * Verifies the signature on an incoming WEBHOOK request body. This is the
 * authoritative check — webhooks come directly from Razorpay's servers and
 * cannot be spoofed by the customer's browser, unlike the checkout
 * callback above. An order must only ever be marked PAID after this passes.
 */
function verifyWebhookSignature({ rawBody, signature }) {
  if (!process.env.RAZORPAY_WEBHOOK_SECRET) {
    throw new Error("RAZORPAY_WEBHOOK_SECRET is not set. Add it to your .env");
  }
  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET)
    .update(rawBody)
    .digest("hex");
  return expected === signature;
}

async function fetchRazorpayOrder(razorpayOrderId) {
  const razorpay = getRazorpay();
  return razorpay.orders.fetch(razorpayOrderId);
}

module.exports = {
  getRazorpay,
  createRazorpayOrder,
  verifyCheckoutSignature,
  verifyPaymentSignature,
  verifyWebhookSignature,
  fetchRazorpayOrder,
};
