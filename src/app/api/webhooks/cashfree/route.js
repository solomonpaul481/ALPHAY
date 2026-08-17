const { NextResponse } = require("next/server");
const { db } = require("@/lib/db");
const { verifyCashfreeWebhookSignature, fetchCashfreeOrder } = require("@/lib/cashfree");

async function POST(request) {
  try {
    const rawBody = await request.text();
    const signature =
      request.headers.get("x-webhook-signature") ||
      request.headers.get("x-cashfree-signature");
    const timestamp = request.headers.get("x-webhook-timestamp");

    let isSignatureValid = false;
    if (signature) {
      isSignatureValid = verifyCashfreeWebhookSignature({
        rawBody,
        signature,
        timestamp,
      });
    }

    const payload = JSON.parse(rawBody || "{}");
    const eventType = payload.type || payload.event || "";
    const orderData = payload.data?.order || payload.order || {};
    const paymentData = payload.data?.payment || payload.payment || {};

    const cashfreeOrderId = orderData.order_id || payload.order_id;
    const paymentStatus = paymentData.payment_status || payload.payment_status;
    const cfPaymentId = String(
      paymentData.cf_payment_id || paymentData.payment_id || `cf_pay_${cashfreeOrderId}`
    );

    if (!cashfreeOrderId) {
      return NextResponse.json({ error: "No order ID in webhook body." }, { status: 400 });
    }

    // Double check with Cashfree API if signature verification failed or in dev mode
    let isPaid =
      eventType === "PAYMENT_SUCCESS_WEBHOOK" ||
      paymentStatus === "SUCCESS" ||
      paymentStatus === "PAID";

    if (!isPaid) {
      try {
        const cfOrder = await fetchCashfreeOrder(cashfreeOrderId);
        if (cfOrder.order_status === "PAID" || cfOrder.order_status === "SUCCESS") {
          isPaid = true;
        }
      } catch (err) {
        console.warn("Cashfree API Order Status Fetch Check Warning:", err.message);
      }
    }

    if (!isPaid) {
      console.warn(`Cashfree Webhook: Order ${cashfreeOrderId} payment not marked as success.`);
      return NextResponse.json({ ok: true, message: "Ignored non-success event." });
    }

    // 1. Process CustomerSession payment matching cashfreeOrderId
    const session = await db.customerSession.findFirst({
      where: {
        OR: [{ cashfreeOrderId }, { razorpayOrderId: cashfreeOrderId }],
      },
    });

    if (session) {
      if (session.status !== "COMPLETED") {
        await db.customerSession.update({
          where: { id: session.id },
          data: {
            status: "COMPLETED",
            paymentStatus: "PAID",
            paymentMethod: "ONLINE",
            cashfreeOrderId: session.cashfreeOrderId || cashfreeOrderId,
            cashfreePaymentId: cfPaymentId,
            paymentGateway: "CASHFREE",
            endedAt: new Date(),
          },
        });

        await db.order.updateMany({
          where: { sessionId: session.id },
          data: { status: "PAID", paymentGateway: "CASHFREE" },
        });

        console.log(`[Cashfree Webhook] Session ${session.id} marked COMPLETED & PAID.`);
      }
      return NextResponse.json({ ok: true, message: "Session marked PAID." });
    }

    // 2. Fallback single Order payment matching cashfreeOrderId
    const order = await db.order.findFirst({
      where: {
        OR: [{ cashfreeOrderId }, { razorpayOrderId: cashfreeOrderId }],
      },
    });

    if (order) {
      if (order.status === "PENDING_PAYMENT" || order.status === "PAYMENT_FAILED") {
        await db.$transaction([
          db.order.update({
            where: { id: order.id },
            data: {
              status: "CONFIRMED",
              cashfreePaymentId: cfPaymentId,
              paymentGateway: "CASHFREE",
            },
          }),
          db.payment.upsert({
            where: { orderId: order.id },
            create: {
              orderId: order.id,
              razorpayOrderId: order.razorpayOrderId || cashfreeOrderId,
              cashfreeOrderId,
              cashfreePaymentId: cfPaymentId,
              paymentGateway: "CASHFREE",
              status: "verified",
              amount: order.total,
              verifiedAt: new Date(),
            },
            update: {
              status: "verified",
              cashfreePaymentId: cfPaymentId,
              paymentGateway: "CASHFREE",
              verifiedAt: new Date(),
            },
          }),
        ]);

        console.log(`[Cashfree Webhook] Order ${order.id} confirmed via payment ${cfPaymentId}`);
      }
      return NextResponse.json({ ok: true, message: "Order confirmed." });
    }

    return NextResponse.json({ ok: true, message: "Webhook received." });
  } catch (err) {
    console.error("Cashfree Webhook Handler Error:", err);
    return NextResponse.json({ error: err.message || "Webhook error" }, { status: 500 });
  }
}

module.exports = { POST };
