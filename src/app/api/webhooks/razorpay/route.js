const { NextResponse } = require("next/server");
const { db } = require("@/lib/db");
const { verifyWebhookSignature } = require("@/lib/razorpay");

async function POST(request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-razorpay-signature");

    if (!signature) {
      return NextResponse.json({ error: "Missing webhook signature." }, { status: 400 });
    }

    const isValid = verifyWebhookSignature({ rawBody, signature });
    if (!isValid) {
      return NextResponse.json({ error: "Invalid webhook signature." }, { status: 400 });
    }

    const event = JSON.parse(rawBody);
    const eventType = event.event;
    const paymentEntity = event.payload?.payment?.entity;
    const orderEntity = event.payload?.order?.entity;

    const rzpOrderId = paymentEntity?.order_id || orderEntity?.id;
    const rzpPaymentId = paymentEntity?.id;

    if (eventType === "payment.captured" || eventType === "order.paid") {
      if (rzpOrderId) {
        // Mark session as paid if associated
        const session = await db.customerSession.findFirst({
          where: { razorpayOrderId: rzpOrderId },
        });

        if (session) {
          await db.customerSession.update({
            where: { id: session.id },
            data: {
              status: "COMPLETED",
              paymentStatus: "PAID",
              paymentMethod: "ONLINE",
              paymentGateway: "RAZORPAY",
              razorpayPaymentId: rzpPaymentId,
              endedAt: new Date(),
            },
          });

          await db.order.updateMany({
            where: { sessionId: session.id },
            data: { status: "PAID", paymentGateway: "RAZORPAY", razorpayPaymentId: rzpPaymentId },
          });
        }

        // Also check standalone orders
        await db.order.updateMany({
          where: { razorpayOrderId: rzpOrderId },
          data: { status: "CONFIRMED", paymentGateway: "RAZORPAY", razorpayPaymentId: rzpPaymentId },
        });

        await db.payment.updateMany({
          where: { razorpayOrderId: rzpOrderId },
          data: { status: "verified", razorpayPaymentId: rzpPaymentId, verifiedAt: new Date() },
        });
      }
    }

    return NextResponse.json({ status: "ok" });
  } catch (err) {
    console.error("Razorpay webhook error:", err);
    return NextResponse.json({ error: "Webhook processing error." }, { status: 500 });
  }
}

module.exports = { POST };
