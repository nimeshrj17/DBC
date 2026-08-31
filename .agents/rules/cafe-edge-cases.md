# CaféFlow — Edge Case Flows

A module-by-module map of what can go wrong and exactly how the system should behave in each case.

## 1. Table & Order Management
- **Two customers at the same table order separately via QR:** Both orders attach to the same tableId as line items in one active order (not two separate orders) — table shows a single combined running total. Order document supports multiple addedBy (customer phone) tags per item for later dispute reference.
- **Staff adds an item to a table at the same moment a customer submits an item via QR:** Use a Firestore transaction on the order document (not a plain read-then-write) so both additions land — never let one silently overwrite the other.
- **Staff accidentally marks an occupied table "Empty" while an order is still open:** Block the status change in the UI if currentOrderId is not null/billed; require an explicit "Force clear table" confirmation that logs the action.
- **Order sent to kitchen, then customer/staff adds another item:** New items are appended as a clearly marked "Additional items" batch on the kitchen ticket with its own timestamp — not silently merged into the already-printed slip, so kitchen knows it's new.
- **Customer wants to cancel/remove an item after ordering, before kitchen starts:** Allow item removal only while order status is pending (not yet preparing). Once preparing, removal requires staff override, since food may already be started.
- **Customer walks out without paying ("dine and dash"):** Staff manually flags the order disputed / unpaid-abandoned instead of paid. Table frees up, but the order record stays for reporting — doesn't just vanish.
- **Table needs to be freed while order is still preparing (mistaken free-up):** Same as the "mark empty" case above — blocked with a confirmation step.
- **Large group needs multiple tables merged:** Support a mergedWithTableId field; merged tables share one order/bill, individual table cards show a "merged" badge linking to the primary table.
- **Duplicate order submission (customer double-taps "Place Order," or a network retry resends it):** Generate a client-side idempotency key (e.g. tableId + cart hash + timestamp bucket) before writing to Firestore; reject/collapse duplicate writes within a short window.
- **Walk-in / takeaway order with no table:** Support a tableId: null order type ("Takeaway #1023") so the flow doesn't force a table assignment.
- **Customer's connection drops mid-submit:** Cart persists in localStorage until a confirmed write succeeds; on reconnect, resume rather than resubmitting blindly.

## 2. Menu
- **Item goes out of stock while it's sitting in a customer's cart:** Re-validate available status server-side at checkout (not just at add-to-cart) — if now unavailable, remove it from the order automatically and notify the customer before submission.
- **Price changes while a cart is open:** Lock the price on the cart item at the moment it's added; don't recalculate against a live menu price later, so bills stay predictable.
- **A menu item is deleted but appears in historical orders/reports:** Never hard-delete — soft-delete with an archived: true flag so past orders and analytics still resolve the item name/price correctly.
- **Category has zero available items:** Show a plain "Nothing here right now" state instead of an empty grid — avoids looking broken.

## 3. Inventory
- **Two orders simultaneously deplete the last unit of a linked ingredient:** Decrement stock inside the same Firestore transaction that creates the order — if stock would go negative, the second order is blocked/adjusted before it commits, not after.
- **Stock hits zero:** Auto-flip the linked menu item's available to false immediately, not on a delayed sync.
- **Wastage, spillage, or breakage (stock reduction with no matching sale):** Give staff a manual "Adjust Stock" action separate from "Restock," logged with a reason field — keeps the audit trail honest.
- **Wrong quantity entered during restock:** Every stock change (restock, adjustment, or sale-deduction) writes to an append-only inventoryLog — mistakes are corrected with a new logged entry, not by silently editing history.
- **Menu item has no linked inventory (e.g., made-to-order, untracked):** Inventory linkage is optional per menu item — items without a link never trigger stock checks or low-stock alerts.
- **Low-stock alert keeps re-firing for the same item:** Alert once per item per threshold-crossing, with a "dismiss until next restock" state, rather than nagging on every dashboard load.

## 4. Customer QR Ordering
- **QR code is scanned for a table number that's been renumbered/retired:** Table lookup fails gracefully with "This table isn't active — please ask staff" rather than creating an order against a ghost table ID.
- **Customer scans QR outside business hours / cafe not accepting orders:** A cafe-level acceptingOrders: boolean setting (toggleable by staff) shows a "We're closed right now" screen instead of a live menu.
- **Browser refresh mid-order:** Cart state persists in localStorage, keyed by table + session, so a refresh doesn't wipe the customer's selections.
- **Customer double-submits by tapping "Place Order" twice quickly:** Same idempotency key approach as above — the button also disables immediately on first tap.
- **Customer closes the tab after ordering and can't see status anymore:** Not a real problem to solve fully without push notifications (no native app in this MVP) — mitigate by showing a persistent status link/QR reminder on the confirmation screen they can re-scan or bookmark.
- **Customer navigates back and re-submits an already-placed cart:** Once an order is placed, the cart clears from local state; "back" returns to an empty cart, not the submitted one.

## 5. Kitchen / Kiosk / Printing
- **Printer is offline, out of paper, or the print job fails:** The order still exists in Firestore regardless of print success — print is a side effect, never a dependency for order creation. Add a "Reprint" button and a visible "unprinted" badge on any ticket that hasn't confirmed printing.
- **Two orders arrive at the exact same moment:** Print jobs queue and process one at a time (whether via window.print() sequentially or a future PrintNode/CloudPRNT queue) — never fire two overlapping print calls.
- **Kitchen marks an order "Ready" but it never actually gets served:** Add a time-based staleness check — an order sitting in ready for longer than a set threshold (e.g. 10 minutes) gets visually flagged on the dashboard so staff notice.
- **Kiosk device loses network mid-shift:** Firestore's offline persistence caches reads/writes locally and auto-syncs on reconnect — but flag this in testing, since a kiosk that's offline for a while will "catch up" all at once, which needs to display sanely (not as a confusing burst).

## 6. Billing & Payment
- **Customer scans the UPI QR but cancels or the payment fails on their end:** Staff never marks "paid" from the QR display alone — the "Confirm Payment Received" tap is the only thing that sets paymentStatus: paid. If it fails, staff can regenerate the QR or switch the customer to cash.
- **Staff forgets to tap "Confirm Payment Received":** Add a "Payment Pending" section on the dashboard listing any table sitting in awaiting_confirmation for more than a few minutes, so it can't silently block the table from being reused.
- **Bill generated, then an item is added afterward:** Any cart change after a bill is generated invalidates the current bill and regenerates a fresh total — never let a stale bill amount get paid against an updated order.
- **Split bill among multiple people at one table:** Support splitting the total order into N sub-bills (equal split or by-item assignment) at checkout — each sub-bill gets its own QR/cash flow, and the table only frees once all sub-bills are marked paid.
- **Refund or void needed after marking paid (wrong order, complaint, walkout reversal):** No payment gateway means no automatic refund API — add a voided/refunded order status for record-keeping only; actual money movement (bank transfer back) happens outside the app, manually.
- **Coupon/discount applied twice, or an expired coupon gets used:** Validate coupon active + expiresAt server-side at the moment of applying, not just when it was first shown; enforce one active coupon per order.

## 7. Customer Data & Coupons
- **Customer enters a wrong or someone else's phone number:** No fully reliable fix without OTP verification (out of scope for MVP) — accept this as a known limitation; disputes are resolved by matching order timestamp + table instead of relying solely on phone accuracy.
- **Same phone number used by multiple family members / shared numbers:** Loyalty tracking is imperfect by design in this MVP — flag as accepted tradeoff, not a bug to chase.
- **Customer qualifies for more than one coupon at checkout:** Define an explicit priority order (e.g. highest discount % wins, or manual > first_time > repeat > lapsed) rather than stacking multiple discounts.
- **Customer wants to opt out of marketing after consenting once:** Provide a simple manual path for now — staff can flip marketingConsent to false for that phone on request; a fully self-serve unsubscribe flow can come later once actual outbound marketing (SMS/WhatsApp) is built.

## 8. Staff Accounts & Access
- **Staff device is shared and someone forgets to log out:** Auto-logout after a period of inactivity (e.g. 30–60 minutes) on the staff dashboard.
- **An employee leaves and shouldn't have access anymore:** Admin-only "deactivate staff account" toggle rather than deleting the account outright, preserving any audit trail tied to their actions (who marked what paid, who adjusted stock, etc.).
- **Two staff members edit the same order/table at once:** Same transaction-based writes as the table/order section — Firestore transactions prevent one edit from silently clobbering another.

## 9. System / Infrastructure
- **Wi-Fi drops on a staff or kiosk device mid-shift:** Firestore's built-in offline cache queues writes locally and syncs on reconnect — test this explicitly so a burst of delayed updates doesn't look like duplicate/confusing activity when it lands.
- **"Today's revenue" boundary at midnight:** Compute day boundaries using the cafe's actual local timezone, not UTC or the device's timezone, to avoid orders near midnight landing in the wrong day's total.
- **App is redeployed/updated while orders are actively in progress:** Firestore is the source of truth, not app memory — a redeploy shouldn't lose or corrupt in-flight orders as long as writes go through transactions rather than optimistic local-only state.
