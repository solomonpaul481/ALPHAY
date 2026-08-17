const razorpayLib = require("./razorpay");
const cashfreeLib = require("./cashfree");

/**
 * Returns the currently active online payment gateway provider.
 * Defaults to "cashfree" if process.env.PAYMENT_GATEWAY is set to "cashfree"
 * or if Cashfree credentials are primary.
 */
function getActiveGateway() {
  const configured = (process.env.PAYMENT_GATEWAY || "").trim().toLowerCase();
  if (configured === "razorpay") return "razorpay";
  if (configured === "cashfree") return "cashfree";

  // Fallback check based on keys present
  if (process.env.CASHFREE_APP_ID && process.env.CASHFREE_SECRET_KEY) {
    return "cashfree";
  }
  return "razorpay";
}

/**
 * Universal online order creator supporting both Cashfree and Razorpay.
 */
async function createOnlinePaymentOrder({
  amountInRupees,
  amountInPaise,
  receipt,
  notes = {},
  customerDetails = {},
  returnUrl,
  notifyUrl,
  forceGateway,
}) {
  const gateway = forceGateway || getActiveGateway();

  const finalAmountRupees =
    amountInRupees || (amountInPaise ? amountInPaise / 100 : 0);

  if (gateway === "cashfree") {
    const cfResult = await cashfreeLib.createCashfreeOrder({
      amountInRupees: finalAmountRupees,
      customerDetails,
      returnUrl,
      notifyUrl,
      notes,
    });

    return {
      gateway: "cashfree",
      orderId: cfResult.orderId,
      paymentSessionId: cfResult.paymentSessionId,
      amountInRupees: finalAmountRupees,
      amountInPaise: Math.round(finalAmountRupees * 100),
      currency: cfResult.currency || "INR",
      env: process.env.NEXT_PUBLIC_CASHFREE_ENV || "sandbox",
    };
  } else {
    // Razorpay Flow
    const paiseAmount = Math.round(finalAmountRupees * 100);
    const rzpOrder = await razorpayLib.createRazorpayOrder({
      amountInPaise: paiseAmount,
      receipt: receipt || `rec_${Date.now()}`,
      notes,
    });

    return {
      gateway: "razorpay",
      orderId: rzpOrder.id,
      razorpayOrderId: rzpOrder.id,
      amountInRupees: finalAmountRupees,
      amountInPaise: paiseAmount,
      currency: "INR",
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID,
    };
  }
}

/**
 * Universal payment verifier.
 */
async function verifyOnlinePayment({
  orderId,
  paymentId,
  signature,
  gateway,
}) {
  const activeGateway = gateway || getActiveGateway();

  if (activeGateway === "cashfree") {
    // For Cashfree, fetch the order directly from Cashfree API to verify status
    const cfOrder = await cashfreeLib.fetchCashfreeOrder(orderId);
    const isPaid =
      cfOrder.order_status === "PAID" ||
      cfOrder.order_status === "SUCCESS" ||
      cfOrder.order_status === "COMPLETED";

    return {
      success: isPaid,
      status: cfOrder.order_status,
      orderId: cfOrder.order_id,
      paymentId: paymentId || cfOrder.cf_payment_id || `cf_pay_${cfOrder.order_id}`,
      gateway: "cashfree",
    };
  } else {
    // For Razorpay, verify checkout signature
    const isValid = razorpayLib.verifyPaymentSignature({
      razorpayOrderId: orderId,
      razorpayPaymentId: paymentId,
      signature,
    });

    return {
      success: isValid,
      status: isValid ? "PAID" : "FAILED",
      orderId,
      paymentId,
      gateway: "razorpay",
    };
  }
}

module.exports = {
  getActiveGateway,
  createOnlinePaymentOrder,
  verifyOnlinePayment,
  razorpayLib,
  cashfreeLib,
};
