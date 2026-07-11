/**
 * Time source abstraction.
 *
 * The game engine depends on this small interface (`now(): number`, epoch ms)
 * instead of calling `Date.now()` directly. That inverts the dependency so
 * tests can drive time deterministically with `ManualClock` — no waiting on
 * the real wall clock.
 *
 * @typedef {{ now(): number }} Clock
 */

/**
 * Real time source backed by the system clock.
 * @implements {Clock}
 */
export class SystemClock {
  /** @returns {number} current time in epoch milliseconds */
  now() {
    return Date.now();
  }
}

/**
 * Deterministic, test-controlled clock. Interchangeable with `SystemClock`
 * (Liskov): both expose `now()`. Advance time explicitly to simulate ticks
 * and offline gaps without real delays.
 *
 * @implements {Clock}
 */
export class ManualClock {
  /** @param {number} [start=0] initial time in epoch milliseconds */
  constructor(start = 0) {
    this._now = start;
  }

  /** @returns {number} current (simulated) time in epoch milliseconds */
  now() {
    return this._now;
  }

  /**
   * Move time forward.
   * @param {number} ms milliseconds to advance
   * @returns {number} the new current time
   */
  advance(ms) {
    this._now += ms;
    return this._now;
  }

  /**
   * Set the current time to an absolute value.
   * @param {number} ms epoch milliseconds
   * @returns {number} the new current time
   */
  setTime(ms) {
    this._now = ms;
    return this._now;
  }
}
