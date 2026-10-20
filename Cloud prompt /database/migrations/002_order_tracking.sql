-- ============================================================================
-- Migration 002: Order Tracking & Fulfillment Columns (Non-Destructive)
-- Adds tracking_id, courier_name, fulfillment_status, estimated_delivery,
-- and tracking_history JSONB timeline to orders.
-- ============================================================================

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS tracking_id VARCHAR(60) UNIQUE,
  ADD COLUMN IF NOT EXISTS courier_name VARCHAR(80) DEFAULT 'Delhivery Express',
  ADD COLUMN IF NOT EXISTS fulfillment_status VARCHAR(30) NOT NULL DEFAULT 'PENDING_PAYMENT'
    CHECK (fulfillment_status IN (
      'PENDING_PAYMENT',
      'ORDER_PLACED',
      'PACKED',
      'SHIPPED',
      'OUT_FOR_DELIVERY',
      'DELIVERED',
      'CANCELLED'
    )),
  ADD COLUMN IF NOT EXISTS estimated_delivery VARCHAR(80),
  ADD COLUMN IF NOT EXISTS tracking_history JSONB NOT NULL DEFAULT '[]'::jsonb;

CREATE INDEX IF NOT EXISTS idx_orders_tracking_id ON orders(tracking_id);
