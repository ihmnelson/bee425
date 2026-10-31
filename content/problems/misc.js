/* Mock-exam problems that are not tied to the cores: trace width at temperature (practice Problem 1), true/false with reasons
   (Problem 2) and short discussion (Problem 4, self-graded against a model answer and rubric). */

/* ---- trace width when resistivity depends on temperature ---- */
const traceTemp = {
  id: 'trace-temp',
  title: 'Power trace width at low temperature',
  concepts: ['pcb-design.trace-resistance'],
  conventions: 'rho(T) = 5.67 x 10^-9 T + 1.58 x 10^-8 ohm-cm with T in kelvin (as given in the practice problem); 1 in = 2.54 cm; 1 mil = 0.001 in. The answer is the narrowest trace whose voltage drop does not exceed the limit, and is accepted within 1%.',
  make(r) {
    const T = r.pick([60, 77, 90, 120, 150, 200]), I = r.pick([2, 4, 5, 6, 8, 10]), len = r.pick([2, 3, 4, 5, 6]), t = r.pick([1, 1.4, 2, 2.8]), dv = r.pick([50, 100, 150, 200]);
    const rho = 5.67e-9 * T + 1.58e-8, R = (dv / 1000) / I, A = rho * (len * 2.54) / R, w = A / (t * 0.001 * 2.54) / 2.54 * 1000;
    return {
      family: 'trace-temp', title: this.title, concepts: this.concepts, conventions: this.conventions,
      prompt: `The resistivity of copper is not constant; assume rho(T) = 5.67 x 10^-9 T + 1.58 x 10^-8 ohm-cm, with T in kelvin. A circuit runs at **${T} K**. Its power trace must carry **${I} A**, is **${len} in** long, and the copper is **${t} mil** (${t / 1000} in) thick.`,
      parts: [{ label: 'a', kind: 'numeric', tolerance: 0.01, prompt: `How wide must the trace be, in **mils**, so that the voltage drop is no more than **${dv} mV**?`, answer: w, display: w.toFixed(2) + ' mil',
        explain: `rho = 5.67e-9 x ${T} + 1.58e-8 = ${rho.toExponential(3)} ohm-cm. R = V/I = ${dv / 1000} / ${I} = ${R.toFixed(4)} ohm. A = rho L / R = ${rho.toExponential(3)} x ${(len * 2.54).toFixed(2)} cm / ${R.toFixed(4)} = ${A.toExponential(3)} cm^2. Width = A / thickness = ${w.toFixed(2)} mil.` }],
      params: { T, I, len, t, dv },
    };
  },
  verify({ params: { T, I, len, t, dv } }) {            /* bisection on the width, working in inches and mils */
    const rhoIn = (5.67e-9 * T + 1.58e-8) / 2.54;
    const drop = (wMil) => I * rhoIn * len / ((wMil * 0.001) * (t * 0.001)) * 1000;
    let lo = 0.01, hi = 1e6;
    for (let i = 0; i < 200; i++) { const mid = (lo + hi) / 2; if (drop(mid) > dv) lo = mid; else hi = mid; }
    return { a: hi };
  },
};

/* ---- true / false ---- */
const lines = (bytes) => { let n = 0, c = 1; while (c < bytes) { c *= 2; n++; } return n; };
const TF = [
  (r) => { const n = r.pick([16, 20, 24, 30, 32]), right = r.int(0, 1) === 1, size = right ? 2 ** n : 2 ** (n - r.int(1, 2)) * 3;
    return { text: `A processor with ${n} address lines can address ${size.toLocaleString('en-US')} bytes of memory.`, truth: right, reason: `${n} lines give 2^${n} = ${(2 ** n).toLocaleString('en-US')} addresses.`, check: { n, size } }; },
  (r) => { const ns = r.pick([2, 4, 5, 8, 10, 20]), right = r.int(0, 1) === 1, f = right ? 1e3 / ns : 1e3 / ns * r.pick([10, 0.1, 2]);
    return { text: `A clock signal whose period is ${ns} nanoseconds has a frequency of ${f >= 1000 ? f / 1000 + ' GHz' : f + ' MHz'}.`, truth: right, reason: `f = 1 / ${ns} ns = ${1e3 / ns} MHz.`, check: { ns, f } }; },
  (r) => { const hi = r.int(1, 4), lo = r.int(1, 4), claimed = r.pick([50, 25, 75, 40, 60]), actual = 100 * hi / (hi + lo);
    return { text: `A clock that is high for ${hi} ms and low for ${lo} ms has a duty cycle of ${claimed}%.`, truth: Math.abs(actual - claimed) < 0.5, reason: `Duty cycle = high time / period = ${hi} / ${hi + lo} = ${actual.toFixed(1)}%.`, check: { hi, lo, claimed } }; },
  (r) => { const bytes = r.pick([2 ** 20, 2 ** 24, 2 ** 30, 2 ** 16]), lbl = { 1048576: '1 MByte', 16777216: '16 MBytes', 1073741824: '1 GByte', 65536: '64 KBytes' }[bytes], right = r.int(0, 1) === 1, claim = lines(bytes) + (right ? 0 : r.pick([-2, 2, 4]));
    return { text: `${claim} address lines are required for a ${lbl} deep memory circuit.`, truth: right, reason: `${lbl} = 2^${lines(bytes)} bytes, so ${lines(bytes)} address lines.`, check: { bytes, claim } }; },
  () => ({ text: 'Of the three major busses of a microprocessor, only the address bus is bidirectional.', truth: false, reason: 'The address bus is unidirectional (processor to memory). The data bus is the bidirectional one.' }),
  () => ({ text: 'Of the three major busses in a microprocessor, only the data bus is completely bidirectional.', truth: true, reason: 'The address bus is one way, and the control bus is a mix of inputs, outputs and bidirectional signals.' }),
  () => ({ text: 'The NOR gate is the negative logic equivalent of the positive logic OR gate.', truth: false, reason: 'The negative-logic equivalent of OR is AND. NOR is OR followed by an inversion.' }),
  () => ({ text: 'The 68000 microprocessor is capable of addressing 16,777,216 bytes of memory.', truth: true, reason: '24 address lines give 2^24 = 16,777,216 bytes.' }),
];
const trueFalse = {
  id: 'true-false',
  title: 'True or false, with reasons',
  concepts: ['processor-basics.bus-types', 'clocks-and-pulses.time-and-frequency', 'clocks-and-pulses.duty-cycle', 'buses-and-cells.active-low-negative-logic', 'memory-decoding.address-lines'],
  conventions: 'K = 1,024 and M = 1,048,576 bytes; a duty cycle is the high time divided by the whole period; numeric statements are true only if they are exactly right (to the precision shown). The fixed statements follow the course slides.',
  make(r, { count = 8 } = {}) {
    const picks = r.shuffle(TF.map((_, i) => i)).slice(0, count), items = picks.map((i) => TF[i](r));
    const parts = items.map((it, i) => ({ label: 'abcdefgh'[i], kind: 'choice', options: ['True', 'False'], prompt: it.text, answer: it.truth ? 'True' : 'False', display: it.truth ? 'True' : 'False', explain: it.reason }));
    return { family: 'true-false', title: this.title, concepts: this.concepts, conventions: this.conventions, prompt: 'Say whether each statement is true or false, and why.', parts, _items: items };
  },
  verify(p) {
    const out = {};
    p._items.forEach((it, i) => {
      const c = it.check; let truth = it.truth;
      if (c && 'size' in c) { let b = 1; for (let k = 0; k < c.n; k++) b *= 2; truth = b === c.size; }
      else if (c && 'ns' in c) { truth = Math.abs(1e3 / c.ns - c.f) < 1e-9; }
      else if (c && 'hi' in c) { truth = Math.abs((c.hi / (c.hi + c.lo)) * 100 - c.claimed) < 0.5; }
      else if (c && 'bytes' in c) { let k = 0, s = 1; while (s < c.bytes) { s <<= 1; k++; } truth = k === c.claim; }
      out[p.parts[i].label] = { answer: truth ? 'True' : 'False', notAnswers: [truth ? 'False' : 'True'] };
    });
    return out;
  },
};

/* ---- short discussion (self-graded) ---- */
const BANK = [
  { term: 'Clock skew', concept: 'pcb-design.clock-skew', model: 'Time differences in the arrival of clock edges at different parts, due to different path lengths and propagation delays through the circuitry (for example through clock buffers). In a microprocessor system the clock touches almost every component, so skew reduces timing margins; keep clock distribution balanced and characterise the clock first after the board passes the smoke test.', rubric: ['Edges of the same clock arrive at different times', 'Cause: path length or propagation delay (buffers)', 'Effect: lost timing margin in the system'] },
  { term: 'Split, or multiple ground planes', concept: 'pcb-design.ground-management', model: 'Digital circuits are noisy (switching current spikes) while analog circuits measuring small signals need a quiet ground, so separate planes keep digital return currents from creating noise on analog signals. Join the planes at only one point: more connections create ground loops (noise, 60 Hz hum, oscillations).', rubric: ['Separate analog and digital grounds', 'Reason: digital switching noise would couple into analog signals', 'Join at a single point to avoid ground loops'] },
  { term: 'Bypass capacitors', concept: 'pcb-design.power-planes-bypass', model: 'A fast logic edge needs a high instantaneous current to charge the load capacitance. Bypass capacitors store charge close to the ICs to supply it, reducing voltage spikes on the supply. Rule of thumb: about one per 1-2 ICs (0.1 uF ceramic), with a larger filter capacitor (10 uF) on the board.', rubric: ['Local charge storage near the ICs', 'Supplies the current for fast switching edges', 'Reduces supply voltage spikes; about 0.1 uF per 1-2 ICs'] },
  { term: 'Bus contention, open-collector and tri-state outputs', concept: 'buses-and-cells.bus-contention-tristate', model: 'Many devices share a bus, but two ordinary outputs driving it at different levels (5 V and 0 V) create bus contention: a short circuit with an indeterminate level. Open-collector outputs can only pull the wire low, with a pull-up resistor making it high, so several low outputs cannot conflict; but the low-to-high transition is slow because of the RC time constant of the pull-up and the wire capacitance, which limits system speed. Tri-state outputs can share the bus quickly.', rubric: ['Contention = two outputs fighting on one wire (short circuit, indeterminate level)', 'Open collector: pulls low only, needs a pull-up resistor, slow rising edge (RC)', 'Tri-state outputs share a bus without the speed penalty'] },
  { term: 'Active-low signals and negative logic', concept: 'buses-and-cells.active-low-negative-logic', model: 'A tilde (~CS, ~OE, ~WE) means the signal is true when it is low; the memory control signals in this course are all active low. Negative logic treats low as true, which swaps gate functions: a gate that is OR in positive logic is AND in negative logic ("OR gates become AND gates in negative logic"). NOR is not the negative-logic OR: it is an OR followed by an inversion.', rubric: ['~ means true when low', 'Swapping the meaning of the levels swaps OR and AND', 'NOR is OR followed by an inversion, not the negative-logic OR'] },
  { term: 'Chip enable (~CE) versus output enable (~OE)', concept: 'buses-and-cells.chip-enable-output-enable', model: '~CS/~CE is the master control: if it is not low the entire chip is off, with all outputs tri-stated and clocked inputs inactive. ~OE only places the outputs into the tri-state condition, so with ~CE low and ~OE high the chip accepts new data but its output stays high impedance. The address decoder makes exactly one ~CS low so only one chip drives the bus.', rubric: ['~CE turns the whole chip off when not low', '~OE controls only whether the outputs drive the bus', 'The decoder makes exactly one ~CS low'] },
  { term: 'SRAM versus DRAM', concept: 'memory-systems.sram-vs-dram', model: 'SRAM holds a bit by feedback (derived from the D flip-flop) in 5-6 transistors per bit, needs no refresh and has a simple interface, so it suits cache and fast local storage. DRAM uses one transistor and a capacitor per cell, so it is dense and is used for main memory, but charge leaks away and must be refreshed (about every 10 ms), and it uses row/column addressing with RAS and CAS.', rubric: ['SRAM: 5-6 transistors, feedback, no refresh, simple, fast (cache)', 'DRAM: 1 transistor plus capacitor, dense, main memory', 'DRAM charge leaks and must be refreshed; row/column addressing'] },
  { term: 'DRAM refresh and row/column addressing', concept: 'memory-systems.dram-operation', model: 'DRAM cells are a matrix (the lecture\'s example is a 64-Mbit part as 8192 x 8192) addressed in two halves: the row address is clocked in first with ~RAS and then the column address with ~CAS. Refresh is done by a RAS cycle that refreshes a whole row (8,192 cells) at a time, during which those cells cannot be accessed for data. Refreshing all 8,192 rows every 16.384 ms needs a refresh cycle every 2 microseconds, a significant perturbation to memory access.', rubric: ['Address sent as row (RAS) then column (CAS)', 'Refresh is a RAS cycle that refreshes one row at a time', 'Refresh steals access time (a cycle about every 2 microseconds in the example)'] },
  { term: 'Watchdog timer', concept: 'noise-and-isolation.watchdog-timer', model: 'A watchdog timer monitors the computer and issues a RESET or NMI when the supply voltage goes out of range or when the computer has not sent its retrigger pulse within the designated time. It relies on the code running in a loop with a predictable cycle time that writes the retrigger bit each time round, and so guarantees the processor will not lock up whatever caused the malfunction.', rubric: ['Timer that must be retriggered regularly by software', 'No retrigger in time (or supply out of range) causes RESET or NMI', 'Needs a loop with a predictable cycle time; prevents lock-up'] },
  { term: 'Hysteresis and switch debouncing', concept: 'noise-and-isolation.hysteresis-debounce', model: 'Hysteresis is designed in so noise near the threshold does not toggle the output: the input must pass the reference by a margin before the output switches, and the switching range is the deadband (it gives noise margin but limits accuracy). Mechanical switches bounce, opening and closing many times before settling, and the circuit sees each bounce as an input; an RC low-pass filter followed by a Schmitt trigger (a gate with hysteresis) debounces the switch.', rubric: ['Hysteresis = deadband; prevents spurious switching near the threshold', 'Switch contacts bounce and look like many inputs', 'RC low-pass filter plus Schmitt trigger gives a clean edge'] },
  { term: 'Optical isolation', concept: 'noise-and-isolation.optical-isolation', model: 'An LED and a phototransistor couple the outside world to the computer with no electrical connection. It protects against electrical noise (long cables act like antennas), lets systems with different ground references communicate, often provides 1,000 V of isolation, and keeps medical instruments that touch a patient safe.', rubric: ['LED + phototransistor, no electrical connection', 'Different ground references and noise on long cables', 'About 1,000 V isolation; safety for medical instruments'] },
  { term: 'Propagation delay', concept: 'clocks-and-pulses.propagation-delay', model: 'The time from an input change to the output change: gates need a finite time to switch and signals need time to travel, and both come out of the clock period. In the lecture, internal gate delays are about 100 ps and a 4 GHz clock leaves about 250 ps for everything in one cycle; with a period near 0.3 ns and a clock crossing time of 0.16 ns, more than half the time is wasted just getting the clock signal there.', rubric: ['Input-to-output switching time of a gate', 'Signal travel time also counts', 'Both must fit inside the clock period, limiting clock speed'] },
  { term: 'Wait states and memory timing margins', concept: 'memory-systems.memory-timing', model: 'The processor\'s timing and the memory\'s timing must be compatible, and any decoding reduces timing margins (for example a 74ALS138 decoder could cost as much as 36 ns of the memory cycle). A Z80 memory cycle is synchronous, and the memory system\'s ~WAIT output extends the cycle for slow devices. When timing fails, add wait states or use faster parts; margins are analysed as minimum, typical and maximum.', rubric: ['Processor and memory timing must match; glue logic eats margin', '~WAIT extends the cycle (wait states) for slow memory', 'Fix: wait states or faster parts; check min, typical, max'] },
];
const discussion = {
  id: 'discussion',
  title: 'Short discussion',
  concepts: BANK.map((b) => b.concept),
  conventions: 'Free response: write your own answer, then reveal the model answer (the course notes\' own wording, taken from the lecture material) and tick each rubric point you covered. You are not graded on matching the wording; covering two of three points counts as a pass.',
  make(r, { count = 3 } = {}) {
    const picks = r.shuffle(BANK).slice(0, count);
    return { family: 'discussion', title: this.title, concepts: picks.map((b) => b.concept), conventions: this.conventions, prompt: 'Briefly discuss each term and how it applies to a microprocessor-based system.',
      parts: picks.map((b, i) => ({ label: 'abc'[i], kind: 'free', prompt: b.term, answer: b.model, display: b.model, explain: b.model, rubric: b.rubric, concept: b.concept })) };
  },
};
export const problems = { 'trace-temp': traceTemp, 'true-false': trueFalse, discussion };
