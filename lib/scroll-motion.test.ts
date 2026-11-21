import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeHeaderScrollState,
  computeParallaxOffsets,
  computeScrollSheenShift,
  computeStaggerDelayMs,
  stepDampedValue,
} from './scroll-motion';

test('computeHeaderScrollState switches blur 12px -> 24px and hides on fast scroll down', () => {
  const topState = computeHeaderScrollState(0, 0, false);
  assert.deepEqual(topState, { hidden: false, scrolled: false, blurPx: 12 });

  const gentleScroll = computeHeaderScrollState(60, 52, false);
  assert.deepEqual(gentleScroll, { hidden: false, scrolled: true, blurPx: 24 });

  const fastDown = computeHeaderScrollState(240, 210, false);
  assert.deepEqual(fastDown, { hidden: true, scrolled: true, blurPx: 24 });

  const scrollUp = computeHeaderScrollState(220, 240, true);
  assert.deepEqual(scrollUp, { hidden: false, scrolled: true, blurPx: 24 });
});

test('computeParallaxOffsets moves blobs at 0.2–0.4 scroll speed and clamps extremes', () => {
  const at100 = computeParallaxOffsets(100);
  assert.equal(at100.blobA, 24);
  assert.equal(at100.blobB, -36);
  assert.equal(at100.blobC, 28);

  const clamped = computeParallaxOffsets(5000);
  assert.equal(clamped.blobA, 240);
  assert.equal(clamped.blobB, -280);
  assert.equal(clamped.blobC, 200);
});

test('stepDampedValue smoothly approaches target and settles cleanly within epsilon', () => {
  const firstStep = stepDampedValue(0, 100, 0.25, 0.15);
  assert.equal(firstStep.value, 25);
  assert.equal(firstStep.settled, false);

  const snapped = stepDampedValue(99.9, 100, 0.25, 0.15);
  assert.equal(snapped.value, 100);
  assert.equal(snapped.settled, true);
});

test('computeScrollSheenShift stays bounded within -14%..14%', () => {
  for (const y of [0, 120, 350, 900, 2400]) {
    const shift = computeScrollSheenShift(y);
    assert.ok(shift >= -14 && shift <= 14);
  }
});

test('computeStaggerDelayMs applies brisk 45ms stagger and caps at 180ms', () => {
  assert.equal(computeStaggerDelayMs(0), 0);
  assert.equal(computeStaggerDelayMs(1), 45);
  assert.equal(computeStaggerDelayMs(3), 135);
  assert.equal(computeStaggerDelayMs(12), 180);
});
