import { serverTimestamp } from 'firebase/firestore';
import type { Order, StaffStamp } from '@/lib/hooks/useOrders';

export type OrderSource = 'staff_pos' | 'takeaway_pos' | 'quick_sale' | 'kiosk' | 'qr_customer';

/**
 * Timestamp (and who) to record whenever an order moves to a new status,
 * so prep time, serve time and time-to-payment can be measured later.
 */
export function statusStamps(status: Order['status'], by?: StaffStamp): Record<string, unknown> {
  switch (status) {
    case 'pending':
    case 'preparing':
      return { acceptedAt: serverTimestamp() };
    case 'prepared':
      return { preparedAt: serverTimestamp() };
    case 'served':
      return { servedAt: serverTimestamp() };
    case 'billed':
      return { billedAt: serverTimestamp() };
    case 'completed':
      return { completedAt: serverTimestamp() };
    case 'cancelled':
      return { cancelledAt: serverTimestamp(), ...(by ? { cancelledBy: by } : {}) };
    default:
      return {};
  }
}
