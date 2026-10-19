const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { PaymentEventWorker } = require('../src/worker');

describe('Phase 7 Payment Event Worker — Deduplication, Amount/Currency Checks, Retries & Dry-Run', () => {
  it('confirms a matching order once and blocks duplicate event IDs or reused transaction IDs', async () => {
    const worker = new PaymentEventWorker({ dryRun: false });
    worker.registerOrder({
      orderId: 'ORD_TEST_101',
      gatewayOrderId: 'gw_ord_101',
      amountPaise: 79900,
      currency: 'INR',
    });
    worker.registerOrder({
      orderId: 'ORD_TEST_102',
      gatewayOrderId: 'gw_ord_102',
      amountPaise: 79900,
      currency: 'INR',
    });

    const res1 = await worker.processEvent({
      providerEventId: 'evt_001',
      transactionId: 'utr_9988776655',
      gatewayOrderId: 'gw_ord_101',
      amountPaise: 79900,
      currency: 'INR',
      status: 'CAPTURED',
    });
    assert.equal(res1.status, 'CONFIRMED');
    assert.equal(res1.orderId, 'ORD_TEST_101');

    // Replay same event ID -> DUPLICATE_EVENT
    const dupEvent = await worker.processEvent({
      providerEventId: 'evt_001',
      transactionId: 'utr_9988776655',
      gatewayOrderId: 'gw_ord_101',
      amountPaise: 79900,
      currency: 'INR',
      status: 'CAPTURED',
    });
    assert.equal(dupEvent.status, 'DUPLICATE_EVENT');

    // Attempt to reuse the same UTR/transactionId for a second order -> DUPLICATE_TRANSACTION
    const reusedTx = await worker.processEvent({
      providerEventId: 'evt_002',
      transactionId: 'utr_9988776655',
      gatewayOrderId: 'gw_ord_102',
      amountPaise: 79900,
      currency: 'INR',
      status: 'CAPTURED',
    });
    assert.equal(reusedTx.status, 'DUPLICATE_TRANSACTION');
    assert.equal(worker.orders.get('gw_ord_102').status, 'PENDING');
  });

  it('rejects amount mismatch and alerts administrator on unmatched orders', async () => {
    const worker = new PaymentEventWorker({ dryRun: false });
    worker.registerOrder({
      orderId: 'ORD_TEST_201',
      gatewayOrderId: 'gw_ord_201',
      amountPaise: 129900,
      currency: 'INR',
    });

    const mismatch = await worker.processEvent({
      providerEventId: 'evt_201',
      transactionId: 'utr_201',
      gatewayOrderId: 'gw_ord_201',
      amountPaise: 50000,
      currency: 'INR',
      status: 'CAPTURED',
    });
    assert.equal(mismatch.status, 'AMOUNT_MISMATCH');
    assert.equal(worker.orders.get('gw_ord_201').status, 'FAILED');

    const unmatched = await worker.processEvent({
      providerEventId: 'evt_unknown',
      transactionId: 'utr_unknown',
      gatewayOrderId: 'gw_ord_missing',
      amountPaise: 50000,
      currency: 'INR',
      status: 'CAPTURED',
    });
    assert.equal(unmatched.status, 'UNMATCHED_ORDER');
    assert.equal(worker.alerts.some((a) => a.type === 'UNMATCHED_TRANSACTION'), true);
  });

  it('supports dry-run mode without mutating order status and recovers from transient failures via bounded retry', async () => {
    let attempts = 0;
    const worker = new PaymentEventWorker({
      dryRun: false,
      baseDelayMs: 5,
      maxRetries: 3,
      onConfirmOrder: async () => {
        attempts++;
        if (attempts < 2) throw new Error('Transient DB lock timeout');
      },
    });
    worker.registerOrder({
      orderId: 'ORD_TEST_301',
      gatewayOrderId: 'gw_ord_301',
      amountPaise: 59900,
      currency: 'INR',
    });

    const dryWorker = new PaymentEventWorker({ dryRun: true });
    dryWorker.registerOrder({
      orderId: 'ORD_DRY_1',
      gatewayOrderId: 'gw_dry_1',
      amountPaise: 29900,
      currency: 'INR',
    });
    const dryRes = await dryWorker.processEvent({
      providerEventId: 'evt_dry_1',
      transactionId: 'utr_dry_1',
      gatewayOrderId: 'gw_dry_1',
      amountPaise: 29900,
      currency: 'INR',
      status: 'CAPTURED',
    });
    assert.equal(dryRes.status, 'DRY_RUN_VALIDATED');
    assert.equal(dryWorker.orders.get('gw_dry_1').status, 'PENDING');

    const recovered = await worker.processEventWithRetry({
      providerEventId: 'evt_301',
      transactionId: 'utr_301',
      gatewayOrderId: 'gw_ord_301',
      amountPaise: 59900,
      currency: 'INR',
      status: 'CAPTURED',
    });
    assert.equal(recovered.status, 'CONFIRMED');
    assert.equal(attempts, 2);
  });
});
