/* Converter lab: the Systems section's version of the sandbox. Two panels, both computed with js/sys/conv.js:
   1. a quantizer (bits, span, input -> code, staircase, flash thermometer code, successive-approximation trials);
   2. a sampler (signal and sample frequency -> samples, the wave they imply, and whether it aliases). */
(function (root) {
  'use strict';
  const CV = root.ConvSys;
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const num = (x, d) => Number(x.toPrecision(d || 4)).toString();

  function staircase(n, vfs, vin, c) {
    const W = 320, H = 180, L = 34, B = 20, T = 8, R = 8, pw = W - L - R, ph = H - B - T, top = CV.levels(n);
    if (n > 6) return '<p class="stat">The staircase is drawn for up to 6 bits; larger steps are too small to see.</p>';
    const X = (v) => L + (v / vfs) * pw, Y = (code) => T + ph - (code / top) * ph;
    let d = `M${X(0)} ${Y(0)}`;
    for (let k = 0; k <= top; k++) { const x0 = X(k * CV.step(vfs, n)), x1 = k === top ? X(vfs) : X((k + 1) * CV.step(vfs, n)); d += `L${x0} ${Y(k)}L${x1} ${Y(k)}`; }
    return `<svg class="labsvg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Staircase: input voltage against output code">
      <path d="M${L} ${T}V${T + ph}H${L + pw}" fill="none" stroke="currentColor" stroke-opacity=".4"/>
      <path d="M${X(0)} ${Y(0)}L${X(vfs)} ${Y(top)}" fill="none" stroke="currentColor" stroke-opacity=".35" stroke-dasharray="3 3"/>
      <path d="${d}" fill="none" stroke="var(--accent)" stroke-width="2"/>
      <path d="M${X(vin)} ${T + ph}V${Y(c)}H${L}" fill="none" stroke="var(--ink)" stroke-width="1"/>
      <circle cx="${X(vin)}" cy="${Y(c)}" r="3.5" fill="var(--ink)"/>
      <text x="${L}" y="${H - 5}" font-size="10" fill="currentColor">0</text><text x="${L + pw}" y="${H - 5}" font-size="10" text-anchor="end" fill="currentColor">${num(vfs)} V in</text>
      <text x="${L - 4}" y="${T + 8}" font-size="10" text-anchor="end" fill="currentColor">${top}</text><text x="${L - 4}" y="${T + ph}" font-size="10" text-anchor="end" fill="currentColor">0</text></svg>`;
  }

  function sampling(f, fs) {
    const W = 360, H = 160, L = 8, T = 10, ph = H - 2 * T, mid = T + ph / 2, tmax = 1;            // 1 ms window, f and fs in kHz
    const X = (t) => L + (t / tmax) * (W - 2 * L), Y = (v) => mid - v * (ph / 2 - 4);
    const wave = (hz, dash) => { let d = ''; for (let i = 0; i <= 400; i++) { const t = (i / 400) * tmax; d += (i ? 'L' : 'M') + X(t).toFixed(1) + ' ' + Y(Math.sin(2 * Math.PI * hz * t)).toFixed(1); } return `<path d="${d}" fill="none" ${dash ? 'stroke="var(--ink)" stroke-dasharray="4 3" stroke-width="1.5"' : 'stroke="var(--accent)" stroke-width="1.5" stroke-opacity=".8"'}/>`; };
    const m = Math.round(f / fs), fImplied = f - m * fs;                                           // signed apparent frequency
    let dots = ''; for (let k = 0; k / fs <= tmax + 1e-9; k++) dots += `<circle cx="${X(k / fs).toFixed(1)}" cy="${Y(Math.sin(2 * Math.PI * f * k / fs)).toFixed(1)}" r="3" fill="var(--ink)"/>`;
    return `<svg class="labsvg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Sine wave, its samples, and the wave the samples imply"><path d="M${L} ${mid}H${W - L}" stroke="currentColor" stroke-opacity=".3"/>${wave(f, false)}${Math.abs(fImplied) > 1e-9 ? wave(fImplied, true) : `<path d="M${L} ${Y(Math.sin(0))}H${W - L}" stroke="var(--ink)" stroke-dasharray="4 3"/>`}${dots}
      <text x="${L}" y="${H - 1}" font-size="10" fill="currentColor">0</text><text x="${W - L}" y="${H - 1}" font-size="10" text-anchor="end" fill="currentColor">1 ms</text></svg>`;
  }

  function view($app, ctx) {
    $app.innerHTML = `<h1>Converter lab</h1>
      <p class="lede">Change the numbers and see what a converter does with them. Everything here uses the course's conventions: an N-bit converter has 2^N − 1 steps, and conversion truncates.</p>
      <div class="panel lab"><h3>1. Quantizer</h3>
        <div class="fields">
          <label>Bits <input id="lbits" type="number" min="1" max="12" value="4" class="addr"></label>
          <label>Span, V <input id="lvfs" type="number" min="0.1" max="100" step="0.1" value="1.5" class="addr"></label>
          <label>Input, V <input id="lvin" type="number" min="0" step="0.01" value="1.23" class="addr"></label></div>
        <input id="lvinr" type="range" min="0" max="1000" value="820" aria-label="Input voltage" style="width:100%">
        <div class="labgrid"><div id="lstair"></div><div id="lout"></div></div></div>
      <div class="panel lab" style="margin-top:12px"><h3>2. Sampling and aliasing</h3>
        <div class="fields"><label>Signal, kHz <input id="lf" type="number" min="0.1" max="60" step="0.1" value="3" class="addr"></label>
          <label>Sample rate, kHz <input id="lfs" type="number" min="1" max="60" step="0.1" value="10" class="addr"></label></div>
        <div class="labgrid"><div id="lwave"></div><div id="lsamp"></div></div></div>
      <div class="row" style="margin-top:12px"><a class="btn" href="#/guide/conversion">Guide: D/A converters</a><a class="btn" href="#/guide/adc-methods">Guide: A/D methods</a><a class="btn" href="#/guide/acquisition">Guide: sampling</a><a class="btn go" href="#/game/convert/easy">Converter drills</a></div>`;
    const $ = (id) => document.getElementById(id);
    let touchRange = false;
    function quant() {
      const n = Math.max(1, Math.min(12, Math.round(+$('lbits').value || 1))), vfs = Math.max(0.1, +$('lvfs').value || 1);
      let vin = Math.max(0, Math.min(vfs, +$('lvin').value || 0));
      if (touchRange) { vin = (+$('lvinr').value / 1000) * vfs; $('lvin').value = num(vin, 4); touchRange = false; } else $('lvinr').value = Math.round((vin / vfs) * 1000);
      const s = CV.step(vfs, n), c = CV.code(vin, vfs, n), q = CV.dac(c, vfs, n), sar = CV.sar(vin, vfs, n);
      $('lstair').innerHTML = staircase(n, vfs, vin, c);
      const therm = n <= 4 ? `<p class="stat">Flash comparators (${CV.flashComparators(n)}), thermometer code: <code>${CV.thermometer(vin, vfs, n).join('')}</code></p>` : `<p class="stat">A flash converter would need ${CV.flashComparators(n).toLocaleString()} comparators.</p>`;
      $('lout').innerHTML = `<table class="gt"><tbody><tr><td>Step (1 LSB)</td><td class="mono">${num(s * 1000, 5)} mV</td></tr><tr><td>Code</td><td class="mono">${c} = ${CV.bin(c, n)}B</td></tr><tr><td>D/A output for that code</td><td class="mono">${num(q, 5)} V</td></tr><tr><td>Quantization error</td><td class="mono">${num((vin - q) * 1000, 4)} mV (0 to 1 LSB)</td></tr></tbody></table>${therm}
        <details class="more"><summary>Successive-approximation trials (${n})</summary><table class="gt"><thead><tr><th>Trial</th><th>D/A output</th><th>Vin ≥ D/A?</th></tr></thead><tbody>${sar.trials.map((t) => `<tr><td class="mono">${CV.bin(t.trial, n)}B</td><td class="mono">${num(t.dacV, 4)} V</td><td>${t.keep ? 'yes, keep the bit' : 'no, clear it'}</td></tr>`).join('')}</tbody></table></details>`;
    }
    function samp() {
      const f = Math.max(0.1, +$('lf').value || 1), fs = Math.max(1, +$('lfs').value || 1), fa = CV.alias(f, fs);
      $('lwave').innerHTML = sampling(f, fs);
      const ok = fs > 2 * f;
      $('lsamp').innerHTML = `<p><b>${ok ? 'No aliasing.' : 'Aliased.'}</b> ${ok ? `The sample rate ${num(fs)} kHz is more than twice the signal frequency (${num(2 * f)} kHz).` : `The sample rate ${num(fs)} kHz is not above ${num(2 * f)} kHz, twice the signal frequency.`}</p>
        <p>${ok ? 'The samples sit on the real wave (solid line).' : `The samples also fit a wave at <b>${num(fa)} kHz</b> (dashed)${fa < 1e-9 ? ': a constant voltage' : ''}. A converter cannot tell the two apart.`}</p>
        <p class="stat">Solid: the real signal. Dots: samples. Dashed: the wave the samples imply. The window is 1 ms.</p>`;
    }
    ['lbits', 'lvfs', 'lvin'].forEach((id) => ($(id).oninput = quant));
    $('lvinr').oninput = () => { touchRange = true; quant(); };
    ['lf', 'lfs'].forEach((id) => ($(id).oninput = samp));
    quant(); samp();
  }
  root.Sandbox = { view };
})(window);
