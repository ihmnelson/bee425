/* Bus trace: what a logic analyzer in state mode shows while the Z80 runs, one row per clock (T-state).
   The CPU core records each instruction's bus accesses (cpu.traceOn / cpu.ev); this module turns them into rows.
   Rows are vector-compatible: [address, data|null, flags] with flags "rwmi" as in the SingleStepTests/z80 data,
   which this is checked against (tests/z80/oracle/bustrace-check.js). */
(function (root) {
  'use strict';
  const LEN = { F: 4, R: 3, W: 3, I: 4, O: 4 };
  const hex = (b) => b.toString(16).padStart(2, '0');

  // identify the instruction by its opcode bytes (DD CB d op is keyed by the op byte, not the displacement)
  function keyOf(ev) {
    const f = ev.filter((e) => e[0] === 'F').map((e) => e[2]);
    if (f.length >= 2 && (f[0] === 0xDD || f[0] === 0xFD) && f[1] === 0xCB) {
      const reads = ev.filter((e) => e[0] === 'R');
      return hex(f[0]) + ' cb __ ' + hex(reads[1] ? reads[1][2] : 0);
    }
    return f.map(hex).join(' ');
  }

  // rows of one bus access
  function accessRows(e) {
    const [k, a, d, ir] = e;
    switch (k) {
      case 'F': return [[a, null, '----'], [a, null, 'r-m-'], [ir, d, '----'], [ir, null, '----']];
      case 'R': return [[a, null, '----'], [a, null, 'r-m-'], [a, d, '----']];
      case 'W': return [[a, null, '----'], [a, d, '-wm-'], [a, null, '----']];
      case 'I': return [[a, null, '----'], [a, null, '----'], [a, null, 'r--i'], [a, d, '----']];
      default: return [[a, null, '----'], [a, null, '----'], [a, d, '-w-i'], [a, null, '----']];
    }
  }
  const strobeIndex = (k) => (k === 'F' || k === 'R' || k === 'W' ? 1 : 2);   // which row of the access carries the strobe

  // learn the idle gaps of a vector: [gap before access 0, ..., gap after the last access]. Fails if the accesses differ.
  function learnGaps(ev, cyc) {
    const strobes = []; cyc.forEach((c, i) => { if (c[2] !== '----') strobes.push(i); });
    if (strobes.length !== ev.length) return { ok: false, why: `${ev.length} accesses recorded, ${strobes.length} in the vector` };
    const gaps = []; let pos = 0;
    for (let i = 0; i < ev.length; i++) {
      const rows = accessRows(ev[i]), start = strobes[i] - strobeIndex(ev[i][0]);
      if (start < pos) return { ok: false, why: 'overlapping accesses' };
      gaps.push(start - pos); pos = start + rows.length;
    }
    gaps.push(cyc.length - pos);
    return { ok: true, gaps };
  }

  // build the rows for recorded accesses and gaps (gaps repeat the previous row's address, data floating)
  function rowsFor(ev, gaps) {
    const rows = []; let last = ev.length ? ev[0][1] : 0;
    const idle = (n) => { for (let i = 0; i < n; i++) rows.push([last, null, '----']); };
    ev.forEach((e, i) => { idle(gaps[i]); const r = accessRows(e); r.forEach((x) => rows.push(x)); last = r[r.length - 1][0]; });
    idle(gaps[ev.length]);
    return rows;
  }

  // idle gaps for an instruction that was just executed: looked up by opcode, access types and total clock cycles
  const sigOf = (ev, tstates) => keyOf(ev) + '|' + ev.map((e) => e[0]).join('') + '|' + tstates;
  function gapsFor(ev, tstates, table) {
    const g = (table || api.table || {})[sigOf(ev, tstates)];
    if (g === undefined) return null;
    return g.split(',').map(Number);
  }
  // rows for one executed instruction (null if this variant is not in the table)
  function instructionRows(ev, tstates, table) { const g = gapsFor(ev, tstates, table); return g ? rowsFor(ev, g) : null; }


  /* ---- the rows a student sees: one per clock, with the control lines as an analyzer would list them ----
     Sampling model (stated in the guide): each row is the state just before the falling clock edge, as in the lab setup.
     Control lines are listed active-low like the pins: 0 = asserted. Reads show their data on the row where ~RD is asserted
     and on the next row (memory must have the data on the bus by the end of that clock); writes show it on the ~WR row.
     The refresh ~MREQ pulse in the last clock of a fetch follows UM0080 Figure 5; the test vectors do not include it. */
  function traceRows(ev, gaps) {
    const out = []; let last = ev.length ? ev[0][1] : 0, idx = 0;
    const push = (a, d, flags, extra) => out.push(Object.assign({ a, d, m1: 1, mreq: flags[2] === 'm' ? 0 : 1, iorq: flags[3] === 'i' ? 0 : 1, rd: flags[0] === 'r' ? 0 : 1, wr: flags[1] === 'w' ? 0 : 1, rfsh: 1, kind: '', n: 0 }, extra || {}));
    const idle = (n) => { for (let i = 0; i < n; i++) push(last, null, '----', { kind: 'idle' }); };
    ev.forEach((e, i) => {
      idle(gaps[i]);
      const k = e[0], base = accessRows(e), n = base.length;
      base.forEach((r, j) => {
        let d = r[1], extra = { kind: k, n: j + 1, len: n };
        if ((k === 'F' || k === 'R') && j === 1) d = e[2];                  // data is on the bus while ~RD is asserted
        if (k === 'I' && j === 2) d = e[2];
        if (k === 'F') { if (j < 2) extra.m1 = 0; else extra.rfsh = 0; }
        push(r[0], d, r[2], extra);
        if (k === 'F' && j === 3) out[out.length - 1].mreq = 0;               // refresh ~MREQ (UM0080 Figure 5)
        if (k === 'F' && j === 2) out[out.length - 1].d = e[2];
      });
      last = base[n - 1][0];
    });
    idle(gaps[ev.length]);
    return out;
  }

  /* Read the instruction back out of a trace using only what an analyzer shows (address, data, ~M1, ~MREQ, ~RD, ~WR,
     ~IORQ), the way the lab asks students to. Returns { bytes, reads, writes, ports }. */
  function decodeRows(rows) {
    const bytes = [], reads = [], writes = [], ports = [];
    let prevFetch = false, i = 0;
    while (i < rows.length) {
      const r = rows[i];
      if (r.m1 === 0 && r.mreq === 0 && r.rd === 0) { bytes.push(r.d); i += 4; prevFetch = true; continue; }   // opcode fetch: 4 clocks
      if (r.mreq === 0 && r.rd === 0 && r.m1 === 1) { (reads.length === 0 || true) && reads.push([r.a, r.d]); bytes.push(r.d); i += 3; continue; }
      if (r.mreq === 0 && r.wr === 0) { writes.push([r.a, r.d]); i += 3; continue; }
      if (r.iorq === 0) { ports.push([r.rd === 0 ? 'in' : 'out', r.a, r.rd === 0 ? rows[i + 1].d : r.d]); i += 2; continue; }
      i++;
    }
    return { bytes, reads, writes, ports, prevFetch };
  }

  const api = { traceRows, decodeRows, sigOf, gapsFor, instructionRows, keyOf, accessRows, learnGaps, rowsFor, LEN, strobeIndex };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.BusTrace = api;
})(typeof window !== 'undefined' ? window : globalThis);
