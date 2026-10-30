/* Generators for diode and transistor switching arithmetic (Lesson 8). The lecture's model: Vbe = 0.6 V, Vce(sat) = 0.4 V. */
const sig = (x, n = 3) => Number(x.toPrecision(n));
const VBE = 0.6, VSAT = 0.4;

/* ---- Base resistor for a switch, from the worst-case (minimum) beta ---- */
const baseResistor = {
  make(rand) {
    const vio = rand.pick([3.3, 5]), ic = rand.pick([20, 50, 100, 200, 500]), beta = rand.pick([50, 75, 100, 150]);
    const ib = ic / beta, r = sig((vio - VBE) / (ib / 1000) / 1000, 3);
    return {
      type: 'numeric', tolerance: 0.01, params: { vio, ic, beta },
      prompt: `An I/O pin outputs **${vio} V**. You want an NPN transistor to carry **${ic} mA** of collector current, and its minimum beta is **${beta}**. Using Vbe = 0.6 V, what base resistor value (in **kΩ**, before rounding to a standard value) just supplies the needed base current?`,
      answer: r, display: `${r} kΩ`,
      explain: `Base current = Ic / β = ${ic} mA / ${beta} = ${sig(ib, 3)} mA. The resistor drops ${vio} - 0.6 = ${sig(vio - VBE, 3)} V, so R = ${sig(vio - VBE, 3)} V / ${sig(ib, 3)} mA = **${r} kΩ**. In practice choose the next standard value *below* this, so the base current is a little more than needed.`,
    };
  },
  verify({ params: { vio, ic, beta } }) {                               /* largest R (1 ohm steps) for which beta x Ib still supplies ic */
    let best = 0; for (let r = 1; r <= 400000; r++) { if (beta * ((vio - VBE) / r) * 1000 >= ic - 1e-9) best = r; else break; }
    return best / 1000;
  },
};

/* ---- Collector voltage of a switch, with saturation ---- */
const collectorVoltage = {
  make(rand) {
    const vcc = rand.pick([12, 25, 50]), rl = rand.pick([100, 330, 500, 1000]), beta = rand.pick([50, 100, 150]), rb = rand.pick([1, 2.2, 4.7, 10, 22]);
    const ib = (5 - VBE) / (rb * 1000), wanted = beta * ib, icSat = (vcc - VSAT) / rl;
    const sat = wanted >= icSat, v = sat ? VSAT : sig(vcc - wanted * rl, 3);
    return {
      type: 'numeric', tolerance: 0.02, params: { vcc, rl, beta, rb },
      prompt: `A 5 V I/O pin drives the base of an NPN transistor (β = ${beta}, Vbe = 0.6 V) through **${rb} kΩ**. The collector load is **${rl} Ω** to a **${vcc} V** supply. What is the **collector voltage** in volts? (If the transistor saturates, use 0.4 V.)`,
      answer: v, display: `${v} V`,
      explain: `Ib = (5 - 0.6) / ${rb} kΩ = ${sig(ib * 1000, 3)} mA. The transistor would like to pass β x Ib = ${sig(wanted * 1000, 3)} mA. The most the load allows is (${vcc} - 0.4) / ${rl} Ω = ${sig(icSat * 1000, 3)} mA. ` + (sat ? `The wanted current is at least that much, so the transistor **saturates** and the collector sits at **${VSAT} V**.` : `That is less, so it does not saturate: V = ${vcc} - ${sig(wanted * 1000, 3)} mA x ${rl} Ω = **${v} V**.`),
    };
  },
  verify({ params: { vcc, rl, beta, rb } }) {                          /* clamp the current at saturation, then V = Vcc - I x R */
    const ib = (5 - VBE) / (rb * 1000); let ic = beta * ib; const max = (vcc - VSAT) / rl; if (ic > max) ic = max;
    return vcc - ic * rl;
  },
};

/* ---- Base current needed to saturate ---- */
const satBase = {
  make(rand) {
    const vcc = rand.pick([12, 25, 50]), rl = rand.pick([50, 100, 330, 500]), beta = rand.pick([50, 100, 150, 200]);
    const mA = sig((vcc - VSAT) / rl / beta * 1000, 3);
    return {
      type: 'numeric', tolerance: 0.01, params: { vcc, rl, beta },
      prompt: `An NPN transistor (β = ${beta}) switches a **${rl} Ω** load from a **${vcc} V** supply. What is the **minimum base current** (in mA) that drives it into saturation (Vce(sat) = 0.4 V)?`,
      answer: mA, display: `${mA} mA`,
      explain: `At saturation the load carries (${vcc} - 0.4) / ${rl} Ω = ${sig((vcc - VSAT) / rl * 1000, 4)} mA. The base must supply Ic / β = **${mA} mA** or more. (The lecture's example: 25 V, 100 Ω, β = 100 needs about 2.45 mA.)`,
    };
  },
  verify({ params: { vcc, rl, beta } }) { let ib = 0; while (beta * ib < (vcc - VSAT) / rl) ib += 1e-7; return ib * 1000; },
};

/* ---- LED series resistor ---- */
const ledResistor = {
  make(rand) {
    const vcc = rand.pick([3.3, 5, 9, 12]), vf = rand.pick([1.8, 2, 2.2, 3]), ma = rand.pick([5, 10, 15, 20]);
    const r = sig((vcc - vf) / (ma / 1000), 3);
    return {
      type: 'numeric', tolerance: 0.01, params: { vcc, vf, ma },
      prompt: `An LED has a forward voltage of **${vf} V** and should carry **${ma} mA**. What series resistor (in **ohms**) is needed from a **${vcc} V** supply?`,
      answer: r, display: `${r} Ω`,
      explain: `The resistor drops the rest of the supply: ${vcc} - ${vf} = ${sig(vcc - vf, 3)} V at ${ma} mA, so R = ${sig(vcc - vf, 3)} / 0.0${String(ma).padStart(2, '0')} = **${r} Ω**.`,
    };
  },
  verify({ params: { vcc, vf, ma } }) { let r = 1; while ((vcc - vf) / r > ma / 1000 + 1e-12) r += 0.01; return r; },
};

/* ---- Darlington pair base resistor ---- */
const darlington = {
  make(rand) {
    const vcc = rand.pick([24, 40, 50]), rl = rand.pick([5, 10, 20]), b1 = rand.pick([20, 50, 100, 200]), b2 = rand.pick([20, 50, 100]), vio = 5;
    const ic = vcc / rl, ib = ic / (b1 * b2), r = sig((vio - 1.2) / ib / 1000, 3);
    return {
      type: 'numeric', tolerance: 0.01, params: { vcc, rl, b1, b2 },
      prompt: `A **Darlington pair** (β1 = ${b1}, β2 = ${b2}) switches a **${rl} Ω** load from **${vcc} V**. The I/O pin gives **5 V**, and the pair needs **1.2 V** at its base. What base series resistor (in **kΩ**) supplies just enough base current?`,
      answer: r, display: `${r} kΩ`,
      explain: `Ic = ${vcc} / ${rl} = ${sig(ic, 4)} A. Effective β = ${b1} x ${b2} = ${b1 * b2}, so Ib = ${sig(ic, 4)} / ${b1 * b2} = ${sig(ib * 1000, 3)} mA. R = (5 - 1.2) / ${sig(ib * 1000, 3)} mA = **${r} kΩ**. (The lecture's example: 4 A, β = 2,000, 2 mA, 1.9 kΩ.)`,
    };
  },
  verify({ params: { vcc, rl, b1, b2 } }) { const ic = vcc / rl; let r = 1; while ((5 - 1.2) / r * b1 * b2 > ic) r += 1; return r / 1000; },
};

export const generators = { 'bjt.baseResistor': baseResistor, 'bjt.collectorVoltage': collectorVoltage, 'bjt.satBase': satBase, 'led.resistor': ledResistor, 'bjt.darlington': darlington };
