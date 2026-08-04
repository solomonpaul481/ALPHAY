const Razorpay = require("razorpay");
const crypto = require("crypto");

let instance = null;

function getRazorpay() {
  if (!instance) {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      throw new Error(
        "RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET are not set. Add your test keys to .env"
      );
    }
    instance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
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
 * razorpay_signature). Used as a first, fast check.
 */
function verifyCheckoutSignature({ orderId, paymentId, signature }) {
  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");
  return expected === signature;
}

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

module.exports = {
  getRazorpay,
  createRazorpayOrder,
  verifyCheckoutSignature,
  verifyWebhookSignature,
};
