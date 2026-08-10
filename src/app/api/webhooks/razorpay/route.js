const { NextResponse } = require("next/server");
const { db } = require("@/lib/db");
const { verifyWebhookSignature } = require("@/lib/razorpay");

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

    // Check if webhook is for a CustomerSession payment
    const session = await db.customerSession.findFirst({ where: { razorpayOrderId } });
    if (session) {
      if (session.status !== "COMPLETED") {
        await db.customerSession.update({
          where: { id: session.id },
          data: {
            status: "COMPLETED",
            paymentStatus: "PAID",
            paymentMethod: "ONLINE",
            razorpayPaymentId: payment.id,
            endedAt: new Date(),
          },
        });
        await db.order.updateMany({
          where: { sessionId: session.id },
          data: { status: "PAID" },
        });
        console.log(`Session ${session.id} marked COMPLETED & PAID via Razorpay webhook.`);
      }
      return NextResponse.json({ ok: true });
    }

    // Otherwise check for single Order payment fallback
    const order = await db.order.findUnique({ where: { razorpayOrderId } });
    if (order) {
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
        console.log(`Order ${order.id} confirmed via payment ${payment.id}`);
      }
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
