import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const rulesPath = path.resolve(process.cwd(), 'firestore.rules');
const blueprintPath = path.resolve(process.cwd(), 'firebase-blueprint.json');
const rulesContent = fs.readFileSync(rulesPath, 'utf8');
const blueprint = JSON.parse(fs.readFileSync(blueprintPath, 'utf8'));

test('firestore.rules starts with rules_version 2 and default-deny safety net', () => {
  assert.match(rulesContent, /rules_version\s*=\s*'2';/);
  assert.match(rulesContent, /match\s*\/\{document=\*\*\}\s*\{\s*allow read, write: if false;/);
});

test('every collection in firebase-blueprint.json has a match block in firestore.rules', () => {
  const paths = Object.keys(blueprint.firestore);
  assert.ok(paths.length >= 4);
  for (const collectionPath of paths) {
    const collectionName = collectionPath.split('/')[1];
    assert.ok(
      rulesContent.includes(`match /${collectionName}/`),
      `Missing match block for /${collectionName}/`,
    );
  }
});

test('enforces verified email on bootstrapped admin and prevents email spoofing', () => {
  assert.ok(rulesContent.includes('request.auth.token.email_verified == true'));
  assert.ok(rulesContent.includes("request.auth.token.email == 'ahmdkhaaadd@gmail.com'"));
});

test('isolates order PII to admin reads and validates product price + active status on create', () => {
  const ordersBlock = rulesContent.slice(rulesContent.indexOf('match /orders/{orderId}'));
  assert.ok(ordersBlock.includes('allow get: if isValidId(orderId) && isAdmin();'));
  assert.ok(ordersBlock.includes('allow list: if isAdmin();'));
  assert.ok(ordersBlock.includes("incoming().status == 'new'"));
  assert.ok(ordersBlock.includes("data.paymentMethod == 'cod'") || rulesContent.includes("data.paymentMethod == 'cod'"));
  assert.ok(ordersBlock.includes('exists(/databases/$(database)/documents/products/$(incoming().productSlug))'));
  assert.ok(ordersBlock.includes(".data.status == 'active'"));
  assert.ok(ordersBlock.includes('.data.price == incoming().unitPrice'));
});

test('blocks shadow fields via hasAll + hasOnly and enforces server timestamps', () => {
  assert.ok(rulesContent.includes('data.keys().hasAll('));
  assert.ok(rulesContent.includes('data.keys().hasOnly('));
  assert.ok(rulesContent.includes('incoming().createdAt == request.time'));
  assert.ok(rulesContent.includes('incoming().updatedAt == request.time'));
  assert.ok(rulesContent.includes('incoming().diff(existing()).affectedKeys().hasOnly('));
});
