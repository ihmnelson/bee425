/* Question generators for the Systems section. convertQ(level) makes a fresh numeric question about data conversion;
   every answer comes from js/sys/conv.js, so tests/sys/check-content.js can recompute them. */
(function (root) {
  'use strict';
  const CV = root.ConvSys || require('./conv.js');
  const rnd = (n) => Math.floor(Math.random() * n);
  const pick = (a) => a[rnd(a.length)];
  const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const num = (x, d) => Number(x.toPrecision(d || 4)).toString();
  const QUEST = () => root.QUEST;                  // the open pack's data (tests set it up before calling)

  // fields: [{label, ans, tol, ph}]; tol is a fraction (0 means exact)
  const build = (prompt, fields, detail, info) => ({
    kind: 'fields', prompt, info: info || '', fields: fields.map((f) => ({ label: f.label, ph: f.ph || '' })),
    grade(v) {
      const bad = [];
      fields.forEach((f, i) => {
        const x = parseFloat(String(v[i]).replace(/[,\s]/g, ''));
        if (!(Math.abs(x - f.ans) <= Math.abs(f.ans) * (f.tol || 0) + 1e-12)) bad.push(i);
      });
      return { ok: !bad.length, bad, detail };
    },
  });

  function convertQ(level) {
    const kinds = level === 'easy' ? ['step', 'comps', 'dacmax', 'nyq'] : level === 'medium' ? ['code', 'dacv', 'vf', 'flash', 'step'] : ['droop', 'dual', 'alias', 'sar', 'slew'];
    const k = pick(kinds);
    const R = CV;
    if (k === 'step') {
      const n = pick([8, 10, 12, 16]), vfs = pick([5, 10]), s = R.step(vfs, n) * 1000;
      return build(`An ${n}-bit converter spans 0 to ${vfs} V. What is the voltage of one step? (mV, ±2% accepted)`, [{ label: 'Step (mV)', ans: s, tol: 0.02, ph: 'mV' }],
        `${vfs} V ÷ (2^${n} − 1) = ${vfs} ÷ ${R.levels(n).toLocaleString()} = ${num(s)} mV. (The course divides by 2^N − 1, as in the 8-bit 10/255 example.)`);
    }
    if (k === 'comps') {
      const n = pick([2, 3, 4, 6, 8]);
      return build(`How many comparators does a ${n}-bit flash converter need?`, [{ label: 'Comparators', ans: R.flashComparators(n), ph: 'count' }],
        `2^${n} − 1 = ${R.flashComparators(n)}. Their outputs form a "thermometer code".`);
    }
    if (k === 'dacmax') {
      const n = pick([3, 4, 5, 6]), i = pick([0.05, 0.1, 0.2]), r = pick([1, 2, 5]);
      const vmax = (R.levels(n)) * i * r;
      return build(`A ${n}-bit binary-weighted D/A uses i = ${i} mA and R = ${r} kΩ (as on the slide). What is the output with every bit set? (V)`, [{ label: 'Vmax (V)', ans: vmax, tol: 0.01, ph: 'volts' }],
        `Currents add to (2^${n} − 1)·i = ${R.levels(n)} × ${i} mA = ${num(R.levels(n) * i)} mA; × ${r} kΩ = ${num(vmax)} V. One step is i × R = ${num(i * r)} V.`);
    }
    if (k === 'nyq') {
      const f = pick([2, 5, 10, 20, 44, 100]);
      return build(`A ${f} kHz sine wave is to be digitised without aliasing. What is the minimum sampling rate? (kHz)`, [{ label: 'fs (kHz)', ans: R.nyquistMin(f), ph: 'kHz' }],
        `At least two samples per cycle: 2 × ${f} = ${2 * f} kHz. In practice you sample somewhat faster.`);
    }
    if (k === 'code') {
      const n = pick([4, 6, 8]), s = pick([10, 20, 50, 100]) / 1000, vfs = R.levels(n) * s, c = 1 + rnd(R.levels(n) - 1), f = pick([0.2, 0.35, 0.5, 0.65, 0.8]);
      const vin = (c + f) * s;
      return build(`An ${n}-bit converter spans 0 to ${num(vfs)} V (one step = ${num(s * 1000)} mV). The input is ${num(vin, 5)} V. What decimal code does it output?`, [{ label: 'Code', ans: c, ph: 'decimal' }],
        `${num(vin, 5)} V ÷ ${num(s)} V = ${num(vin / s, 5)}, truncated to ${c}. (Binary ${R.bin(c, n)}.)`);
    }
    if (k === 'dacv') {
      const n = 4, s = pick([0.1, 0.2, 0.25]), vfs = R.levels(n) * s, c = 1 + rnd(14);
      return build(`A 4-bit D/A converter has full scale ${num(vfs)} V (${num(s)} V per step). What is its output for code ${c.toString(2).padStart(4, '0')}B? (V)`, [{ label: 'Vout (V)', ans: c * s, tol: 0.01, ph: 'volts' }],
        `Code ${c} × ${num(s)} V = ${num(c * s)} V.`);
    }
    if (k === 'vf') {
      const kk = pick([10, 50, 100]), v = pick([2, 5, 8]), t = pick([1, 10, 100]);
      return build(`A V/F converter gives ${kk} kHz per volt. Its input is ${v} V and the pulses are counted for ${t} s. How many counts?`, [{ label: 'Counts', ans: R.vfCounts(kk * 1000, v, t), ph: 'count' }],
        `Fout = ${kk} kHz/V × ${v} V = ${kk * v} kHz; × ${t} s = ${R.vfCounts(kk * 1000, v, t).toLocaleString()} counts. (The longer the window, the more noise is averaged out and the finer the result.)`);
    }
    if (k === 'flash') {
      const a = pick([1, 2, 4]), b = pick([1, 2, 3]);
      return build(`A flash converter's comparators settle in ${a} ns and its decode logic takes ${b} ns. How many conversions per second, in MHz?`, [{ label: 'Rate (MHz)', ans: R.flashRate(a, b), tol: 0.01, ph: 'MHz' }],
        `${a} + ${b} = ${a + b} ns per conversion, so 1 ÷ ${a + b} ns = ${num(R.flashRate(a, b))} MHz.`);
    }
    if (k === 'droop') {
      const n = pick([8, 10, 12]), s = pick([5, 10]) / 1000, vfs = R.levels(n) * s, dr = pick([0.5, 1, 2]);   // V/ms
      const t = R.droopTime(vfs, n, dr * 1000) * 1e6;
      return build(`A ${n}-bit converter spans 0 to ${num(vfs)} V (${num(s * 1000)} mV per count). The sample-and-hold droops ${dr} V/ms. How long may the conversion take if droop error must not exceed ½ LSB? (µs)`, [{ label: 'Time (µs)', ans: t, tol: 0.02, ph: 'µs' }],
        `½ LSB = ${num(s * 500)} mV = ${num(s / 2)} V. Time = ${num(s / 2)} V ÷ ${dr} V/ms = ${num(t)} µs. (Slide 31 does this for 10 mV and 1 V/ms: 5 µs.)`);
    }
    if (k === 'dual') {
      const vref = pick([5, 10]), T = pick([100, 200]), frac = pick([0.2, 0.35, 0.5, 0.8, 0.9]), tref = T * frac;
      const vx = R.dualSlopeVx(vref, tref, T);
      return build(`Dual-slope A/D: the unknown is counted for T = ${T} ms; counting down against Vref = ${vref} V takes tref = ${num(tref)} ms. What is Vx? (V)`, [{ label: 'Vx (V)', ans: vx, tol: 0.01, ph: 'volts' }],
        `Vx·T = Vref·tref, so Vx = ${vref} × ${num(tref)} ÷ ${T} = ${num(vx)} V.`);
    }
    if (k === 'alias') {
      const fs = pick([8, 10, 20, 50]), d = pick([0, 1, 2, 3]), f = rnd(2) ? fs + d : fs - d;
      const fa = R.alias(f, fs);
      return build(`A ${f} kHz sine wave is sampled at ${fs} kHz. At what frequency does the sampled signal appear? (kHz; 0 means a constant voltage)`, [{ label: 'Apparent f (kHz)', ans: fa, tol: 0, ph: 'kHz' }],
        `${f} kHz is above half the sample rate (${fs / 2} kHz), so it folds down: |${f} − ${fs}| = ${fa} kHz. (Beyond the slides: slide 34 shows the case f = fs, which looks like a constant voltage.)`);
    }
    if (k === 'sar') {
      const n = pick([4, 5, 6]), s = pick([0.1, 0.2]), vfs = R.levels(n) * s, c = 1 + rnd(R.levels(n) - 1), vin = (c + 0.5) * s, r = R.sar(vin, vfs, n);
      return build(`A ${n}-bit successive-approximation converter spans 0 to ${num(vfs)} V (${num(s)} V per step). Vin = ${num(vin, 4)} V. What decimal code results, and how many trials (comparisons) does it make?`,
        [{ label: 'Code', ans: r.code, ph: 'decimal' }, { label: 'Trials', ans: n, ph: 'count' }],
        `Trying bits MSB first: ${r.trials.map((t) => `${R.bin(t.trial, n)}${t.keep ? ' keep' : ' drop'}`).join(', ')}. Result ${R.bin(r.code, n)}B = ${r.code}, after ${n} trials, one per bit.`);
    }
    const slew = pick([100, 500, 1000, 2000]), tc = pick([0.1, 0.5, 1, 2]);
    return build(`An input changes at ${slew} V/s and there is no sample-and-hold. The conversion takes ${tc} ms. By how much can the input move during the conversion? (V)`, [{ label: 'Change (V)', ans: slew * tc / 1000, tol: 0.01, ph: 'volts' }],
      `${slew} V/s × ${tc} ms = ${num(slew * tc / 1000)} V. (Slide 26 asks this for 1000 V/s and 1 ms: 1 V.) A sample-and-hold freezes the input so the converter sees one value.`);
  }

  function quizQ(worldId) {
    const Q = QUEST();
    const pool = worldId ? Q.QUIZ.filter((q) => q.world === worldId) : Q.QUIZ;
    const q = pick(pool), opts = shuffle([q.correct, ...q.wrong]);
    return { kind: 'choice', prompt: q.q, options: opts, answer: opts.indexOf(q.correct), detail: esc(q.why), world: q.world };
  }

  const api = { convertQ, quizQ, shuffle, pick, esc };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.Games = api;
})(typeof window !== 'undefined' ? window : globalThis);
