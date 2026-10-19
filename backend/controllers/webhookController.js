const { verifyWebhookSignature } = require('../services/razorpay');
const { confirmOrder } = require('../services/orderService');

// Razorpay webhook. The ONLY production path that can confirm an order.
// Signature is verified against the raw body before anything else happens.
async function razorpayWebhook(req, reply) {
  const signature = req.headers['x-razorpay-signature'];
  if (!verifyWebhookSignature(req.rawBody, signature)) {
    req.log.warn('webhook rejected: bad signature');
    return reply.code(400).send({ success: false });
  }

  const { event, payload } = req.body;
  if (event === 'payment.captured' || event === 'order.paid') {
    const pay = payload && payload.payment && payload.payment.entity;
    if (pay && pay.order_id && pay.id) {
      const out = await confirmOrder(pay.order_id, { id: pay.id, amount: pay.amount, method: pay.method });
      req.log.info({ event, gatewayOrderId: pay.order_id, result: out.result }, 'webhook processed');
    }
  }
  // Always 200 for valid signatures so Razorpay does not retry endlessly.
  return { success: true };
}

module.exports = { razorpayWebhook };
