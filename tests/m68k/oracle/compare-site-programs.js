/* Run every Homework 2/3 solution and Start here example in the real EASy68K (asm68k + osim, see README.md) and in this site's emulator; compare D0-D7, A0-A6, CCR and key memory.
   usage: node compare-site-programs.js <site dir> <oracle dir containing src/bin/asm68k and osim> <empty work dir> */
const cp = require('child_process'), fs = require('fs'), path = require('path');
const SITE = process.argv[2], LAY = process.argv[3], WORK = process.argv[4];
const H = require(SITE + '/js/m68k/homework.js'), START = require(SITE + '/js/shell/start.js');
const progs = [];
for (const hw of [H.HW2, H.HW3]) for (const p of hw.problems) { (p.solutions || []).forEach((s, i) => s.code && progs.push([`${hw.id} p${p.n} ${s.title}`, s.code])); if (hw.id === 'hw2' && p.n === 1) progs.push(['hw2 p1 handout', p.src]); }
for (const l of START.LESSONS) (l.examples || []).forEach((e) => progs.push(['start ' + l.id + ': ' + e.title, e.src]));
const MEM = [[0x4000, 0x10], [0xA300, 0x10], [0x2000, 0x20], [0x3000, 0x10], [0x100000, 0x10]];
const hx = (v, w) => (v >>> 0).toString(16).toUpperCase().padStart(w, '0');
let bad = 0, n = 0;
for (const [name, src] of progs) {
  const f = path.join(WORK, 'p' + (++n) + '.X68'); fs.writeFileSync(f, src.replace(/SIMHALT/g, 'SIMHALT'));
  let asmOut = ''; try { asmOut = cp.execFileSync(path.join(LAY, 'src/bin/asm68k'), [f], { stdio: 'pipe' }).toString(); } catch (e) { asmOut = (e.stdout || '').toString(); }
  if (!fs.existsSync(f.replace('.X68', '.S68'))) { console.log('ASM FAIL (real)', name, asmOut.split('\n').slice(0, 4).join(' | ')); bad++; continue; }
  const real = JSON.parse(cp.execFileSync(path.join(LAY, 'osim'), [f.replace('.X68', '.S68'), '100000', ...MEM.map(([a, l]) => a.toString(16) + ':' + l.toString(16))], { stdio: ['ignore', 'pipe', 'pipe'] }).toString());
  const l = H.runWith(src); if (l.error) { console.log('SITE FAIL', name, l.error); bad++; continue; }
  const c = l.cpu, diffs = [];
  for (let i = 0; i < 8; i++) if (real.D[i] !== hx(c.D[i], 8)) diffs.push(`D${i} real ${real.D[i]} site ${hx(c.D[i], 8)}`);
  for (let i = 0; i < 7; i++) if (real.A[i] !== hx(c.A[i], 8)) diffs.push(`A${i} real ${real.A[i]} site ${hx(c.A[i], 8)}`);
  const rsr = parseInt(real.SR, 16) & 31, ssr = c.getSR() & 31; if (rsr !== ssr) diffs.push(`CCR real ${rsr.toString(2)} site ${ssr.toString(2)}`);
  MEM.forEach(([a, len]) => { const s = Array.from(c.mem.slice(a, a + len)).map((b) => hx(b, 2)).join(''); if (real.mem[a.toString(16).toUpperCase()] !== s) diffs.push(`mem ${hx(a, 4)} real ${real.mem[a.toString(16).toUpperCase()]} site ${s}`); });
  console.log(diffs.length ? 'DIFF' : 'same', '|', name, '|', 'real D0=' + real.D[0], 'A2=' + real.A[2], diffs.join('; '));
  if (diffs.length) bad++;
}
console.log(bad ? bad + ' program(s) differ or failed' : 'all ' + progs.length + ' programs identical in the real EASy68K and this site');
