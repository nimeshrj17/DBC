# Revenue Analysis Plan

Goal: the admin sees daily, weekly and monthly revenue, and can trace any number down to the individual orders behind it. Every figure on every screen has to reconcile to the same set of orders under one definition of "revenue".

---

## 1. What exists today (and why it falls short)

| Area | Where | Problem |
|---|---|---|
| Analytics page | `src/app/dashboard/analytics/page.tsx` + `useAnalytics.ts` | Fixed 30-day window, one-shot `getDocs` of all orders, everything aggregated in the browser. Only "today vs same weekday last week". No weekly or monthly view, no date picker. |
| Owner "today" metrics | `useOwnerMetrics.ts` | A second, different revenue definition (billed OR completed OR paid). Hourly buckets hard-coded to 12:00-24:00. |
| Monthly P&L | `useOwnerReports.ts` | Third definition. COGS uses the item's *current* cost, not the cost at sale time, and falls back to a guessed 35% when an item isn't costed. Totals only, no drill-down. |
| Daily drill-down | analytics page, `activeTab === 'daily'` | Sums `total` of *all* orders that day, including cancelled and unpaid ones. |

### Concrete defects found

1. **Three definitions of revenue.** `useAnalytics` counts `status === 'completed'`; `useOwnerMetrics` and `useOwnerReports` count `billed | completed | paid`; the daily tab counts everything, cancelled included. The same day shows different numbers on different screens.
2. **Timezone bug.** `useAnalytics` buckets by `orderDate.toISOString().split('T')[0]` (UTC date). The daily drill-down filters by *local* date. For IST, anything sold before 05:30 lands on the previous day in the chart but the current day in the drill-down.
3. **Tax mixed into revenue.** `order.total` includes tax; category and item revenue are `price * qty` (no tax). Category totals never add up to the headline revenue.
4. **`completed` is overloaded.** `dashboard/page.tsx` sets `completed` on payment *and* when a table is cleared (lines ~753-755), so an unpaid cleared table can look like revenue.
5. **No audit trail for voids.** `removeSentItemTransaction` silently shrinks an order's items and total. Revenue changes with no record of what was removed, by whom, or why.
6. **Missing fields.** Orders have no `paidAt`, `servedAt`, `preparedAt`, `cancelReason`, `discount`, `tip`, `cashierId`/`staffId`, or split-payment data. Without these, per-staff, prep-time and table-turnaround analysis is impossible.
7. **Hourly chart shows order count, not revenue.**
8. **Order type is guessed.** Dine-in vs takeaway is inferred from `isRetail` items or `tableNumber === 999999`.
9. **Cost of reads.** Aggregating thousands of order docs per page view will not scale and conflicts with the recent Firestore-quota work.

---

## 2. Principles

1. **One revenue definition, one module.** A single `revenue.ts` decides which orders count and how, used by every screen.
2. **Capture facts at write time.** Timestamps, who, cost snapshots and tax split are stored on the order when the event happens. They cannot be reconstructed later.
3. **Pre-aggregate, then drill down.** Summary docs make daily/weekly/monthly cheap; the order list makes any total auditable.
4. **Every number is clickable down to orders.** KPI -> breakdown -> order list -> single-order detail.
5. **Business day, not calendar day.** A cafe open past midnight needs a configurable day cutoff (e.g. 04:00), in IST.

---

## 3. The revenue definition (to confirm with the owner)

| Term | Definition |
|---|---|
| **Counted order** | `paymentStatus === 'paid'` and `status !== 'cancelled'`. Not tied to `completed`. |
| **Gross sales** | Sum of `price * qty` of items on counted orders. |
| **Discounts** | Sum of discounts applied (new field). |
| **Net sales** | Gross sales - discounts - refunds. **This is the headline "Revenue".** |
| **Tax collected** | Sum of `tax`. Shown separately; not revenue. |
| **Total collected** | Net sales + tax (+ tips). This is what hits the till and equals `order.total`. |
| **Voided / cancelled** | Tracked as its own metric with reason; excluded from revenue. |
| **COGS** | Sum of item `unitCost` snapshot x qty. |
| **Gross profit** | Net sales - COGS. |

Reconciliation rule the UI enforces: category revenue sum = item revenue sum = net sales, and total collected = sum of payment-method totals.

---

## 4. Data model changes

### 4.1 Order document: new fields
```
paidAt, servedAt, preparedAt, completedAt        (Timestamps, set at the moment of each event)
paidBy / createdBy                               ({ id, name } of staff)
orderType: 'dine_in' | 'takeaway' | 'kiosk' | 'qr'   (explicit, replaces the 999999 heuristic)
source: 'qr_customer' | 'staff_pos' | 'quick_sale' | 'kiosk'
discount: { amount, reason, approvedBy } | null
tip: number
payments: [{ method, amount }]                   (supports split payments; paymentMethod stays for old docs)
cancel: { by, at } | null              (no reason prompt)
guestCount?: number
businessDate: 'YYYY-MM-DD'                       (computed with the day-cutoff, IST)
items[]: + unitCost (snapshot), + taxable flag
```

### 4.2 New: `orderEvents` (audit log)
One doc per void / item removal / discount / refund / reprint: `{ orderId, type, itemId?, amountDelta, reason, by, at }`.
`removeSentItemTransaction` writes an event in the same transaction, so revenue changes are traceable.

### 4.3 New: `analytics_daily/{businessDate}`
Written/updated transactionally when an order is paid, voided or refunded (a server API route using `adminDb`, matching the pattern of the existing `/api/orders/*` routes).
```
orders, grossSales, discounts, refunds, netSales, tax, tips, totalCollected,
cogs, grossProfit,
byPayment: { cash, upi, qr, ... },
byType: { dine_in, takeaway, ... },
byHour: { "0".."23": { orders, netSales } },
byCategory: { [cat]: { qty, netSales, cogs } },
byItem: { [menuItemId]: { name, qty, netSales, cogs } },
byStaff: { [staffId]: { orders, netSales, voids, discounts } },
byTable: { [tableId]: { orders, netSales, avgDwellMin } },
cancelledOrders, cancelledValue, voidedItems, voidedValue,
newCustomers, returningCustomers
```
Weekly and monthly views are computed by summing 7 / ~30 daily docs, so a month costs ~30 reads, not thousands. Optionally also write `analytics_monthly/{YYYY-MM}` after month-end as a frozen snapshot.

### 4.4 Backfill
A one-off script (alongside `scripts/*.mjs`) that rebuilds `analytics_daily` from existing orders and sets `businessDate`/`orderType` on old docs. Costs for old orders use current menu costing (flagged `estimated: true`).

---

## 5. UI plan: Revenue section

Replace the current tab set with a **Revenue** hub that has a global period bar: `Day | Week | Month | Custom`, previous/next arrows, and a "compare to" toggle (previous period / same period last week / last year).

### 5.1 Daily view
- KPI row: Net sales, Orders, AOV, Items/order, Tax, Discounts, Voids, Gross profit, vs comparison (% and absolute).
- Hour-by-hour revenue + orders chart (full 24h, uses the business-day cutoff).
- Payment-method split and order-type split with amounts and counts.
- Category and item tables (qty, net sales, share %, COGS, margin).
- Staff table: orders handled, net sales, discounts given, voids.
- Table table: revenue per table, avg dwell time, turns.
- Cancelled / voided panel with reasons.
- **Order ledger for the day**: every order as a row (time, ID, table/type, items count, subtotal, discount, tax, total, payment, staff, status). Sortable, filterable, searchable. Row click opens the order detail (existing modal in the analytics page, extended with timeline: created -> approved -> prepared -> served -> paid, and its audit events).
- End-of-day reconciliation card: expected cash vs counted cash input, with variance.

### 5.2 Weekly view
- Day-by-day bars (Mon-Sun) with comparison to previous week.
- Best / worst day, weekday vs weekend, week-over-week by category and item (movers: biggest gainers/decliners).
- Hour x weekday heatmap for the week (revenue intensity).
- Top 10 items and top customers for the week.
- Click a day -> jumps to its Daily view.

### 5.3 Monthly view
- Day-by-day line with a month-to-date target pace line.
- Week-by-week table (revenue, orders, AOV, growth).
- Monthly P&L: net sales, COGS (snapshot-based), gross profit, staff cost, rent, electricity, other -> operating profit; margins. Reuses `monthly_expenses`, but COGS now comes from real snapshots instead of the 35% guess.
- Category mix, payment mix, order-type mix, new vs returning customers.
- Month-over-month and same-month-last-year comparison.
- Run-rate projection: "at the current pace the month ends at ₹X".
- Export: CSV of the order ledger and a PDF summary (the project already ships `jspdf`/`html2canvas`).

### 5.4 Order-level analytics ("track each order's statistics")
Per order, stored or derivable:
- Timeline and durations: order-to-approval, prep time, serve time, order-to-payment, table dwell time.
- Value metrics: subtotal, discount, tax, tip, total, COGS, gross profit, margin %.
- Context: table, order type, source, staff, customer (new/returning), guest count, revenue per guest.
- Modifications: items added/removed after sending (from `orderEvents`).
Aggregated screens: slowest orders, highest-value orders, orders with discounts/voids, low-margin orders, orders over a prep-time SLA.

### 5.5 Alerts / insights (later phase)
Revenue down X% vs same weekday, unusual void rate by a staff member, discount over threshold, cash variance, items selling below cost, stock-out lost sales.

---

## 6. Implementation phases

| Phase | Scope | Why this order |
|---|---|---|
| **0. Decisions** | Confirm revenue definition, day-cutoff hour, tax treatment, which new fields matter. | Everything else depends on it. |
| **1. Correctness (no schema change)** | Create `src/lib/analytics/revenue.ts` with the single definition and local/IST date helpers. Point `useAnalytics`, `useOwnerMetrics`, `useOwnerReports` and the daily tab at it. Fix the UTC bug, make hourly show revenue + orders, exclude cancelled/unpaid. Add a date-range picker (Day/Week/Month/Custom) over the existing data. | Fixes wrong numbers immediately and delivers daily/weekly/monthly views from current data. |
| **2. Capture the missing data** | Add the order fields in 4.1 where orders are created/paid (`dashboard/page.tsx` payment handlers, `takeaway`, `QuickSaleModal`, `kiosk`, `api/orders/*`). Add `orderEvents` and wire `removeSentItemTransaction`, cancel and discount flows. Snapshot `unitCost` on order creation. | Data only accumulates going forward, so start early. |
| **3. Aggregation layer** | `analytics_daily` writer (server route / transaction), backfill script, `useRevenueRange(from,to)` hook that reads daily docs. | Makes weekly/monthly cheap and fast. |
| **4. Revenue hub UI** | Daily, Weekly, Monthly views and the order ledger + order detail timeline, comparison toggle, CSV/PDF export. | Builds on the stable data from phases 1-3. |
| **5. Profit and insights** | Snapshot-based monthly P&L, staff/table analytics, alerts, cash reconciliation. | Needs phase 2 data to have accumulated. |

Phase 1 is shippable on its own in a short time and removes the "numbers don't match" problem.

---

## 7. Technical notes and risks

- **Firestore access.** Staff login and writes currently happen client-side with Firestore. Aggregates written by the browser can drift or be tampered with; write `analytics_daily` from a server route (`adminDb`), consistent with the existing `/api/orders/*` routes. Firestore security rules aren't in the repo; check them before relying on any of this.
- **Idempotency.** Payment handlers can be retried; the aggregator must key on `orderId` + event so a repeat doesn't double-count (store a `counted: true` marker or use `orderEvents` ids).
- **Reads.** Daily docs for week/month views; raw orders are loaded only for the ledger of a single day, paginated. Keep the current realtime listener only for "today".
- **Offline persistence** is enabled in `firebase.ts`; offline payments must still produce a correct `paidAt` (use the client time as a fallback, then correct with `serverTimestamp()` where possible).
- **Existing data.** Orders created before phase 2 lack the new fields; the UI must treat them as "unknown" rather than zero, and show a note where costs are estimated.
- **Testing.** Unit-test `revenue.ts` (definitions, timezone edges around midnight and the cutoff, tax split, cancelled/refunded cases) before wiring it in.

---

## 8. Decisions confirmed by the owner

1. **Tax is 0** and stays 0. Revenue = total collected. Tax fields remain in the schema but are not shown.
2. **Business day ends at 2 AM** (IST). Business date = (local time - 2h). Example: 1:30 AM on the 16th belongs to the 15th.
3. **No discounts, tips, split payments or refunds** are used. Do not build UI for them now; keep the order model able to hold them later. This removes `discount`, `tip`, `payments[]` and refunds from the Phase 2 scope, and net sales = gross sales.
4. **Item making-cost is not filled in.** Cost, COGS and profit margin are treated as *unavailable*, not as 0 or an estimate:
   - Sales figures are never affected by missing cost.
   - Profit/margin tiles show "Profit margin cannot be resolved: insufficient cost data" and list how many items lack a cost.
   - The 35% fallback in `useOwnerReports.ts` is removed.
   - Cost snapshot (`unitCost` on order items) is still captured at sale time when a cost exists, so margins become available automatically once costs are entered.
5. **Staff-level performance is visible** to the admin (orders, net sales, AOV, voids/cancellations per staff, per day/week/month).

6. **Cigarettes count in total revenue**, and the Daily/Weekly/Monthly views also show a **Kitchen vs Retail split**: kitchen items (chai, food, drinks made in-house) shown on their own against retail items (cigarettes, bottled water, packaged cold drinks), each with revenue, orders, qty and share of total. Classification uses the menu item's `isRetail` flag and category.
7. **No reason is required to cancel an order.** The `cancel.reason` field is dropped from the plan; cancellations are still counted and valued as a metric.
8. **Online payments** are confirmed by the physical sound box, so the admin panel records them as `upi` with a single tap (no GPay/PhonePe dialog).

### Still open
- None for Phase 1.
