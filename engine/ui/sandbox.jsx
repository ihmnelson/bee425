/* In-browser simulators for the two processors in the course. The cores and assemblers are the same files that the oracle
   tests run (js/m68k, js/z80), so what the lessons verify is what you run here. */
import { useState, useRef, useEffect } from 'preact/hooks';
import C68 from '../../js/m68k/cpu.js';
import A68 from '../../js/m68k/asm.js';
import IO68 from '../../js/m68k/io.js';
import X68 from '../../js/m68k/examples.js';
import CZ from '../../js/z80/cpu.js';
import AZ from '../../js/z80/asm.js';
import IOZ from '../../js/z80/io.js';
import XZ from '../../js/z80/examples.js';

const hx = (v, n) => (v >>> 0).toString(16).toUpperCase().padStart(n, '0');

const CPUS = {
  m68k: {
    title: '68000', blurb: 'EASy68K-compatible assembler and simulator. TRAP #15 gives console input and output (task 9 halts).', examples: X68.EXAMPLES, memBits: 24,
    assemble(src) {
      const r = A68.assemble(src);
      return r.ok ? { ok: true, r } : { ok: false, errors: r.errors.map((e) => `line ${e.line}: ${e.msg}`) };
    },
    boot(r, out) {
      const con = new IO68.Console(out); const cpu = new C68.CPU();
      for (const seg of r.image) cpu.mem.set(seg.bytes, seg.addr);
      cpu.A[7] = 0x01000000; cpu.ssp = 0x01000000; cpu.pc = r.start; cpu.io = { trap15: IO68.makeTrap15(con, () => {}) };
      return { cpu, con };
    },
    step(s) { s.cpu.step(); },
    halted: (s) => s.cpu.halted, waiting: (s) => s.cpu.waitInput,
    feed(s, text) { s.con.feedLine(text); s.cpu.waitInput = null; },
    text: (s) => s.con.text,
    regs(cpu) {
      const rows = [];
      for (let i = 0; i < 8; i++) rows.push([`D${i}`, hx(cpu.D[i], 8)], [`A${i}`, hx(cpu.A[i], 8)]);
      rows.push(['PC', hx(cpu.pc, 6)], ['SR', hx(cpu.getSR(), 4)]);
      return rows;
    },
    flags(cpu) { const sr = cpu.getSR(); return [['X', (sr >> 4) & 1], ['N', (sr >> 3) & 1], ['Z', (sr >> 2) & 1], ['V', (sr >> 1) & 1], ['C', sr & 1]]; },
    pc: (cpu) => cpu.pc,
    counters: (cpu) => `${cpu.steps.toLocaleString()} instructions`,
  },
  z80: {
    title: 'Z80', blurb: 'Oshonsoft-style assembler and simulator (directives start with a period). Output terminal on port 02H, input on port 01H; HALT stops.', examples: XZ.EXAMPLES, memBits: 16,
    assemble(src) {
      const r = AZ.assemble(src);
      return r.ok ? { ok: true, r } : { ok: false, errors: r.errors.map((e) => `line ${e.line}: ${e.msg}`) };
    },
    boot(r, out) {
      const mach = new IOZ.Machine(out); mach.promptIn = true; const cpu = new CZ.CPU();
      cpu.io = mach; cpu.mem.set(r.mem); cpu.pc = r.origin;
      return { cpu, con: mach };
    },
    step(s) { try { s.cpu.step(); s.need = null; } catch (e) { if (e && e.port !== undefined) s.need = e.port; else throw e; } },
    halted: (s) => s.cpu.halted, waiting: (s) => (s.need != null ? 'port' : null),
    feed(s, text) { for (const ch of text) s.con.feed(1, ch.charCodeAt(0)); s.con.feed(1, 13); s.need = null; },
    text: (s) => s.con.text,
    regs(cpu) {
      return [['AF', hx(cpu.af, 4)], ['BC', hx(cpu.bc, 4)], ['DE', hx(cpu.de, 4)], ['HL', hx(cpu.hl, 4)], ['IX', hx(cpu.ix, 4)], ['IY', hx(cpu.iy, 4)], ['SP', hx(cpu.sp, 4)], ['PC', hx(cpu.pc, 4)]];
    },
    flags(cpu) { const f = cpu.f; return [['S', (f >> 7) & 1], ['Z', (f >> 6) & 1], ['H', (f >> 4) & 1], ['P/V', (f >> 2) & 1], ['N', (f >> 1) & 1], ['C', f & 1]]; },
    pc: (cpu) => cpu.pc,
    counters: (cpu) => `${cpu.steps?.toLocaleString?.() ?? '?'} instructions · ${cpu.cycles.toLocaleString()} T-states`,
  },
};

const hmsg = (h) => (typeof h === 'string' ? h : 'Halted.');
const KEY = (id) => `quest.sim.${id}.src`;
const load = (id) => { try { const s = sessionStorage.getItem(KEY(id)); if (s) { sessionStorage.removeItem(KEY(id)); return s; } return localStorage.getItem(KEY(id) + '.last'); } catch (e) { return null; } };
export const sendToSim = (id, src) => { try { sessionStorage.setItem(KEY(id), src); } catch (e) { /* ignore */ } };

export function Sandbox({ cpuId }) {
  const P = CPUS[cpuId];
  const [src, setSrc] = useState(() => load(cpuId) || P.examples[0].src);
  const [errors, setErrors] = useState([]);
  const [, bump] = useState(0);
  const [mem, setMem] = useState('1000');
  const [input, setInput] = useState('');
  const [msg, setMsg] = useState('');
  const sim = useRef(null), timer = useRef(null), asm = useRef(null);
  const redraw = () => bump((n) => n + 1);
  useEffect(() => () => clearTimeout(timer.current), []);
  useEffect(() => { try { localStorage.setItem(KEY(cpuId) + '.last', src); } catch (e) { /* ignore */ } }, [src]);

  const assemble = () => {
    stop();
    const r = P.assemble(src);
    if (!r.ok) { setErrors(r.errors); sim.current = null; setMsg('Assembly failed.'); redraw(); return false; }
    setErrors([]); asm.current = r.r; sim.current = P.boot(r.r, redraw); setMsg('Assembled. Step or run.'); redraw(); return true;
  };
  const ensure = () => sim.current || assemble();
  const state = () => sim.current;
  const done = () => { const s = state(); return !s || P.halted(s); };
  const stepOnce = () => { if (!ensure()) return; const s = state(); if (P.halted(s)) { setMsg(hmsg(P.halted(s))); return; } P.step(s); if (P.waiting(s)) setMsg('Waiting for input: type below and press Send.'); else if (P.halted(s)) setMsg(hmsg(P.halted(s))); redraw(); };
  const stop = () => { clearTimeout(timer.current); timer.current = null; };
  const run = () => {
    if (!ensure()) return; const s = state();
    const chunk = () => {
      for (let i = 0; i < 5000 && !P.halted(s) && !P.waiting(s); i++) P.step(s);
      redraw();
      if (P.halted(s)) { setMsg(hmsg(P.halted(s))); timer.current = null; }
      else if (P.waiting(s)) { setMsg('Waiting for input: type below and press Send.'); timer.current = null; }
      else if ((s.cpu.steps || 0) > 2e6) { setMsg('Stopped after 2,000,000 instructions (an infinite loop?).'); timer.current = null; }
      else timer.current = setTimeout(chunk, 0);
    };
    stop(); chunk();
  };
  const send = () => { const s = state(); if (!s) return; P.feed(s, input); setInput(''); redraw(); if (!P.halted(s)) run(); };

  const s = state();
  const memAddr = (parseInt(mem, 16) || 0) & ~0xF, size = cpuId === 'm68k' ? 0x1000000 : 0x10000;
  const rows = [];
  if (s) for (let r = 0; r < 8; r++) { const a = (memAddr + r * 16) % size; const bytes = Array.from({ length: 16 }, (_, i) => hx(s.cpu.mem[(a + i) % size], 2)); rows.push([hx(a, cpuId === 'm68k' ? 6 : 4), bytes.join(' ')]); }
  const out = s ? P.text(s).replace(/\r\n/g, '\n').replace(/\r/g, '') : '';

  return (
    <main class="wide sandbox">
      <h1>{P.title} simulator</h1>
      <p class="lede">{P.blurb}</p>
      <div class="cta">
        <select aria-label="Example program" onChange={(e) => { const ex = P.examples[Number(e.currentTarget.value)]; if (ex) { setSrc(ex.src); sim.current = null; setErrors([]); setMsg(''); } }}>
          <option value="">Load an example...</option>
          {P.examples.map((x, i) => <option value={i}>{x.name}</option>)}
        </select>
        <button class="btn primary" onClick={assemble}>Assemble and reset</button>
        <button class="btn" onClick={stepOnce}>Step</button>
        <button class="btn" onClick={run}>Run</button>
        <button class="btn" onClick={() => { stop(); setMsg('Stopped.'); redraw(); }}>Stop</button>
      </div>
      <div class="simgrid">
        <div>
          <textarea class="editor" spellcheck={false} value={src} onInput={(e) => { setSrc(e.currentTarget.value); sim.current = null; }} aria-label="Assembly source" />
          {errors.length > 0 && <div class="feedback bad" role="alert"><b>Assembly errors</b><ul>{errors.slice(0, 8).map((e) => <li>{e}</li>)}</ul></div>}
          <p class="meta" role="status">{msg}{s ? ' ' + P.counters(s.cpu) : ''}</p>
        </div>
        <div>
          <h2>Registers</h2>
          {s ? <><table class="regs"><tbody>{P.regs(s.cpu).map(([n, v]) => <tr><th>{n}</th><td class="mono">{v}</td></tr>)}</tbody></table>
            <p class="flags">{P.flags(s.cpu).map(([n, v]) => <span class={'flag' + (v ? ' on' : '')}>{n}={v}</span>)}</p></>
            : <p class="meta">Assemble the program to see the registers.</p>}
        </div>
      </div>
      <h2>Console</h2>
      <pre class="console" aria-live="polite">{out || ' '}</pre>
      <form class="inline" onSubmit={(e) => { e.preventDefault(); send(); }}>
        <input class="answer" value={input} onInput={(e) => setInput(e.currentTarget.value)} placeholder={cpuId === 'm68k' ? 'Type input for TRAP #15, then Send' : 'Type text for port 01H, then Send'} aria-label="Console input" />
        <button class="btn" type="submit">Send</button>
      </form>
      <h2>Memory</h2>
      <label class="meta">Address (hex) <input class="answer small mono" value={mem} onInput={(e) => setMem(e.currentTarget.value)} /></label>
      {s ? <pre class="console mono">{rows.map(([a, b]) => `${a}  ${b}`).join('\n')}</pre> : <p class="meta">Memory appears after you assemble.</p>}
    </main>
  );
}

export const SIM_IDS = Object.keys(CPUS);
export const simTitle = (id) => CPUS[id].title;
export const simExamples = (id) => CPUS[id].examples;
export { CPUS, C68, A68, CZ, AZ, IOZ, IO68 };
