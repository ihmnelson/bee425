/* Named sandbox projects (localStorage) per processor pack, plus export/import: one JSON backup of everything
   (both processors and study progress) and a ZIP of source files. Projects.make(packId, cfg) returns the object
   the sandbox of that pack uses; Projects.all is the cross-pack helper used by the Progress page. */
(function (root) {
  'use strict';
  const BACKUP_APP = 'BEE 425 Quest';
  const clean = (name) => String(name || '').replace(/[\\/:*?"<>|\u0000-\u001f]/g, '_').trim().slice(0, 60);
  const mem = {};   // fallback when localStorage is unavailable, per storage key
  const REG = {};   // packId -> { key, ext, label }

  const readKey = (key) => { try { const raw = localStorage.getItem(key); if (raw) return JSON.parse(raw); } catch (e) { /* fall through */ } return mem[key] || {}; };
  const writeKey = (key, o) => { mem[key] = o; try { localStorage.setItem(key, JSON.stringify(o)); } catch (e) { /* kept in memory only */ } };

  /* ZIP (store only, no compression). files: [{path, text}] */
  function zip(files) {
    const enc = new TextEncoder(); const parts = [], central = []; let offset = 0;
    const crcTable = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
    const crc32 = (b) => { let c = 0xFFFFFFFF; for (let i = 0; i < b.length; i++) c = crcTable[(c ^ b[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
    const u16 = (v) => [v & 255, (v >> 8) & 255], u32 = (v) => [v & 255, (v >>> 8) & 255, (v >>> 16) & 255, (v >>> 24) & 255];
    const d = new Date(); const dosTime = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1), dosDate = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
    for (const f of files) {
      const name = enc.encode(f.path), data = enc.encode(f.text.replace(/\r?\n/g, '\r\n')), crc = crc32(data);
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
  }
  const uniquePath = (used, dir, nm, ext) => { let p = `${dir}${nm}.${ext}`, i = 2; while (used.has(p.toLowerCase())) p = `${dir}${nm}_${i++}.${ext}`; used.add(p.toLowerCase()); return p; };

  function make(id, cfg) {
    REG[id] = { key: cfg.key, ext: cfg.ext, label: cfg.label || id };
    const read = () => readKey(cfg.key), write = (o) => writeKey(cfg.key, o);
    return {
      id,
      list() { const p = read(); return Object.keys(p).sort((a, b) => (p[b].updated || 0) - (p[a].updated || 0)).map((k) => ({ name: k, updated: p[k].updated || 0, size: (p[k].src || '').length })); },
      get(name) { const p = read(); return p[name] ? p[name].src : null; },
      save(name, src) { name = clean(name); if (!name) throw new Error('Give the project a name.'); const p = read(); p[name] = { src: String(src), updated: Date.now() }; write(p); return name; },
      remove(name) { const p = read(); delete p[name]; write(p); },
      rename(oldName, newName) { newName = clean(newName); if (!newName) throw new Error('Give the project a name.'); const p = read(); if (!p[oldName]) return; p[newName] = p[oldName]; if (newName !== oldName) delete p[oldName]; write(p); return newName; },
      backup: (extra) => Projects.backup(id, extra),
      restore: (text, opts) => Projects.restore(text, opts),
      /* ZIP of this processor's projects (plus the current editor text) as NAME.ext */
      zipAll(extraCurrent) {
        const p = read(), used = new Set(); const files = Object.keys(p).map((k) => ({ path: uniquePath(used, '', clean(k) || 'program', cfg.ext), text: p[k].src }));
        if (extraCurrent && extraCurrent.trim()) files.push({ path: uniquePath(used, '', 'current-editor', cfg.ext), text: extraCurrent });
        return files.length ? zip(files) : null;
      },
      download: (...a) => Projects.download(...a),
      stamp: () => Projects.stamp(),
      _clean: clean,
    };
  }

  const Projects = {
    make, zip,
    /* JSON backup of every processor's projects, the editor text of the current one, and (optionally) study progress */
    backup(currentId, extra) {
      const projects = {}; Object.keys(REG).forEach((id) => { projects[id] = readKey(REG[id].key); });
      const editors = {}; if (currentId && extra && extra.editor != null) editors[currentId] = extra.editor;
      return JSON.stringify({ app: BACKUP_APP, type: 'backup', version: 2, exported: new Date().toISOString(), projects, editors, progress: extra && extra.progress ? extra.progress : null }, null, 1);
    },
    /* Accepts a v2 backup or a backup from the older single-processor sites ("68K Quest" / "Z80 Quest").
       Returns a summary; does not touch progress (the caller decides). */
    restore(text, opts) {
      let d; try { d = JSON.parse(text); } catch (e) { throw new Error('That file is not valid JSON.'); }
      if (!d || d.type !== 'backup' || typeof d.projects !== 'object') throw new Error('That does not look like a BEE 425 Quest backup.');
      let byPack;
      if (d.app === BACKUP_APP) byPack = d.projects;
      else if (d.app === '68K Quest') byPack = { m68k: d.projects };
      else if (d.app === 'Z80 Quest') byPack = { z80: d.projects };
      else throw new Error('That does not look like a BEE 425 Quest backup.');
      let added = 0, replaced = 0;
      for (const [id, projs] of Object.entries(byPack)) {
        if (!REG[id] || !projs) continue;
        const p = readKey(REG[id].key);
        for (const [k, v] of Object.entries(projs)) {
          if (!v || typeof v.src !== 'string') continue; const name = clean(k); if (!name) continue;
          if (p[name]) { if (opts && opts.overwrite === false) continue; replaced++; } else added++;
          p[name] = { src: v.src, updated: v.updated || Date.now() };
        }
        writeKey(REG[id].key, p);
      }
      const editor = d.editors ? d.editors : (d.editor != null ? { [d.app === 'Z80 Quest' ? 'z80' : 'm68k']: d.editor } : null);
      return { added, replaced, editor, progress: d.progress, exported: d.exported };
    },
    /* ZIP of every processor's projects, one folder per processor */
    zipEverything() {
      const used = new Set(); const files = [];
      for (const id of Object.keys(REG)) { const p = readKey(REG[id].key); for (const k of Object.keys(p)) files.push({ path: uniquePath(used, `${id}/`, clean(k) || 'program', REG[id].ext), text: p[k].src }); }
      return files.length ? zip(files) : null;
    },
    count() { return Object.keys(REG).reduce((n, id) => n + Object.keys(readKey(REG[id].key)).length, 0); },
    download(name, data, mime) { // data: string or Uint8Array
      const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([data], { type: mime || 'application/octet-stream' })); a.download = name;
      document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
    },
    stamp() { const d = new Date(), z = (n) => String(n).padStart(2, '0'); return `${d.getFullYear()}${z(d.getMonth() + 1)}${z(d.getDate())}-${z(d.getHours())}${z(d.getMinutes())}`; },
  };
  root.Projects = Projects;      // until a processor is opened; then window.Projects is that processor's instance
  root.ProjectsAll = Projects;   // cross-processor helpers (backup, restore, zip)
})(typeof window !== 'undefined' ? window : globalThis);
