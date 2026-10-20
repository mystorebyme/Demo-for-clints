const { pool } = require('../config/db');
const { sendTelegram } = require('./telegram');

const TIER_DESCRIPTIONS = {
  1: 'Tier 1: Primary Payment Gateway / Dedicated Dynamic QR Session',
  2: 'Tier 2: Secondary Authorized Provider / Backup Session Pool',
  3: 'Tier 3: Manual Reference / Pending Verification Workflow',
  4: 'Tier 4: Emergency Maintenance Mode (New Payment Sessions Disabled)',
};

async function getCurrentTier() {
  try {
    const { rows } = await pool.query('SELECT value FROM system_settings WHERE key = $1', ['payment_fallback_tier']);
    const tier = Number(rows[0]?.value || 1);
    return tier >= 1 && tier <= 4 ? tier : 1;
  } catch {
    return 1;
  }
}

async function setCurrentTier(tier) {
  const safeTier = Math.max(1, Math.min(4, Number(tier) || 1));
  await pool.query(
    `INSERT INTO system_settings (key, value, updated_at) VALUES ($1, $2, NOW())
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
    ['payment_fallback_tier', String(safeTier)]
  );
  if (safeTier === 4) {
    await sendTelegram('🚨 ALERT: Payment Verification Bridge switched to Tier 4 (Emergency Maintenance Mode).');
  }
  return {
    tier: safeTier,
    description: TIER_DESCRIPTIONS[safeTier],
  };
}

module.exports = {
  TIER_DESCRIPTIONS,
  getCurrentTier,
  setCurrentTier,
};
