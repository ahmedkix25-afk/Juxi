export interface HeaderScrollState {
  hidden: boolean;
  scrolled: boolean;
  blurPx: number;
}

export interface ParallaxOffsets {
  blobA: number;
  blobB: number;
  blobC: number;
}

/**
 * Computes smart sticky header visibility and glass blur progression.
 * - Scrolls up or near top: visible.
 * - Fast scroll down past threshold: smoothly hides upward.
 * - Scrolled past 28px: increases blur from 12px to 24px and compacts header buttons to scale(0.94).
 */
export function computeHeaderScrollState(
  scrollY: number,
  prevScrollY: number,
  prevHidden: boolean,
): HeaderScrollState {
  const safeY = Math.max(0, scrollY);
  const delta = safeY - Math.max(0, prevScrollY);
  const scrolled = safeY > 28;
  const blurPx = scrolled ? 24 : 12;

  let hidden = prevHidden;
  if (safeY <= 56) {
    hidden = false;
  } else if (delta >= 12 && safeY > 110) {
    hidden = true;
  } else if (delta <= -4) {
    hidden = false;
  }

  return { hidden, scrolled, blurPx };
}

/**
 * Computes slow background blob parallax offsets (0.2–0.4 of scroll speed).
 * Clamped so fixed ambient blobs remain lush and visible even on long pages.
 */
export function computeParallaxOffsets(scrollY: number): ParallaxOffsets {
  const safeY = Math.max(0, scrollY);
  return {
    blobA: Math.round(Math.min(240, safeY * 0.24) * 10) / 10,
    blobB: Math.round(-Math.min(280, safeY * 0.36) * 10) / 10,
    blobC: Math.round(Math.min(200, safeY * 0.28) * 10) / 10,
  };
}

/**
 * Computes subtle diagonal reflection shift (-14% to +14%) from scroll position.
 */
export function computeScrollSheenShift(scrollY: number): number {
  const safeY = Math.max(0, scrollY);
  return Math.round(Math.sin(safeY * 0.0045) * 14 * 10) / 10;
}

/**
 * Computes staggered reveal delay (60–80ms per adjacent sibling, capped at 360ms).
 */
export function computeStaggerDelayMs(
  index: number,
  stepMs: number = 70,
  maxMs: number = 350,
): number {
  if (index <= 0) return 0;
  return Math.min(maxMs, Math.round(index * stepMs));
}
