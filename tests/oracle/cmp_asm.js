// usage: node cmp_asm.js file.X68  -> compares my assembler's machine code with EASy68K's listing (file.L68)
const fs = require('fs'), cp = require('child_process');
const P = require('path').join(__dirname, '..', '..', 'js') + require('path').sep;
const { assemble } = require(P + 'asm.js');
const file = process.argv[2];
const src = fs.readFileSync(file, 'utf8');
try { cp.execFileSync((process.env.EASY68K_ORACLE || __dirname) + '/src/bin/asm68k', [file], { stdio: 'pipe' }); } catch (e) { /* nonzero exit with errors is fine */ }
const lst = fs.readFileSync(file.replace(/\.X68$/i, '.L68'), 'utf8').split('\n');
const oracle = new Map(), oerr = new Map();
for (const l of lst) {
  let m = /^Line (\d+) ERROR: (.*)$/.exec(l); if (m) { oerr.set(+m[1], m[2]); continue; }
  m = /^([0-9A-F]{8})(=?)\s+((?:[0-9A-F]{2,8} ?)*?)\s+(\d+)\s{1,2}(.*)$/.exec(l);
  if (m && m[3].trim()) {
    const bytesStr = m[3].trim().split(/\s+/).join('');
    oracle.set(+m[4], { addr: parseInt(m[1], 16), hex: bytesStr, data: m[2] === '=' });
  }
}
const r = assemble(src);
const mine = new Map(); const merr = new Map(r.errors.map(e => [e.line, e.msg]));
for (const l of r.listing) if (l.bytes.length && l.addr != null) mine.set(l.n, { addr: l.addr, hex: l.bytes.slice(0, 40).map(b => b.toString(16).toUpperCase().padStart(2, '0')).join('') });
let diff = 0, ok = 0;
const lines = src.split('\n');
for (const [n, o] of oracle) {
  const mm = mine.get(n); const oh = o.hex;
  if (!mm) { diff++; console.log(`MISSING  line ${n}: ${lines[n - 1].trim()}  oracle=${o.addr.toString(16)} ${oh} mine-err=${merr.get(n)}`); continue; }
  const mh = mm.hex.slice(0, oh.length);
  if (mh !== oh || mm.addr !== o.addr) { diff++; console.log(`DIFF     line ${n}: ${lines[n - 1].trim()}\n   oracle ${o.addr.toString(16)} ${oh}\n   mine   ${mm.addr.toString(16)} ${mm.hex}`); } else ok++;
}
for (const [n, e] of oerr) if (!merr.has(n)) { console.log(`ORACLE-ERR-ONLY line ${n}: ${lines[n - 1].trim()}  (${e})`); diff++; }
for (const [n, e] of merr) if (!oerr.has(n)) { console.log(`MINE-ERR-ONLY   line ${n}: ${lines[n - 1].trim()}  (${e})`); diff++; }
console.log(`${ok} lines identical, ${diff} differences`);
