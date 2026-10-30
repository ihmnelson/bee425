/* Generators for data conversion, noise, power and cost arithmetic (Lesson 10). verify() works each one a different way. */
const sig = (x, n = 3) => Number(x.toPrecision(n));

const flashComparators = {
  make(rand) {
    const n = rand.pick([2, 3, 4, 6, 8, 10]);
    return { type: 'numeric', params: { n }, prompt: `How many **comparators** does an **${n}-bit flash A/D converter** need?`, answer: 2 ** n - 1, display: String(2 ** n - 1),
      explain: `An N-bit flash converter needs 2^N - 1 comparators: 2^${n} - 1 = **${2 ** n - 1}**. Each comparator tests one threshold; the output is a thermometer code that an encoder turns into binary.` };
  },
  verify({ params: { n } }) { let thresholds = 0; for (let code = 1; code < 2 ** n; code++) thresholds++; return thresholds; },   /* one threshold between each pair of adjacent codes */
};

const flashRate = {
  make(rand) {
    const c = rand.pick([0.5, 1, 2, 4]), l = rand.pick([0.5, 1, 2, 3]);
    const mhz = sig(1000 / (c + l), 4);
    return { type: 'numeric', tolerance: 0.005, params: { c, l }, prompt: `In a flash converter the comparators take **${c} ns** to respond and the decoding logic takes **${l} ns**. How many conversions per second can it make, in **MHz**?`, answer: mhz, display: `${mhz} MHz`,
      explain: `One conversion takes ${c} + ${l} = ${sig(c + l, 3)} ns, so the rate is 1000 / ${sig(c + l, 3)} = **${mhz} MHz**. (The lecture's case: 1 ns + 1 ns = 2 ns, or 500 MHz.)` };
  },
  verify({ params: { c, l } }) { return 1 / ((c + l) * 1e-9) / 1e6; },
};

const dacOutput = {
  make(rand) {
    const code = rand.int(1, 15), i = rand.pick([0.05, 0.1, 0.2]), r = rand.pick([1, 2, 5]);
    const v = sig(code * i * r, 3);
    return { type: 'numeric', tolerance: 0.005, params: { code, i, r }, prompt: `A 4-bit D/A converter sums binary-weighted currents (i, 2i, 4i, 8i) with **i = ${i} mA** into **R = ${r} kΩ**. What is the output voltage for the input code **${code}** (binary ${code.toString(2).padStart(4, '0')}), in volts?`, answer: v, display: `${v} V`,
      explain: `The total current is ${code} x ${i} mA = ${sig(code * i, 3)} mA. V = I x R = ${sig(code * i, 3)} mA x ${r} kΩ = **${v} V**. (Maximum, at code 15, is ${sig(15 * i * r, 3)} V; each step is ${sig(i * r, 3)} V. The lecture's case: i = 0.1 mA, R = 1 kΩ gives 1.5 V and 0.1 V steps.)` };
  },
  verify({ params: { code, i, r } }) { let mA = 0; for (let b = 0; b < 4; b++) if ((code >> b) & 1) mA += i * 2 ** b; return mA * r; },
};

const rampTime = {
  make(rand) {
    const n = rand.pick([8, 10, 12, 16]), mhz = rand.pick([1, 10, 100]);
    const us = sig(2 ** n / mhz, 4);
    return { type: 'numeric', tolerance: 0.005, params: { n, mhz }, prompt: `A **single-ramp** A/D converter is ${n} bits and its counter runs at **${mhz} MHz**. In the worst case (full-scale input) how long does one conversion take, in **µs**? (It counts through all 2^${n} codes.)`, answer: us, display: `${us} µs`,
      explain: `Worst case it counts 2^${n} = ${2 ** n} steps at ${mhz} MHz: ${2 ** n} / ${mhz} = **${us} µs**. The conversion time depends on the input voltage, which is the problem with the single ramp: it is not deterministic, and each added bit doubles the worst-case time.` };
  },
  verify({ params: { n, mhz } }) { let t = 0; for (let k = 0; k < 2 ** n; k++) t += 1 / mhz; return t; },
};

const vfCounts = {
  make(rand) {
    const k = rand.pick([10, 50, 100, 200]), vin = rand.pick([1, 2.5, 5, 10]), t = rand.pick([0.1, 1, 10]);
    const c = k * 1000 * vin * t;
    return { type: 'numeric', tolerance: 0.001, params: { k, vin, t }, prompt: `A voltage-to-frequency converter gives **${k} kHz per volt**. With **${vin} V** at the input, how many pulses are counted in **${t} s**?`, answer: c, display: c.toLocaleString('en-US'),
      explain: `Fout = ${k} kHz/V x ${vin} V = ${k * vin} kHz. Counts = ${k * vin * 1000} Hz x ${t} s = **${c.toLocaleString('en-US')}**. A longer count window averages out more noise. (The lecture: 100 kHz/V and 5 V is 500 kHz, so 500,000 counts in 1 s.)` };
  },
  verify({ params: { k, vin, t } }) { let n = 0; const pulses = k * 1000 * vin * t; for (let s = 0; s < 1; s++) n += pulses; return n; },
};

const dualSlope = {
  make(rand) {
    const vref = rand.pick([5, 10]), tref = rand.pick([20, 50, 100]), T = rand.pick([100, 200]);
    const vx = sig(vref * tref / T, 4);
    return { type: 'numeric', tolerance: 0.005, params: { vref, tref, T }, prompt: `In a dual-slope converter the unknown input is integrated for a fixed time **T = ${T} ms**. Then the **${vref} V** reference takes **${tref} ms** to bring the count back to zero. What is the unknown voltage Vx, in volts?`, answer: vx, display: `${vx} V`,
      explain: `The two areas are equal: Vx x T = Vref x t_ref, so Vx = ${vref} x ${tref} / ${T} = **${vx} V**.` };
  },
  verify({ params: { vref, tref, T } }) { return (vref * tref) / T; },
};

const droop = {
  make(rand) {
    const n = rand.pick([8, 10, 12]), lsbMv = rand.pick([5, 10, 20]), rate = rand.pick([0.5, 1, 2]);
    const us = sig((lsbMv / 2) / (rate * 1000) * 1000, 4);
    return { type: 'numeric', tolerance: 0.005, params: { n, lsbMv, rate }, prompt: `A ${n}-bit A/D converter has one LSB equal to **${lsbMv} mV**. The sample-and-hold droops at **${rate} V per millisecond**. How long can the conversion take, in **µs**, if the droop error must stay below **half an LSB**?`, answer: us, display: `${us} µs`,
      explain: `Half an LSB = ${lsbMv / 2} mV. Time = ${lsbMv / 2} mV / (${rate} V/ms) = ${(lsbMv / 2) / 1000} V / ${rate * 1000} V/s = **${us} µs**. (The lecture: 5 mV at 1 V/ms is 5 µs.)` };
  },
  verify({ params: { lsbMv, rate } }) { let t = 0; while (rate * t < lsbMv / 2 - 1e-9) t += 0.001; return t; },   /* t in us: droop in mV = (V/ms) x us; step until it reaches half an LSB */
};

const aliasFreq = {
  make(rand) {
    const fs = rand.pick([100, 200, 1000, 8000]), f = rand.pick([0.15, 0.3, 0.55, 0.8, 1.3, 1.7].map((x) => Math.round(x * fs)));
    const a = Math.abs(f - fs * Math.round(f / fs));
    return { type: 'numeric', params: { fs, f }, prompt: `A sine wave of **${f} Hz** is sampled at **${fs} Hz**. What **apparent frequency** (in Hz, between 0 and ${fs / 2}) appears in the samples?`, answer: a, display: `${a} Hz`,
      explain: `Sampling at ${fs} Hz can only represent frequencies up to ${fs / 2} Hz (the Nyquist limit). The apparent frequency is the distance from ${f} Hz to the nearest multiple of ${fs}: |${f} - ${fs} x ${Math.round(f / fs)}| = **${a} Hz**. ${f <= fs / 2 ? 'Here the signal is below the limit, so it appears unchanged.' : 'The signal is above the limit, so it aliases.'}` };
  },
  verify({ params: { fs, f } }) { let best = Infinity; for (let m = 0; m <= f / fs + 2; m++) best = Math.min(best, Math.abs(f - m * fs)); return best; },
};

const cmosPower = {
  make(rand) {
    const p = rand.pick([0.5, 1, 2, 5]), v1 = rand.pick([5, 3.3]), v2 = rand.pick([5, 3.3, 2.5, 1.8].filter((x) => x !== v1)), f1 = rand.pick([8, 16, 20]), f2 = rand.pick([8, 16, 20, 40]);
    const out = sig(p * (v2 / v1) ** 2 * (f2 / f1), 3);
    return { type: 'numeric', tolerance: 0.01, params: { p, v1, v2, f1, f2 }, prompt: `A CMOS chip dissipates **${p} W** at **${v1} V** and **${f1} MHz**. Using the lecture's rules (power goes as **Vcc squared** and **linearly with clock frequency**), how much power does it dissipate at **${v2} V** and **${f2} MHz**, in watts?`, answer: out, display: `${out} W`,
      explain: `Voltage factor = (${v2} / ${v1})^2 = ${sig((v2 / v1) ** 2, 4)}. Frequency factor = ${f2} / ${f1} = ${sig(f2 / f1, 4)}. Power = ${p} x ${sig((v2 / v1) ** 2, 4)} x ${sig(f2 / f1, 4)} = **${out} W**.` };
  },
  verify({ params: { p, v1, v2, f1, f2 } }) { return p * (v2 * v2 / (v1 * v1)) * (f2 / f1); },
};

const termLength = {
  make(rand) {
    const tr = rand.pick([0.25, 0.5, 1, 2, 5]), tpr = rand.pick([140, 150, 170]);
    const inch = sig(tr * 1000 / (2 * tpr), 3);
    return { type: 'numeric', tolerance: 0.01, params: { tr, tpr }, prompt: `A logic edge has a **${tr} ns** rise time and signals propagate at **${tpr} ps per inch**. Using the lecture's rule (terminate when length >= tR / (2 x tPR)), what is the **shortest trace length (inches)** that should be terminated?`, answer: inch, display: `${inch} in`,
      explain: `Length >= ${tr * 1000} ps / (2 x ${tpr} ps/in) = **${inch} in**. (The lecture: 0.5 ns and 150 ps/in give 1.67 inches.)` };
  },
  verify({ params: { tr, tpr } }) { let len = 0; while (2 * tpr * len < tr * 1000) len += 0.001; return len; },
};

const costTotal = {
  make(rand) {
    const nre = rand.pick([300, 525, 750]) * 1000, unit = rand.pick([6, 14, 25]), vol = rand.pick([1000, 10000, 500000]);
    const total = nre + unit * vol, perDevice = sig(total / vol, 4);
    const ask = rand.pick(['total', 'per']);
    return { type: 'numeric', tolerance: 0.005, params: { nre, unit, vol, ask }, prompt: `A hardware solution has **$${nre.toLocaleString('en-US')}** of one-time (NRE and tool) cost and **$${unit}** per unit. For **${vol.toLocaleString('en-US')} units**, what is the ${ask === 'total' ? '**total cost** in dollars' : '**cost per device** (total divided by volume) in dollars'}?`, answer: ask === 'total' ? total : perDevice, display: ask === 'total' ? `$${total.toLocaleString('en-US')}` : `$${perDevice}`,
      explain: `Total = ${nre.toLocaleString('en-US')} + ${unit} x ${vol.toLocaleString('en-US')} = $${total.toLocaleString('en-US')}. Per device = total / volume = **$${perDevice}**. At low volume the fixed cost dominates; at high volume the unit cost does.` };
  },
  verify({ params: { nre, unit, vol, ask } }) { let total = nre; for (let k = 0; k < 10; k++) total += unit * vol / 10; return ask === 'total' ? total : total / vol; },
};

export const generators = { 'conv.flashComparators': flashComparators, 'conv.flashRate': flashRate, 'conv.dacOutput': dacOutput, 'conv.rampTime': rampTime, 'conv.vfCounts': vfCounts, 'conv.dualSlope': dualSlope, 'conv.droop': droop, 'conv.alias': aliasFreq, 'conv.cmosPower': cmosPower, 'conv.termLength': termLength, 'conv.costTotal': costTotal };
