/* Register Tracer: a separate arithmetic model and the real simulator cores must agree on every generated program. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import * as esbuild from 'esbuild';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'tracer-'));
const entry = path.join(tmp, 'entry.jsx');
fs.writeFileSync(entry, `export { makeProgram, runCore } from ${JSON.stringify(path.join(root, 'engine/ui/games.jsx'))};\nexport { rng } from ${JSON.stringify(path.join(root, 'engine/lib/rng.js'))};\n`);
esbuild.buildSync({ entryPoints: [entry], bundle: true, platform: 'node', format: 'esm', outfile: path.join(tmp, 'out.mjs'), jsx: 'automatic', jsxImportSource: 'preact',
  alias: { '@course/generators': path.join(root, 'content/generators/index.js') }, nodePaths: [path.join(root, 'node_modules')], logLevel: 'error' });
const { makeProgram, runCore, rng } = await import(pathToFileURL(path.join(tmp, 'out.mjs')).href);

for (const cpu of ['m68k', 'z80']) {
  test(`${cpu}: model and core agree on 500 random programs`, () => {
    for (let s = 1; s <= 500; s++) {
      const p = makeProgram(cpu, rng(s)), c = runCore(cpu, p.src), m = p.model;
      assert.ok(c, `seed ${s}: the program did not assemble and halt`);
      assert.equal(c.reg, m.reg, `seed ${s} register: ${p.listing.join('; ')}`);
      assert.equal(c.Z, m.Z, `seed ${s} Z`);
      assert.equal(c.C, m.C, `seed ${s} C`);
      if (m.N !== undefined) assert.equal(c.N, m.N, `seed ${s} N`); else assert.equal(c.S, m.S, `seed ${s} S`);
    }
  });
}
