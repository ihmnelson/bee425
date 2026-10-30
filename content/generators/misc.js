/* Generators for Lesson 1 and Lab 3: converter step size, Moore's law doubling, wait-state bus cycles, logic-analyzer resolution. */
const sig = (x, n = 3) => Number(x.toPrecision(n));

/* ---- A/D converter step size (the lecture's convention: full range / (2^n - 1)) ---- */
const adcStep = {
  make(rand) {
    const bits = rand.pick([8, 10, 12, 16]), vref = rand.pick([3.3, 5]);
    const mv = sig(vref * 1000 / (2 ** bits - 1), 3);
    return {
      type: 'numeric', tolerance: 0.01, params: { bits, vref },
      prompt: `A **${bits}-bit** A/D converter measures **0 to ${vref} V**. Using the lecture's convention (the range divided into 2^n - 1 steps), how big is one **step**, in millivolts?`,
      answer: mv, display: `${mv} mV`,
      explain: `A ${bits}-bit converter has 2^${bits} = ${2 ** bits} codes, so ${2 ** bits - 1} steps. Step = ${vref} V / ${2 ** bits - 1} = **${mv} mV**. (The lecture's Arduino example: 10 bits over 0-5 V is 1 part in 1023, about 5 mV.)`,
    };
  },
  verify({ params: { bits, vref } }) {                          /* count how many steps of size s fit in the range, refining s until it just covers it */
    const steps = 2 ** bits - 1; let lo = 0, hi = vref;
    for (let i = 0; i < 100; i++) { const s = (lo + hi) / 2; if (s * steps < vref) lo = s; else hi = s; }
    return lo * 1000;
  },
};

/* ---- Moore's law: doubling every 18 months ---- */
const moore = {
  make(rand) {
    const start = rand.pick([1, 2, 5, 10, 50]) * 1e6, years = rand.pick([3, 4.5, 6, 9, 12, 15]);
    const n = start * 2 ** (years / 1.5), out = sig(n / 1e6, 4);
    return {
      type: 'numeric', tolerance: 0.01, params: { start, years },
      prompt: `A chip has **${start / 1e6} million transistors**. If the count **doubles every 18 months**, how many millions of transistors will a chip have **${years} years** later?`,
      answer: out, display: `${out} million`,
      explain: `${years} years = ${years / 1.5} doubling periods of 18 months. Count = ${start / 1e6} million x 2^${years / 1.5} = **${out} million**.`,
    };
  },
  verify({ params: { start, years } }) { let n = start; for (let m = 0; m < years * 12; m += 18) n *= 2; return n / 1e6; },
};

/* ---- 68000-family bus cycle length with wait states, at a given clock ---- */
const waitStates = {
  make(rand) {
    const mhz = rand.pick([4, 8, 10, 12.5]), w = rand.int(0, 3);
    const ns = sig((4 + w) * 1000 / mhz, 4);
    return {
      type: 'numeric', tolerance: 0.005, params: { mhz, w },
      prompt: `A 68008 runs at **${mhz} MHz**. A normal bus cycle takes **4 clock periods** (states S0-S7), and each wait state adds **one more clock period**. With **${w} wait state${w === 1 ? '' : 's'}**, how long is one bus cycle, in ns?`,
      answer: ns, display: `${ns} ns`,
      explain: `Clock period = 1000 / ${mhz} = ${sig(1000 / mhz, 4)} ns. Bus cycle = (4 + ${w}) periods = ${4 + w} x ${sig(1000 / mhz, 4)} = **${ns} ns**.`,
    };
  },
  verify({ params: { mhz, w } }) { let t = 0; const period = 1000 / mhz; for (let c = 0; c < 4 + w; c++) t += period; return t; },
};

/* ---- Logic analyzer timing resolution ---- */
const laResolution = {
  make(rand) {
    const mhz = rand.pick([100, 200, 250, 400, 500]);
    const ns = sig(1000 / mhz, 3);
    return {
      type: 'numeric', tolerance: 0.001, params: { mhz },
      prompt: `A logic analyzer samples in timing mode at **${mhz} MHz**. What is the **time resolution** of an edge measurement (one sample period), in ns?`,
      answer: ns, display: `${ns} ns`,
      explain: `Resolution is one sample period = 1 / ${mhz} MHz = **${ns} ns**. (At the LogicPort's maximum 500 MHz that is 2 ns, which is why the lab says measurements are good to +/- 2 ns.)`,
    };
  },
  verify({ params: { mhz } }) { return 1 / (mhz * 1e6) * 1e9; },
};

/* ---- Logic analyzer: samples per processor clock ---- */
const statesPerClock = {
  make(rand) {
    const cpu = rand.pick([10, 20, 50, 100]), la = rand.pick([500, 1000, 2000]);
    const n = la / cpu, ns = sig(1000 / la, 3);
    return {
      type: 'numeric', params: { cpu, la },
      prompt: `A processor runs at **${cpu} MHz** and the logic analyzer samples in **timing mode** at **${la} MHz**. How many samples does the analyzer record in **each processor clock cycle**?`,
      answer: n, display: String(n),
      explain: `Samples per cycle = analyzer rate / processor rate = ${la} / ${cpu} = **${n}**. The timing resolution is one analyzer sample period, ${ns} ns. (The lecture's example: a 100 MHz processor with a 1 GHz analyzer gives 10 samples per cycle and about 1 ns resolution.)`,
    };
  },
  verify({ params: { cpu, la } }) { let n = 0; for (let k = 1; k * cpu <= la; k++) n++; return n; },       /* count whole analyzer samples that fit in one processor period */
};

/* ---- Trace buffer: states recorded before the trigger ---- */
const traceBuffer = {
  make(rand) {
    const depth = rand.pick([2, 4, 8, 16, 32]), pct = rand.pick([10, 25, 50, 75, 90]);
    const before = depth * pct / 100;
    return {
      type: 'numeric', params: { depth, pct },
      prompt: `A logic analyzer's circular trace buffer holds **${depth}M states**. The trigger point is set **${pct}%** of the way into the buffer. How many **millions of states are recorded before** the trigger?`,
      answer: before, display: `${before}M`,
      explain: `The buffer keeps overwriting old data until the trigger arrives; with the trigger ${pct}% of the way in, ${pct}% of the buffer holds states from **before** the trigger: ${depth}M x ${pct / 100} = **${before}M**, and the remaining ${depth - before}M are recorded after it. (The lecture's example: a 16M buffer with the trigger in the middle records 8M before and 8M after.)`,
    };
  },
  verify({ params: { depth, pct } }) { let n = 0; for (let k = 0; k < 100; k++) if (k < pct) n += depth / 100; return n; },
};

export const generators = { 'la.statesPerClock': statesPerClock, 'la.traceBuffer': traceBuffer, 'adc.stepSize': adcStep, 'trends.moore': moore, 'lab.waitStates': waitStates, 'lab.laResolution': laResolution };
