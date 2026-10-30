/* Port I/O for the sandbox, modelled on the Oshonsoft Z80 Simulator IDE's peripheral devices:
   an input device on port 01H, an output terminal on port 02H, and a prompt before any IN instruction
   that has no data waiting.  Any other port can be read and written too; the last value written is shown. */
(function (root) {
  'use strict';
  class NeedInput extends Error { constructor(port) { super('IN from port ' + port.toString(16).toUpperCase().padStart(2, '0') + 'H needs a value'); this.port = port; } }

  class Machine {
    constructor(onOutput) {
      this.onOutput = onOutput || (() => {});
      this.text = '';                       // everything sent to the output terminal
      this.queue = {};                      // port -> bytes waiting to be read by IN
      this.outVals = {};                    // port -> last byte written by OUT
      this.inLog = [];                      // [port, value] of every IN, newest last (capped)
      this.promptIn = true;                 // "Prompt For Value Before IN Instruction"
      this.portVal = {};                    // value an input device supplies when prompting is off (Peripheral Devices / I/O Ports Editor)
      this.keyPort = 1; this.termPort = 2;
    }
    print(s) { this.text += s; this.onOutput(s); }
    clear() { this.text = ''; this.onOutput(null); }
    feed(port, byte) { (this.queue[port & 0xFF] = this.queue[port & 0xFF] || []).push(byte & 0xFF); }
    feedText(port, str) { for (const ch of str) this.feed(port, ch.charCodeAt(0)); }
    pending(port) { return (this.queue[port & 0xFF] || []).length; }
    // called by the CPU for IN / INI / ...; throws NeedInput when it wants the user to supply a value
    in(port16) {
      const p = port16 & 0xFF, q = this.queue[p];
      let v;
      if (q && q.length) v = q.shift();
      else if (this.promptIn) throw new NeedInput(p);
      else v = this.portVal[p] || 0;
      this.inLog.push([p, v]); if (this.inLog.length > 200) this.inLog.shift();
      return v;
    }
    out(port16, v) {
      const p = port16 & 0xFF; this.outVals[p] = v & 0xFF;
      if (p === this.termPort) {
        if (v === 13) this.print('\r'); else if (v === 10) this.print('\n'); else if (v === 8) this.print('\b');
        else if (v >= 32 && v < 127) this.print(String.fromCharCode(v));
        else if (v >= 128) this.print(String.fromCharCode(v));      // let Latin-1 through
      }
    }
    snapshot() { const q = {}; for (const k of Object.keys(this.queue)) q[k] = this.queue[k].slice(); return { len: this.text.length, queue: q, outVals: Object.assign({}, this.outVals), inLen: this.inLog.length }; }
    restore(s) { this.text = this.text.slice(0, s.len); this.queue = s.queue; this.outVals = s.outVals; this.inLog.length = Math.min(this.inLog.length, s.inLen); this.onOutput(undefined); }
  }

  // "41", "41h", "0x41", "$41", "%01000001", "65", or a single quoted character -> byte (or null)
  function parseByte(str) {
    str = String(str).trim(); let m, v = null;
    if ((m = /^'(.)'$/.exec(str)) || (m = /^"(.)"$/.exec(str))) v = m[1].charCodeAt(0);
    else if ((m = /^(?:0x|\$)([0-9a-f]{1,2})$/i.exec(str)) || (m = /^([0-9a-f]{1,2})h$/i.exec(str))) v = parseInt(m[1], 16);
    else if ((m = /^%([01]{1,8})$/.exec(str)) || (m = /^([01]{8})b$/i.exec(str))) v = parseInt(m[1], 2);
    else if (/^[0-9]{1,3}$/.test(str)) v = parseInt(str, 10);
    return v !== null && v >= 0 && v <= 255 ? v : null;
  }

  const api = { Machine, NeedInput, parseByte };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.IOZ80 = api;
})(typeof window !== 'undefined' ? window : globalThis);
