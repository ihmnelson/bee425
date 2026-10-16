/* Named sandbox projects (localStorage) plus export/import: a JSON backup of everything and a ZIP of .X68 files. */
(function (root) {
  'use strict';
  const KEY = 'q68k.projects.v1';
  const mem = { v: null };   // fallback when localStorage is unavailable
  const read = () => { try { const raw = localStorage.getItem(KEY); if (raw) return JSON.parse(raw); } catch (e) { /* fall through */ } return mem.v || {}; };
  const write = (o) => { mem.v = o; try { localStorage.setItem(KEY, JSON.stringify(o)); } catch (e) { /* kept in memory only */ } };
  const clean = (name) => String(name || '').replace(/[\\/:*?"<>|\u0000-\u001f]/g, '_').trim().slice(0, 60);

  const Projects = {
    list() { const p = read(); return Object.keys(p).sort((a, b) => (p[b].updated || 0) - (p[a].updated || 0)).map((k) => ({ name: k, updated: p[k].updated || 0, size: (p[k].src || '').length })); },
    get(name) { const p = read(); return p[name] ? p[name].src : null; },
    save(name, src) { name = clean(name); if (!name) throw new Error('Give the project a name.'); const p = read(); p[name] = { src: String(src), updated: Date.now() }; write(p); return name; },
    remove(name) { const p = read(); delete p[name]; write(p); },
    rename(oldName, newName) { newName = clean(newName); if (!newName) throw new Error('Give the project a name.'); const p = read(); if (!p[oldName]) return; p[newName] = p[oldName]; if (newName !== oldName) delete p[oldName]; write(p); return newName; },

    /* JSON backup: projects, the editor's current text, and (optionally) study progress */
    backup(extra) {
      return JSON.stringify({ app: '68K Quest', type: 'backup', version: 1, exported: new Date().toISOString(), projects: read(), editor: extra && extra.editor != null ? extra.editor : null, progress: extra && extra.progress ? extra.progress : null }, null, 1);
    },
    /* returns a summary; does not touch progress (the caller decides) */
    restore(text, opts) {
      let d; try { d = JSON.parse(text); } catch (e) { throw new Error('That file is not valid JSON.'); }
      if (!d || d.app !== '68K Quest' || d.type !== 'backup' || typeof d.projects !== 'object') throw new Error('That does not look like a 68K Quest backup.');
      const p = read(); let added = 0, replaced = 0;
      for (const [k, v] of Object.entries(d.projects)) {
        if (!v || typeof v.src !== 'string') continue; const name = clean(k); if (!name) continue;
        if (p[name]) { if (opts && opts.overwrite === false) continue; replaced++; } else added++;
        p[name] = { src: v.src, updated: v.updated || Date.now() };
      }
      write(p);
      return { added, replaced, editor: d.editor, progress: d.progress, exported: d.exported };
    },

    /* ZIP (store only, no compression) of every project as NAME.X68 */
    zip(files) { // files: [{name, text}]
      const enc = new TextEncoder(); const parts = [], central = []; let offset = 0;
      const crcTable = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
      const crc32 = (b) => { let c = 0xFFFFFFFF; for (let i = 0; i < b.length; i++) c = crcTable[(c ^ b[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
      const u16 = (v) => [v & 255, (v >> 8) & 255], u32 = (v) => [v & 255, (v >>> 8) & 255, (v >>> 16) & 255, (v >>> 24) & 255];
      const d = new Date(); const dosTime = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1), dosDate = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
      const used = new Set();
      for (const f of files) {
        let nm = clean(f.name) || 'program'; let final = nm + '.X68', i = 2; while (used.has(final.toLowerCase())) final = `${nm}_${i++}.X68`; used.add(final.toLowerCase());
        const name = enc.encode(final), data = enc.encode(f.text.replace(/\r?\n/g, '\r\n')), crc = crc32(data);
        const local = [0x50, 0x4B, 3, 4, ...u16(20), ...u16(0x0800), ...u16(0), ...u16(dosTime), ...u16(dosDate), ...u32(crc), ...u32(data.length), ...u32(data.length), ...u16(name.length), ...u16(0)];
        parts.push(new Uint8Array(local), name, data);
        central.push({ name, crc, size: data.length, offset });
        offset += local.length + name.length + data.length;
      }
      const cdStart = offset; let cdSize = 0;
      for (const c of central) {
        const rec = [0x50, 0x4B, 1, 2, ...u16(20), ...u16(20), ...u16(0x0800), ...u16(0), ...u16(dosTime), ...u16(dosDate), ...u32(c.crc), ...u32(c.size), ...u32(c.size), ...u16(c.name.length), ...u16(0), ...u16(0), ...u16(0), ...u16(0), ...u32(0), ...u32(c.offset)];
        parts.push(new Uint8Array(rec), c.name); cdSize += rec.length + c.name.length;
      }
      parts.push(new Uint8Array([0x50, 0x4B, 5, 6, 0, 0, 0, 0, ...u16(central.length), ...u16(central.length), ...u32(cdSize), ...u32(cdStart), 0, 0]));
      let total = 0; parts.forEach((p) => (total += p.length)); const out = new Uint8Array(total); let o = 0; parts.forEach((p) => { out.set(p, o); o += p.length; });
      return out;
    },
    zipAll(extraCurrent) {
      const p = read(); const files = Object.keys(p).map((k) => ({ name: k, text: p[k].src }));
      if (extraCurrent && extraCurrent.trim()) files.push({ name: 'current-editor', text: extraCurrent });
      return files.length ? Projects.zip(files) : null;
    },
    download(name, data, mime) { // data: string or Uint8Array
      const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([data], { type: mime || 'application/octet-stream' })); a.download = name;
      document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
    },
    stamp() { const d = new Date(), z = (n) => String(n).padStart(2, '0'); return `${d.getFullYear()}${z(d.getMonth() + 1)}${z(d.getDate())}-${z(d.getHours())}${z(d.getMinutes())}`; },
    _clean: clean,
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = Projects; else root.Projects = Projects;
})(typeof window !== 'undefined' ? window : globalThis);
