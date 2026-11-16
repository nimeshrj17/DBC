import { itemChannel } from '@/lib/analytics/revenue';

/**
 * Items that never go on the kitchen slip: chai (made at the counter) and bought-in retail goods.
 * Decided by category and name, not the item's `isRetail` flag, which is unreliable
 * (some burgers carry it, some retail items do not).
 */
export function isExcludedFromKOT(item: { category?: string; name?: string }): boolean {
  const cat = (item.category || '').toLowerCase().trim();
  if (cat === 'chai' || cat === 'tea' || cat === 'herbal tea' || cat === 'retail') return true;
  return itemChannel(item) === 'retail';
}

export const AGENT_URL = 'http://127.0.0.1:5050';
