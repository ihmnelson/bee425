/* Generators for bus loading, DRAM and memory-system design arithmetic (Lessons 6-7). */
const sig = (x, n = 3) => Number(x.toPrecision(n));

/* ---- 10%-90% rise time of an open-collector bus (RC charging) ---- */
const ocRise = {
  make(rand) {
    const R = rand.pick([1, 2.2, 4.7, 10]), traceIn = rand.pick([4, 6, 8, 10]), inputs = rand.pick([1, 2, 3, 4]);
    const C = 10 + inputs * 10 + traceIn * 1;                          /* one OC output 10 pF + gate inputs 10 pF each + 1 pF per inch of trace */
    const ns = sig(2.2 * R * 1000 * C * 1e-12 * 1e9, 3);
    return {
      type: 'numeric', tolerance: 0.02, params: { R, traceIn, inputs },
      prompt: `An open-collector bus has a **${R} kΩ** pull-up. The load is one open-collector gate output (10 pF), **${inputs}** gate input${inputs > 1 ? 's' : ''} (10 pF each) and **${traceIn} in** of trace at 1 pF per inch. What is the **10% to 90% rise time**, in ns? (Within 2% is fine.)`,
      answer: ns, display: `${ns} ns`,
      explain: `Total capacitance = 10 + ${inputs} x 10 + ${traceIn} x 1 = ${C} pF. The line charges through the pull-up as an RC circuit; the 10% to 90% rise time is about 2.2 RC = 2.2 x ${R} kΩ x ${C} pF = **${ns} ns**.`,
    };
  },
  verify({ params: { R, traceIn, inputs } }) {                        /* find t10 and t90 of 1 - exp(-t/tau) by bisection */
    const tau = R * 1000 * (10 + inputs * 10 + traceIn) * 1e-12;
    const solve = (f) => { let lo = 0, hi = 50 * tau; for (let i = 0; i < 200; i++) { const mid = (lo + hi) / 2; if (1 - Math.exp(-mid / tau) < f) lo = mid; else hi = mid; } return lo; };
    return (solve(0.9) - solve(0.1)) * 1e9;
  },
};

/* ---- DRAM refresh interval per row ---- */
const refreshInterval = {
  make(rand) {
    const rows = rand.pick([1024, 2048, 4096, 8192, 16384]), ms = rand.pick([8, 16, 32, 64]);
    const us = sig(ms * 1000 / rows, 4);
    return {
      type: 'numeric', tolerance: 0.005, params: { rows, ms },
      prompt: `A DRAM has **${rows.toLocaleString('en-US')} rows**, and every row must be refreshed within **${ms} ms**. If the rows are refreshed one at a time at an even rate, how often (in µs) must a refresh cycle occur?`,
      answer: us, display: `${us} µs`,
      explain: `Interval = total time / rows = ${ms} ms / ${rows.toLocaleString('en-US')} = ${ms * 1000} µs / ${rows.toLocaleString('en-US')} = **${us} µs**. (The lecture's example: 8,192 rows in 16.384 ms is 2 µs.)`,
    };
  },
  verify({ params: { rows, ms } }) { const perRowSeconds = (ms / 1000) / rows; return perRowSeconds * 1e6; },
};

/* ---- Row and column address bits of a square DRAM array ---- */
const rowBits = {
  make(rand) {
    const n = rand.pick([24, 26, 28, 30]), mbit = 2 ** n / 2 ** 20;
    const ask = rand.pick(['row', 'column', 'total']);
    const ans = ask === 'total' ? n : n / 2;
    return {
      type: 'numeric', params: { n, ask },
      prompt: `A DRAM holds **${mbit >= 1024 ? mbit / 1024 + ' Gbit' : mbit + ' Mbit'}** (2^${n} cells) arranged as a **square matrix** of rows and columns. How many **${ask === 'total' ? 'address bits in total (row plus column)' : ask + ' address bits'}** does it need?`,
      answer: ans, display: String(ans),
      explain: `${mbit} Mbit = 2^${n} cells, so ${n} address bits in all. A square array splits them evenly: ${n / 2} row bits (sent first with RAS) and ${n / 2} column bits (sent second with CAS).` + (ask === 'total' ? '' : ` Answer: **${ans}**.`),
    };
  },
  verify({ params: { n, ask } }) {
    let rows = 1, cols = 1, rb = 0, cb = 0;                              /* grow a square matrix until it has 2^n cells */
    while (rows * cols < 2 ** n) { rows *= 2; rb++; if (rows * cols >= 2 ** n) break; cols *= 2; cb++; }
    return ask === 'total' ? rb + cb : ask === 'row' ? rb : cb;
  },
};

/* ---- Number of pages in a memory design ---- */
const designPages = {
  make(rand) {
    const bus = rand.pick([16, 32]), w = rand.pick([8, 16].filter((x) => x <= bus)), depth = rand.pick([512, 1024, 2048]) * 1024, total = rand.pick([8, 16, 32, 64]);
    const perPage = bus / w, chipBytes = depth * w / 8, pageBytes = perPage * chipBytes, pages = total * 2 ** 20 / pageBytes;
    return {
      type: 'numeric', params: { bus, w, depth, total },
      prompt: `A processor has a **${bus}-bit data bus**. You build **${total} MB** of memory from static RAM chips organised as **${depth / 1024}M x ${w}**. How many **pages** does the memory have?`,
      answer: pages, display: String(pages),
      explain: `Each chip stores ${depth / 1024}M x ${w} bits = ${chipBytes / 1048576} MB. A page needs ${bus} / ${w} = ${perPage} chip${perPage > 1 ? 's' : ''} side by side, so a page is ${pageBytes / 1048576} MB. ${total} MB / ${pageBytes / 1048576} MB = **${pages} pages**.`,
    };
  },
  verify({ params: { bus, w, depth, total } }) {
    let lanes = 0, bits = 0; while (bits < bus) { bits += w; lanes++; }
    let pages = 0, bytes = 0, page = lanes * depth * w / 8;
    while (bytes < total * 2 ** 20) { bytes += page; pages++; }
    return pages;
  },
};

export const generators = { 'bus.ocRise': ocRise, 'dram.refreshInterval': refreshInterval, 'dram.rowBits': rowBits, 'memory.designPages': designPages };
