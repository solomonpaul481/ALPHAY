const { NextResponse } = require("next/server");
const { db } = require("@/lib/db");
const { verifyWebhookSignature } = require("@/lib/razorpay");

/**
 * Razorpay calls this endpoint directly from its own servers whenever a
 * payment event happens. This is the ONLY place an order is marked PAID —
 * never the browser. Configure this URL (https://yourdomain.com/api/webhooks/razorpay)
 * in the Razorpay Dashboard under Settings -> Webhooks, with events
 * "payment.captured" and "payment.failed", and put the webhook secret you
 * choose there into RAZORPAY_WEBHOOK_SECRET in .env.
 */
async function POST(request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-razorpay-signature");

  if (!signature || !verifyWebhookSignature({ rawBody, signature })) {
    console.warn("Rejected webhook: bad or missing signature.");
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  const event = JSON.parse(rawBody);
  const eventType = event.event;

  if (eventType === "payment.captured") {
    const payment = event.payload.payment.entity;
    const razorpayOrderId = payment.order_id;

    const order = await db.order.findUnique({ where: { razorpayOrderId } });
    if (!order) {
      console.warn(`Webhook: no order found for Razorpay order ${razorpayOrderId}`);
      return NextResponse.json({ ok: true }); // ack anyway — nothing to retry
    }

    // Idempotent: if we've already confirmed this order, do nothing further.
    if (order.status === "PENDING_PAYMENT" || order.status === "PAYMENT_FAILED") {
      await db.$transaction([
        db.order.update({
          where: { id: order.id },
          data: { status: "CONFIRMED", razorpayPaymentId: payment.id },
        }),
        db.payment.update({
          where: { orderId: order.id },
          data: {
            status: "verified",
            razorpayPaymentId: payment.id,
            verifiedAt: new Date(),
          },
        }),
      ]);
      // This is where kitchen/manager notification would be dispatched
      // (push notification, websocket event, or dashboard poll picks it up).
      console.log(`Order ${order.id} confirmed for table via payment ${payment.id}`);
    }
  }

  if (eventType === "payment.failed") {
    const payment = event.payload.payment.entity;
    const razorpayOrderId = payment.order_id;
    const order = await db.order.findUnique({ where: { razorpayOrderId } });
    if (order && order.status === "PENDING_PAYMENT") {
      await db.order.update({ where: { id: order.id }, data: { status: "PAYMENT_FAILED" } });
      await db.payment.update({ where: { orderId: order.id }, data: { status: "failed" } });
    }
  }

  return NextResponse.json({ ok: true });
}

module.exports = { POST };
