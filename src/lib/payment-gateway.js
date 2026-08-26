const cashfreeLib = require("./cashfree");

/**
 * Returns the currently active online payment gateway provider.
 * Always returns "cashfree".
 */
function getActiveGateway() {
  return "cashfree";
}

/**
 * Online order creator supporting Cashfree payment gateway.
 */
async function createOnlinePaymentOrder({
  amountInRupees,
  amountInPaise,
  receipt,
  notes = {},
  customerDetails = {},
  returnUrl,
  notifyUrl,
}) {
  const finalAmountRupees =
    amountInRupees || (amountInPaise ? amountInPaise / 100 : 0);

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
    env: cashfreeLib.getCashfreeConfig().isProduction ? "production" : "sandbox",
  };
}

/**
 * Cashfree payment verifier.
 */
async function verifyOnlinePayment({
  orderId,
  paymentId,
}) {
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
}

module.exports = {
  getActiveGateway,
  createOnlinePaymentOrder,
  verifyOnlinePayment,
  cashfreeLib,
};
