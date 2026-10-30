/* Generators for PCB trace and clock/pulse arithmetic (Lesson 2).
   make() uses the textbook formula in cm; verify() redoes it a different way (inches, or a search) and the audit compares them. */

const RHO_CM = 1.68e-6;                   /* ohm-cm, copper at 20 C (slide 68; the practice exam uses the same figure) */
const MIL_CM = 0.00254, IN_CM = 2.54;
const sig = (x, n = 3) => Number(x.toPrecision(n));

/* ---- Voltage drop along a trace ---- */
const traceDrop = {
  make(rand) {
    const I = rand.pick([2, 4, 5, 8, 10]), len = rand.pick([2, 3, 4, 6]), w = rand.pick([25, 50, 100, 125, 250]), t = rand.pick([1, 1.4, 2]);
    const area = (w * MIL_CM) * (t * MIL_CM), R = RHO_CM * (len * IN_CM) / area, mv = sig(R * I * 1000);
    return {
      type: 'numeric', tolerance: 0.02, params: { I, len, w, t },
      prompt: `A copper trace is **${len} in** long, **${w} mil** wide and **${t} mil** thick (1 mil = 0.001 in) and carries **${I} A**. Using ρ = 1.68 x 10^-6 ohm-cm, what is the **voltage drop along the trace**, in millivolts? (Within 2% is fine.)`,
      answer: mv, display: `${mv} mV`,
      explain: `A = ${w} mil x ${t} mil, and 1 mil = 0.00254 cm, so A = ${(w * MIL_CM).toPrecision(3)} cm x ${(t * MIL_CM).toPrecision(3)} cm = ${area.toExponential(3)} cm^2. L = ${len} in x 2.54 = ${(len * IN_CM).toFixed(2)} cm. R = ρL/A = ${R.toPrecision(3)} ohm. V = IR = ${I} x ${R.toPrecision(3)} = **${mv} mV**.`,
    };
  },
  verify({ params: { I, len, w, t } }) {                       /* the same trace worked entirely in inches */
    const rhoIn = RHO_CM / IN_CM, R = rhoIn * len / ((w / 1000) * (t / 1000));
    return R * I * 1000;
  },
};

/* ---- Width needed for an allowed drop ---- */
const traceWidth = {
  make(rand) {
    const I = rand.pick([2, 4, 5, 8, 10]), len = rand.pick([2, 3, 4, 6]), t = rand.pick([1, 1.4, 2]), dv = rand.pick([50, 100, 150, 200]);
    const R = (dv / 1000) / I, area = RHO_CM * (len * IN_CM) / R, wmil = sig(area / (t * MIL_CM) / MIL_CM, 3);
    return {
      type: 'numeric', tolerance: 0.02, params: { I, len, t, dv },
      prompt: `A power trace must carry **${I} A** over **${len} in**, the copper is **${t} mil** thick, and the drop must be **no more than ${dv} mV**. Using ρ = 1.68 x 10^-6 ohm-cm, how wide must the trace be, in **mils**? (Within 2% is fine.)`,
      answer: wmil, display: `${wmil} mil`,
      explain: `R must be at most V/I = ${dv} mV / ${I} A = ${(R * 1000).toPrecision(3)} milliohm. From R = ρL/A, A = ρL/R = 1.68e-6 x ${(len * IN_CM).toFixed(2)} / ${R.toPrecision(3)} = ${area.toExponential(3)} cm^2. Width = A / thickness = ${area.toExponential(3)} / (${t} mil x 0.00254) = ${(area / (t * MIL_CM)).toPrecision(3)} cm = **${wmil} mil**.`,
    };
  },
  verify({ params: { I, len, t, dv } }) {                      /* search: narrowest width (0.01 mil steps) whose drop is within the limit */
    const rhoIn = RHO_CM / IN_CM;
    for (let w = 1; w < 100000; w += 0.01) {
      const drop = rhoIn * len / ((w / 1000) * (t / 1000)) * I * 1000;
      if (drop <= dv) return w;
    }
    return NaN;
  },
};

/* ---- Frequency from period ---- */
const freqFromPeriod = {
  make(rand) {
    const [val, unit, mult] = rand.pick([[2, 'ns', 1e-9], [4, 'ns', 1e-9], [5, 'ns', 1e-9], [8, 'ns', 1e-9], [20, 'ns', 1e-9], [0.5, 'us', 1e-6], [2, 'us', 1e-6], [250, 'ns', 1e-9], [10, 'us', 1e-6], [1, 'ms', 1e-3]]);
    const hz = 1 / (val * mult), mhz = sig(hz / 1e6, 6);
    return {
      type: 'numeric', tolerance: 0.001, params: { val, unit },
      prompt: `A clock has a period of **${val} ${unit === 'us' ? 'µs' : unit}**. What is its frequency in **MHz**?`,
      answer: mhz, display: `${mhz} MHz`,
      explain: `f = 1 / T = 1 / (${val} ${unit === 'us' ? 'µs' : unit}) = ${hz.toPrecision(4)} Hz = **${mhz} MHz**. (Quick check: a 1 ns period is 1 GHz, so a ${val} ns period is 1000 / ${val} MHz.)`,
    };
  },
  verify({ params: { val, unit } }) {                           /* count in nanoseconds: f(MHz) = 1000 / T(ns) */
    const ns = unit === 'ns' ? val : unit === 'us' ? val * 1000 : val * 1e6;
    return 1000 / ns;
  },
};

/* ---- Duty cycle ---- */
const dutyCycle = {
  make(rand) {
    const hi = rand.pick([10, 20, 25, 30, 40, 50, 60, 75]), lo = rand.pick([10, 20, 25, 30, 40, 50, 60, 75, 90, 150]);
    const duty = sig(hi / (hi + lo) * 100, 4);
    return {
      type: 'numeric', tolerance: 0.005, params: { hi, lo },
      prompt: `A clock is high for **${hi} ns** and low for **${lo} ns** in each cycle. What is its **duty cycle**, in percent?`,
      answer: duty, display: `${duty}%`,
      explain: `Duty cycle = t_high / (t_high + t_low) = ${hi} / (${hi} + ${lo}) = ${hi}/${hi + lo} = **${duty}%**.`,
    };
  },
  verify({ params: { hi, lo } }) { let total = 0; for (let i = 0; i < hi + lo; i++) total++; return (100 * hi) / total; },
};

export const generators = {
  'pcb.traceDrop': traceDrop, 'pcb.traceWidth': traceWidth,
  'clock.freqFromPeriod': freqFromPeriod, 'clock.dutyCycle': dutyCycle,
};
