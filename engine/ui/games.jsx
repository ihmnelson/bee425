/* Games. Every question here is checked by something other than its author:
   Register Tracer assembles and runs a random program on the real core and also works it out with a separate arithmetic model,
   and shows a question only if the two agree; Drill uses the lesson generators, which the audit checks against independent solvers. */
import { useState } from 'preact/hooks';
import { rng } from '../lib/rng.js';
import { isCorrect } from '../lib/check.js';
import { newSeed, instantiate, Question, Feedback } from './quiz.jsx';
import { CPUS } from './sandbox.jsx';

const h2 = (v) => (v & 0xff).toString(16).toUpperCase().padStart(2, '0');

/* ---- random byte programs: the source text, and a separate model of the result ---- */
function makeProgram(cpuId, r) {
  const n = r.int(3, 5), lines = [];
  if (cpuId === 'm68k') {
    let a = r.int(0, 255), z = a === 0, neg = !!(a & 128), c = false;
    lines.push(`MOVE.B  #$${h2(a)},D0`); z = a === 0; neg = !!(a & 128); c = false;
    for (let i = 1; i < n; i++) {
      const op = r.pick(['ADDI', 'SUBI', 'ANDI', 'ORI', 'EORI', 'LSL', 'LSR', 'NEG', 'NOT', 'ADDQ', 'SUBQ']);
      let v = r.int(1, 255), res;
      switch (op) {
        case 'ADDI': res = a + v; c = res > 255; lines.push(`ADDI.B  #$${h2(v)},D0`); break;
        case 'SUBI': res = a - v; c = v > a; lines.push(`SUBI.B  #$${h2(v)},D0`); break;
        case 'ANDI': res = a & v; c = false; lines.push(`ANDI.B  #$${h2(v)},D0`); break;
        case 'ORI': res = a | v; c = false; lines.push(`ORI.B   #$${h2(v)},D0`); break;
        case 'EORI': res = a ^ v; c = false; lines.push(`EORI.B  #$${h2(v)},D0`); break;
        case 'LSL': res = a << 1; c = !!(a & 128); lines.push('LSL.B   #1,D0'); break;
        case 'LSR': res = a >> 1; c = !!(a & 1); lines.push('LSR.B   #1,D0'); break;
        case 'NEG': res = -a; c = a !== 0; lines.push('NEG.B   D0'); break;
        case 'NOT': res = ~a; c = false; lines.push('NOT.B   D0'); break;
        case 'ADDQ': v = r.int(1, 8); res = a + v; c = res > 255; lines.push(`ADDQ.B  #${v},D0`); break;
        default: v = r.int(1, 8); res = a - v; c = v > a; lines.push(`SUBQ.B  #${v},D0`);
      }
      a = res & 255; z = a === 0; neg = !!(a & 128);
    }
    return { src: `        ORG     $1000\nSTART   ${lines.join('\n        ')}\n        SIMHALT\n        END     START\n`, listing: lines, model: { reg: a, Z: +z, N: +neg, C: +c }, regName: 'D0 (low byte)' };
  }
  /* z80: track A with Z, S and C */
  let a = r.int(0, 255), z = false, s = false, c = false;
  const lit = (v) => { const t = h2(v) + 'H'; return /^[A-F]/.test(t) ? '0' + t : t; };
  lines.push(`LD A,${lit(a)}`);
  for (let i = 1; i < n; i++) {
    const op = r.pick(['ADD', 'SUB', 'AND', 'OR', 'XOR', 'INC', 'DEC', 'CPL', 'NEG', 'RLCA']);
    const v = r.int(1, 255); let res;
    switch (op) {
      case 'ADD': res = a + v; c = res > 255; res &= 255; z = res === 0; s = !!(res & 128); lines.push(`ADD A,${lit(v)}`); break;
      case 'SUB': res = a - v; c = v > a; res &= 255; z = res === 0; s = !!(res & 128); lines.push(`SUB ${lit(v)}`); break;
      case 'AND': res = a & v; c = false; z = res === 0; s = !!(res & 128); lines.push(`AND ${lit(v)}`); break;
      case 'OR': res = a | v; c = false; z = res === 0; s = !!(res & 128); lines.push(`OR ${lit(v)}`); break;
      case 'XOR': res = a ^ v; c = false; z = res === 0; s = !!(res & 128); lines.push(`XOR ${lit(v)}`); break;
      case 'INC': res = (a + 1) & 255; z = res === 0; s = !!(res & 128); lines.push('INC A'); break;
      case 'DEC': res = (a - 1) & 255; z = res === 0; s = !!(res & 128); lines.push('DEC A'); break;
      case 'CPL': res = (~a) & 255; lines.push('CPL'); break;
      case 'NEG': res = (-a) & 255; c = a !== 0; z = res === 0; s = !!(res & 128); lines.push('NEG'); break;
      default: res = ((a << 1) | (a >> 7)) & 255; c = !!(a & 128); lines.push('RLCA');
    }
    a = res;
  }
  return { src: `        .ORG 0100H\nSTART:  ${lines.join('\n        ')}\n        HALT\n        .END\n`, listing: lines, model: { reg: a, Z: +z, S: +s, C: +c }, regName: 'A' };
}

function runCore(cpuId, src) {
  const P = CPUS[cpuId], asm = P.assemble(src);
  if (!asm.ok) return null;
  const s = P.boot(asm.r, () => {});
  for (let i = 0; i < 1000 && !P.halted(s); i++) P.step(s);
  if (!P.halted(s)) return null;
  const f = Object.fromEntries(P.flags(s.cpu));
  return cpuId === 'm68k' ? { reg: s.cpu.D[0] & 255, Z: f.Z, N: f.N, C: f.C } : { reg: s.cpu.af >> 8, Z: f.Z, S: f.S, C: f.C };
}

/* a program whose model and the real core agree (anything else is discarded) */
function validProgram(cpuId, seed) {
  for (let k = 0; k < 20; k++) {
    const r = rng(seed + k * 7919), p = makeProgram(cpuId, r), core = runCore(cpuId, p.src);
    if (core && core.reg === p.model.reg && core.Z === p.model.Z && core.C === p.model.C && (p.model.N === undefined ? core.S === p.model.S : core.N === p.model.N)) return { ...p, core };
  }
  return null;
}
export { validProgram, makeProgram, runCore };

export function Tracer() {
  const [cpuId, setCpuId] = useState('m68k');
  const [seed, setSeed] = useState(newSeed());
  const [step, setStep] = useState(0);              /* 0 register, 1 flag, 2 done */
  const [score, setScore] = useState({ right: 0, total: 0 });
  const [shown, setShown] = useState(null);
  const prog = validProgram(cpuId, seed);
  if (!prog) return <main><p>Could not build a program; try again.</p><button class="btn" onClick={() => setSeed(newSeed())}>New program</button></main>;
  const flagName = r2(seed, cpuId);
  const qs = [
    { type: 'numeric', prompt: `After this program runs, what is **${prog.regName}**? (Hex, for example $4F or 4FH.)`, answer: '$' + h2(prog.model.reg), explain: `Work through the instructions in order. The result is **$${h2(prog.model.reg)}**. (The simulator's own core gives the same value.)` },
    { type: 'numeric', prompt: `What is the **${flagName}** flag afterwards (0 or 1)?`, answer: prog.model[flagName], explain: `The last instruction that affects the ${flagName} flag leaves it at **${prog.model[flagName]}**. Logic instructions clear C; ADD and SUB set C on carry or borrow; MOVE and (on the Z80) INC, DEC and CPL leave C alone.` },
  ];
  const q = qs[Math.min(step, 1)];
  const answer = (resp) => { const ok = isCorrect(q, resp); setShown({ ok }); setScore((s0) => ({ right: s0.right + (ok ? 1 : 0), total: s0.total + 1 })); };
  const next = () => { setShown(null); if (step === 0) setStep(1); else { setStep(0); setSeed(newSeed()); } };
  return (
    <main>
      <p class="crumb"><a href="#/games">Games</a> / Register Tracer</p>
      <h1>Register Tracer</h1>
      <p class="lede">Trace a short program by hand. Each program was assembled and run on the real simulator core and also worked out by a separate model; it is shown only if they agree.</p>
      <div class="cta">{['m68k', 'z80'].map((id) => <button class={'chip' + (id === cpuId ? ' on' : '')} onClick={() => { setCpuId(id); setSeed(newSeed()); setStep(0); setShown(null); }}>{CPUS[id].title}</button>)}
        <span class="meta">Score {score.right} of {score.total}</span></div>
      <pre class="console mono">{prog.listing.join('\n')}</pre>
      <Question key={seed + ':' + step} q={q} onSubmit={answer} locked={!!shown} verdict={shown ? shown.ok : null} />
      {shown && <><Feedback q={q} ok={shown.ok} /><button class="btn primary" onClick={next}>{step === 0 ? 'Now the flag' : 'Next program'}</button></>}
      <p class="meta"><a href={'#/sim/' + cpuId} onClick={() => { try { sessionStorage.setItem('quest.sim.' + cpuId + '.src', prog.src); } catch (e) { /* ignore */ } }}>Open this program in the simulator</a></p>
    </main>
  );
}
const r2 = (seed, cpuId) => rng(seed + 1).pick(cpuId === 'm68k' ? ['Z', 'N', 'C'] : ['Z', 'S', 'C']);

export function Drill({ gens, id }) {
  const [seed, setSeed] = useState(newSeed());
  const [shown, setShown] = useState(null);
  const [score, setScore] = useState({ right: 0, total: 0, streak: 0, best: 0 });
  const q = instantiate({ gen: id }, seed);
  const answer = (resp) => { const ok = isCorrect(q, resp); setShown({ ok }); setScore((s) => { const st = ok ? s.streak + 1 : 0; return { right: s.right + (ok ? 1 : 0), total: s.total + 1, streak: st, best: Math.max(s.best, st) }; }); };
  return (
    <main>
      <p class="crumb"><a href="#/games">Games</a> / <a href="#/games/drill">Drill</a> / {id}</p>
      <h1>Drill</h1>
      <p class="meta">Score {score.right} of {score.total} &middot; streak {score.streak} &middot; best {score.best}. Every question is generated with new numbers and checked against an independent solver.</p>
      <Question key={seed} q={q} onSubmit={answer} locked={!!shown} verdict={shown ? shown.ok : null} />
      {shown && <><Feedback q={q} ok={shown.ok} /><button class="btn primary" onClick={() => { setShown(null); setSeed(newSeed()); }}>Next</button></>}
    </main>
  );
}

export function DrillList({ gens, concepts }) {
  const groups = {};
  for (const id of Object.keys(gens)) (groups[id.split('.')[0]] ||= []).push(id);
  return (
    <main>
      <p class="crumb"><a href="#/games">Games</a> / Drill</p>
      <h1>Drill</h1>
      <p class="lede">Endless practice of one kind of problem, with fresh numbers each time. Pick a topic.</p>
      {Object.entries(groups).map(([g, ids]) => (
        <section><h2>{g}</h2><ul class="rows">{ids.map((id) => <li><a href={'#/games/drill/' + id}><span><b>{id}</b><br /><span class="meta">{gens[id].map((c) => concepts[c].title).slice(0, 2).join('; ')}</span></span></a></li>)}</ul></section>
      ))}
    </main>
  );
}
