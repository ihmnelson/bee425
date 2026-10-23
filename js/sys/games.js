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


  /* Design Drills: slides 36-61 (bandwidth, hysteresis, power, termination, cost) */
  const money = (x) => '$' + (Math.abs(x) >= 100 ? Math.round(x).toLocaleString('en-US') : x.toFixed(2));
  function designQ(level) {
    const kinds = level === 'easy' ? ['term', 'dead', 'harm', 'amort'] : level === 'medium' ? ['hw', 'amort', 'cmos', 'freq', 'term'] : ['hw', 'break', 'cmos', 'swdev'];
    const k = pick(kinds), R = CV;
    if (k === 'term') {
      const tr = pick([0.25, 0.5, 1, 2, 4]), tpr = pick([120, 150, 180]), L = R.termLen(tr, tpr);
      return build(`Logic edges have a rise time of ${tr} ns and signals propagate at ${tpr} ps per inch. Beyond what trace length should you terminate? (inches, ±2% accepted)`, [{ label: 'Length (in)', ans: L, tol: 0.02, ph: 'inches' }],
        `Length ≥ tR ÷ (2 × tPR) = ${tr * 1000} ps ÷ (2 × ${tpr} ps) = ${num(L)} inches. (Slide 49 gives 1.67 inches for 0.5 ns and 150 ps/in.)`);
    }
    if (k === 'dead') {
      const lo = pick([0.8, 1.0, 1.2, 1.5]), hi = lo + pick([0.4, 0.5, 0.8, 1.0, 1.2]);
      return build(`A Schmitt trigger switches high at ${num(hi)} V (rising) and low at ${num(lo)} V (falling). How wide is its deadband? (V)`, [{ label: 'Deadband (V)', ans: R.deadband(hi, lo), tol: 0.01, ph: 'volts' }],
        `Deadband = ${num(hi)} − ${num(lo)} = ${num(hi - lo)} V. Noise smaller than this cannot toggle the output; the price is that the circuit switches at two different input voltages.`);
    }
    if (k === 'harm') {
      const f0 = pick([110, 220, 440, 1000]), n = pick([3, 4, 5, 6]);
      return build(`A ${f0} Hz square wave is built from its first ${n} terms (odd harmonics only). What is the frequency of the highest term? (Hz)`, [{ label: 'Highest (Hz)', ans: R.oddHarmonic(f0, n), ph: 'Hz' }],
        `The terms are ${Array.from({ length: n }, (_, i) => R.oddHarmonic(f0, i + 1)).join(', ')} Hz; the highest is ${R.oddHarmonic(f0, n)} Hz. (Slide 36 uses 220 Hz and six terms: 2420 Hz.)`);
    }
    if (k === 'amort') {
      const nre = pick([525000, 300000, 750000]), vol = pick([1000, 10000, 500000]), v = R.perDevice(nre, vol);
      return build(`Development, foundry and tool costs total ${money(nre)}. Spread over ${vol.toLocaleString('en-US')} units, what is the cost per device? ($, ±1% accepted)`, [{ label: 'Per device ($)', ans: v, tol: 0.01, ph: 'dollars' }],
        `${money(nre)} ÷ ${vol.toLocaleString('en-US')} = $${num(v)} per device. (Slide 59: $525,000 gives $525 at 1,000 units and $1.05 at 500,000.)`);
    }
    if (k === 'hw') {
      const nre = pick([525000, 400000, 650000]), unit = pick([6, 9, 14]), vol = pick([1000, 20000, 500000]), t = R.hwTotal(nre, unit, vol);
      return build(`An ASIC has ${money(nre)} of one-off cost and each part costs $${unit}. What is the total hardware cost at ${vol.toLocaleString('en-US')} units? ($)`, [{ label: 'Total ($)', ans: t, tol: 0.001, ph: 'dollars' }],
        `${money(nre)} + ${vol.toLocaleString('en-US')} × $${unit} = ${money(t)}. (Slide 60: $525,000 + 500,000 × $6 = $3,525,000.)`);
    }
    if (k === 'cmos') {
      const v1 = pick([5, 3.3, 2.5]), v2 = pick([3.3, 2.5, 1.8, 1.2].filter((x) => x < v1)), r = R.cmosPowerRatio(v1, v2) * 100;
      return build(`A CMOS chip is moved from a ${v1} V supply to ${v2} V at the same clock and activity. What percentage of its old power does it dissipate now? (%, ±2% accepted)`, [{ label: 'Power (%)', ans: r, tol: 0.02, ph: '%' }],
        `Power falls as Vcc squared: (${v2} ÷ ${v1})² = ${num(r / 100)}, so ${num(r)}% of the old power. (Slide 46.)`);
    }
    if (k === 'freq') {
      const p0 = pick([0.1, 0.2, 0.5]), f1 = pick([4, 8, 10]), f2 = f1 * pick([2, 3, 4]);
      return build(`A CMOS part dissipates ${p0} W at ${f1} MHz. Assuming power rises linearly with clock frequency (slide 46), what does it dissipate at ${f2} MHz? (W)`, [{ label: 'Power (W)', ans: p0 * f2 / f1, tol: 0.01, ph: 'watts' }],
        `${p0} W × ${f2} ÷ ${f1} = ${num(p0 * f2 / f1)} W. (Real parts only approximate this: slide 42's 68K goes from 0.13 W at 8 MHz to 0.38 W at 20 MHz.)`);
    }
    if (k === 'swdev') {
      const dev = pick([300000, 450000, 600000]), vol = pick([1000, 50000, 500000]);
      return build(`A software solution costs ${money(dev)} to develop and adds nothing per unit. What is the development cost per device at ${vol.toLocaleString('en-US')} units? ($)`, [{ label: 'Per device ($)', ans: dev / vol, tol: 0.01, ph: 'dollars' }],
        `${money(dev)} ÷ ${vol.toLocaleString('en-US')} = $${num(dev / vol)}. (Slide 60: $300,000 gives $300 at 1,000 units and $0.60 at 500,000.)`);
    }
    // break-even: hypothetical model, stated in the question
    const nre = pick([525000, 400000]), dev = pick([300000, 150000]), unit = pick([6, 8]), extra = unit + pick([4, 5, 10]);
    const be = R.breakEven(nre, dev, extra, unit);
    return build(`Hypothetical: the ASIC costs ${money(nre)} one-off plus $${unit} per unit. The software solution costs ${money(dev)} to develop but needs a bigger processor that adds $${extra} per unit. At what volume are the two total costs equal? (units, ±1% accepted)`, [{ label: 'Break-even (units)', ans: be, tol: 0.01, ph: 'units' }],
      `Set ${money(nre)} + ${unit}V = ${money(dev)} + ${extra}V, so V = (${nre} − ${dev}) ÷ (${extra} − ${unit}) = ${Math.round(be).toLocaleString('en-US')} units. Below this the software solution is cheaper; above it the ASIC wins. (This model is ours, not the slide's, where software adds no per-unit cost.)`);
  }

  function quizQ(worldId) {
    const Q = QUEST();
    const pool = worldId ? Q.QUIZ.filter((q) => q.world === worldId) : Q.QUIZ;
    const q = pick(pool), opts = shuffle([q.correct, ...q.wrong]);
    return { kind: 'choice', prompt: q.q, options: opts, answer: opts.indexOf(q.correct), detail: esc(q.why), world: q.world };
  }

  const api = { convertQ, designQ, quizQ, shuffle, pick, esc };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.Games = api;
})(typeof window !== 'undefined' ? window : globalThis);
