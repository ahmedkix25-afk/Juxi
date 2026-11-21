# Security Specification & Threat Model

## 1. Data Invariants
1. **Product Visibility**: Public visitors can `get` or `list` `/products/{productSlug}` ONLY when `resource.data.status == 'active'`. Hidden products are strictly invisible to non-admins.
2. **Product Ownership & Integrity**: Only verified admins (`isAdmin()`) may create, update, or delete `/products/{productSlug}`. Every product's `slug` field MUST match its document ID `productSlug`, `createdBy` MUST match `request.auth.uid` on create and remain immutable on update, and `createdAt` is immutable (`request.time` on create).
3. **Order PII Isolation**: `/orders/{orderId}` contains customer PII (`customerName`, `customerPhone`, `address`). Public/unauthenticated users and non-admin signed-in users are strictly forbidden from reading (`get` or `list`), updating, or deleting orders.
4. **Order Non-Orphan & Price Integrity**: Public customers may `create` an order in `/orders/{orderId}` ONLY when:
   - The referenced `/products/{productSlug}` exists AND has `status == 'active'`.
   - `unitPrice` strictly equals the product's current `price`.
   - `totalPrice == unitPrice * quantity` with `quantity` in `1..99`.
   - `status == 'new'` and `paymentMethod == 'cod'`.
   - `createdAt == request.time` and `updatedAt == request.time`.
5. **Admin Settings & RBAC Protection**: `/settings/{settingId}` and `/admins/{adminUid}` are strictly read/write locked to `isAdmin()`. Users cannot self-assign admin privileges.

## 2. The "Dirty Dozen" Adversarial Payloads (Must Return PERMISSION_DENIED)
1. **Unverified Admin Email Spoof**: Signed-in user with `email == 'ahmdkhaaadd@gmail.com'` and `email_verified == false` tries to list `/orders`.
2. **PII Leak Attempt**: Signed-in non-admin user tries to `get` `/orders/ord_123`.
3. **Hidden Product Scraping**: Public visitor tries to `get` `/products/secret-draft` where `status == 'hidden'`.
4. **Price Tampering on Order Create**: Customer submits `unitPrice: 1, totalPrice: 1` for a product whose price is `499`.
5. **Orphan Order Creation**: Customer submits order referencing non-existent `productSlug: 'ghost-product'`.
6. **Status Forgery on Order Create**: Customer submits order with `status: 'delivered'` instead of `'new'`.
7. **Shadow Field Injection on Order Create**: Customer adds `isPaid: true` ghost field to order payload.
8. **Shadow Field Injection on Product Update**: Admin sends extra `featuredRank: 999` ghost field during product update.
9. **Immutable Timestamp Tampering**: Admin tries to alter `createdAt` during an order status update.
10. **Self-Privilege Escalation**: Non-admin user tries to create `/admins/{theirUid}` with `{ role: 'admin' }`.
11. **ID Poisoning**: Attacker attempts to create `/orders/` with a 200-char junk document ID containing invalid characters.
12. **Array / Payload Exhaustion**: Attacker submits a product with 25 images or a 5,000-character customer name.
