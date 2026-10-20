/* Data-conversion arithmetic shared by the drills, the converter lab, the home-page demo and the tests.
   Convention (Lesson 10, slides 17 and 31): an N-bit converter over a span of Vfs has 2^N - 1 steps of Vfs / (2^N - 1)
   (8 bits over 10 V = 10/255 = 0.04 V; 10 bits over 10.23 V = 10 mV). Conversion truncates (floor). */
(function (root) {
  'use strict';
  const EPS = 1e-9;
  const levels = (n) => Math.pow(2, n) - 1;                     // largest code
  const step = (vfs, n) => vfs / levels(n);
  const clamp = (c, n) => Math.max(0, Math.min(levels(n), c));
  const code = (vin, vfs, n) => clamp(Math.floor(vin / step(vfs, n) + EPS), n);
  const dac = (c, vfs, n) => c * step(vfs, n);
  const flashComparators = (n) => levels(n);
  // comparator k (1..2^N-1) outputs 1 when Vin is at or above k steps: a thermometer code
  const thermometer = (vin, vfs, n) => Array.from({ length: levels(n) }, (_, k) => (vin / step(vfs, n) + EPS >= k + 1 ? 1 : 0));
  // successive approximation: try each bit from the MSB down, keep it when the DAC output does not exceed Vin
  function sar(vin, vfs, n) {
    let c = 0; const trials = [];
    for (let b = n - 1; b >= 0; b--) {
      const t = c | (1 << b), v = dac(t, vfs, n), keep = v <= vin + EPS * vfs;
      trials.push({ bit: b, trial: t, dacV: v, keep }); if (keep) c = t;
    }
    return { code: c, trials };
  }
  // single ramp: the counter climbs from 0 until the DAC ramp passes Vin; counts needed = the code + 1
  const rampCounts = (vin, vfs, n) => code(vin, vfs, n) + 1;
  const nyquistMin = (f) => 2 * f;
  const alias = (f, fs) => Math.abs(f - fs * Math.round(f / fs));      // apparent frequency of a sampled sine
  const droopTime = (vfs, n, droop) => (step(vfs, n) / 2) / droop;       // seconds for droop to reach half an LSB
  const vfCounts = (k, vin, t) => k * vin * t;                           // k in Hz per volt, t in s
  const dualSlopeVx = (vref, tref, T) => vref * tref / T;
  const flashRate = (tCompNs, tLogicNs) => 1000 / (tCompNs + tLogicNs);  // MHz
  const bin = (c, n) => c.toString(2).padStart(n, '0');
  const api = { levels, step, code, dac, flashComparators, thermometer, sar, rampCounts, nyquistMin, alias, droopTime, vfCounts, dualSlopeVx, flashRate, bin };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.ConvSys = api;
})(typeof window !== 'undefined' ? window : globalThis);
