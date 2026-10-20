const crypto = require('node:crypto');

/**
 * Authorized Payment Event & Transaction Feed Reconciliation Worker
 * - Deduplicates events by providerEventId and transactionId
 * - Ensures one transaction cannot confirm two orders
 * - Validates amountPaise, currency ('INR'), and order reference
 * - Supports DRY_RUN mode and bounded retries with exponential backoff + jitter
 */
class PaymentEventWorker {
  constructor(options = {}) {
    this.dryRun = Boolean(options.dryRun ?? process.env.DRY_RUN === 'true');
    this.webhookSecret = options.webhookSecret || process.env.RAZORPAY_WEBHOOK_SECRET || '';
    this.maxRetries = Number(options.maxRetries ?? 3);
    this.baseDelayMs = Number(options.baseDelayMs ?? 50);

    // State stores (backed by DB in production or injected adapter in tests)
    this.processedEventIds = new Set();
    this.usedTransactionIds = new Map(); // transactionId -> orderId
    this.orders = new Map(); // gatewayOrderId -> { orderId, gatewayOrderId, amountPaise, currency, status }
    this.alerts = [];
    this.onConfirmOrder = options.onConfirmOrder || null;
    this.onAlert = options.onAlert || ((alert) => this.alerts.push(alert));
  }

  registerOrder(order) {
    this.orders.set(order.gatewayOrderId, {
      orderId: order.orderId,
      gatewayOrderId: order.gatewayOrderId,
      amountPaise: Number(order.amountPaise),
      currency: order.currency || 'INR',
      status: order.status || 'PENDING',
    });
  }

  verifySignature(rawPayload, signature) {
    if (!this.webhookSecret || !signature || !rawPayload) return false;
    const expected = crypto.createHmac('sha256', this.webhookSecret).update(rawPayload).digest('hex');
    const a = Buffer.from(expected);
    const b = Buffer.from(String(signature));
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  }

  async processEventWithRetry(event) {
    let attempt = 0;
    while (attempt <= this.maxRetries) {
      try {
        return await this.processEvent(event);
      } catch (err) {
        attempt++;
        if (attempt > this.maxRetries) {
          this.onAlert({
            type: 'WORKER_EXHAUSTED_RETRIES',
            eventId: event?.providerEventId,
            error: err.message,
          });
          throw err;
        }
        const jitter = Math.floor(Math.random() * 15);
        const delay = this.baseDelayMs * Math.pow(2, attempt - 1) + jitter;
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }

  async processEvent(event) {
    if (!event || !event.providerEventId || !event.transactionId || !event.gatewayOrderId) {
      return { status: 'REJECTED', reason: 'INVALID_EVENT_SCHEMA' };
    }

    // 1. Deduplicate by providerEventId
    if (this.processedEventIds.has(event.providerEventId)) {
      return { status: 'DUPLICATE_EVENT', orderId: null };
    }

    // 2. Ensure a single transactionId can never confirm two different orders
    if (this.usedTransactionIds.has(event.transactionId)) {
      const priorOrderId = this.usedTransactionIds.get(event.transactionId);
      return {
        status: 'DUPLICATE_TRANSACTION',
        orderId: priorOrderId,
      };
    }

    // 3. Match order by gatewayOrderId
    const order = this.orders.get(event.gatewayOrderId);
    if (!order) {
      this.onAlert({
        type: 'UNMATCHED_TRANSACTION',
        gatewayOrderId: event.gatewayOrderId,
        transactionId: event.transactionId,
      });
      return { status: 'UNMATCHED_ORDER' };
    }

    if (order.status === 'CONFIRMED') {
      this.processedEventIds.add(event.providerEventId);
      return { status: 'ALREADY_CONFIRMED', orderId: order.orderId };
    }

    // 4. Verify currency and exact integer paise amount
    if ((event.currency || 'INR') !== order.currency) {
      order.status = 'FAILED';
      this.onAlert({
        type: 'CURRENCY_MISMATCH',
        orderId: order.orderId,
        expected: order.currency,
        received: event.currency,
      });
      return { status: 'CURRENCY_MISMATCH', orderId: order.orderId };
    }

    if (Number(event.amountPaise) !== order.amountPaise) {
      order.status = 'FAILED';
      this.onAlert({
        type: 'AMOUNT_MISMATCH',
        orderId: order.orderId,
        expected: order.amountPaise,
        received: event.amountPaise,
      });
      return { status: 'AMOUNT_MISMATCH', orderId: order.orderId };
    }

    if (event.status !== 'CAPTURED' && event.status !== 'PAID') {
      return { status: 'IGNORED_NON_FINAL_STATUS', orderId: order.orderId };
    }

    // 5. Dry-run check
    if (this.dryRun) {
      return {
        status: 'DRY_RUN_VALIDATED',
        orderId: order.orderId,
        transactionId: event.transactionId,
      };
    }

    // 6. Commit state transition
    if (this.onConfirmOrder) {
      await this.onConfirmOrder(order, event);
    }

    order.status = 'CONFIRMED';
    this.processedEventIds.add(event.providerEventId);
    this.usedTransactionIds.set(event.transactionId, order.orderId);

    return {
      status: 'CONFIRMED',
      orderId: order.orderId,
      transactionId: event.transactionId,
    };
  }
}

if (require.main === module) {
  const worker = new PaymentEventWorker();
  console.log(
    JSON.stringify({
      service: 'fashion-payment-worker',
      status: 'running',
      dryRun: worker.dryRun,
      timestamp: new Date().toISOString(),
    })
  );
  const timer = setInterval(() => {}, 60_000);
  const shutdown = () => {
    clearInterval(timer);
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

module.exports = { PaymentEventWorker };
