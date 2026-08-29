const razorpayLib = require("./razorpay");

/**
 * Returns the active payment gateway.
 */
function getActiveGateway() {
  return "razorpay";
}

/**
 * Creates an online payment order with Razorpay.
 */
async function createOnlinePaymentOrder({
  amountInRupees,
  amountInPaise,
  receipt,
  notes = {},
  customerDetails = {},
}) {
  const finalAmountRupees = amountInRupees || (amountInPaise ? amountInPaise / 100 : 0);
  const paiseAmount = Math.max(100, Math.round(finalAmountRupees * 100));

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
    keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID || "rzp_test_TUtBMqf8GaZllM",
  };
}

/**
 * Verifies Razorpay payment signature.
 */
async function verifyOnlinePayment({
  orderId,
  paymentId,
  signature,
}) {
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

module.exports = {
  getActiveGateway,
  createOnlinePaymentOrder,
  verifyOnlinePayment,
  razorpayLib,
};
