/* Homework pages: problem list and per-problem walkthrough, try-it checker, and live solution tracer. */
(function () {
  'use strict';
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const enc = (s) => btoa(unescape(encodeURIComponent(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const md = (s) => QUEST_GUIDES.render(s);
  const H = () => window.Homework;

  function done(S, hw, n) { return !!(S.state.hw && S.state.hw[hw] && S.state.hw[hw][n]); }
  function mark(S, hw, n) { S.state.hw = S.state.hw || {}; S.state.hw[hw] = S.state.hw[hw] || {}; S.state.hw[hw][n] = true; S.save(); }

  function viewList(root, ctx) {
    const hw = H().HW2, S = ctx.Store;
    root.innerHTML = `<p><a href="#/guides">← Guides</a></p><h1>${esc(hw.title)}</h1><p class="stat">Due ${esc(hw.due)}</p>
      <p class="lede">${esc(hw.intro)}</p>
      <div class="row" style="margin-bottom:12px"><a class="btn" href="#/guide/workflow">📖 Using EASy68K: files, list file, S-records</a><a class="btn" href="#/sandbox">Open the sandbox</a></div>
      <div class="grid">${hw.problems.map((p) => `<a class="tile" href="#/homework/hw2/${p.n}"><span class="ico">${p.n === 5 ? '🎨' : ['1️⃣', '2️⃣', '3️⃣', '4️⃣'][p.n - 1]}</span><span class="nm">Problem ${p.n}: ${esc(p.title)}</span><span class="sub">${esc(p.ask)}</span><span class="meta"><span>${done(S, 'hw2', p.n) ? '✔ checked' : p.check ? 'not checked yet' : ''}</span></span></a>`).join('')}</div>
      <div class="panel" style="margin-top:16px"><h3>How to use these pages</h3><ol><li><b>Try first.</b> Read the problem and use the hints one at a time.</li><li><b>Check your own program</b> in the Try it box (or the sandbox). The checker runs it on several test inputs.</li><li><b>Then read the walkthrough</b> and the verified solution, and trace it instruction by instruction.</li></ol>
        <p class="stat">This homework is not for credit. The solutions here were each run on a real EASy68K simulator as well as this site's emulator.</p></div>`;
  }

  function traceHtml(res) {
    if (res.error) return `<pre class="code">${esc(res.error)}</pre>`;
    return `<div class="tablewrap"><table class="gt"><thead><tr><th>#</th><th>Instruction</th><th>What changed</th></tr></thead><tbody>${res.rows.map((r) => r.skip ? `<tr><td colspan="3" class="dim">… ${r.skip} more instructions …</td></tr>` : `<tr><td class="mono">${r.n}</td><td class="mono" style="white-space:normal">${esc(r.text)}</td><td class="mono" style="white-space:normal">${r.changes.length ? esc(r.changes.join(', ')) : '<span class="dim">no visible change</span>'}</td></tr>`).join('')}</tbody></table></div><p class="stat">${res.total} instructions executed in total.</p>`;
  }

  function viewProblem(root, n, ctx) {
    const hw = H().HW2, p = hw.problems[n - 1], S = ctx.Store;
    if (!p) { location.hash = '#/homework'; return; }
    const prev = hw.problems[n - 2], next = hw.problems[n];
    const sol = p.solutions.filter((s) => s.code);
    root.innerHTML = `<p><a href="#/homework">← ${esc(hw.title)}</a></p><h1>Problem ${p.n}: ${esc(p.title)}</h1>
      <div class="panel"><b>What it asks</b><p style="margin:.4em 0 0">${esc(p.ask)}</p></div>
      ${p.concepts.length ? `<div class="row" style="margin:10px 0"><span class="stat">Concepts:</span>${p.concepts.map((c) => `<a class="btn ghost" href="${c[1]}">${esc(c[0])}</a>`).join('')}</div>` : ''}
      ${p.hints.length ? `<div class="sec"><h2>Hints</h2><small>one at a time</small></div><div id="hints"></div><button class="btn" id="hintbtn">Show hint 1 of ${p.hints.length}</button>` : ''}
      ${p.check ? `<div class="sec"><h2>Try it</h2></div><div class="panel" id="tryit"></div>` : ''}
      <div class="sec"><h2>Walkthrough</h2></div>
      <details class="wk"><summary class="btn">Show the walkthrough${p.n === 1 ? ' (includes the answer)' : ''}</summary><div class="guide" style="margin-top:10px">${md(p.walkthrough.map((s, i) => `${i + 1}. **${s[0]}.** ${s[1]}`).join('\n'))}</div></details>
      ${p.check ? `<div class="sec"><h2>Solution and trace</h2></div>
      <details class="wk"><summary class="btn">Show the verified solution${sol.length > 1 ? 's' : ''}</summary><div id="solbox" style="margin-top:10px"></div></details>` : ''}
      <div class="row" style="justify-content:space-between;margin-top:18px">${prev ? `<a class="btn" href="#/homework/hw2/${prev.n}">← Problem ${prev.n}</a>` : '<span></span>'}${next ? `<a class="btn" href="#/homework/hw2/${next.n}">Problem ${next.n} →</a>` : ''}</div>`;

    /* hints */
    if (p.hints.length) {
      let shown = 0; const hb = root.querySelector('#hintbtn'), hd = root.querySelector('#hints');
      hb.onclick = () => { hd.insertAdjacentHTML('beforeend', `<div class="callout"><b>Hint ${shown + 1}.</b> ${md(p.hints[shown]).replace(/^<p>|<\/p>$/g, '')}</div>`); shown++; hb.textContent = shown >= p.hints.length ? 'No more hints' : `Show hint ${shown + 1} of ${p.hints.length}`; if (shown >= p.hints.length) hb.disabled = true; };
    }

    /* try it */
    const tr = root.querySelector('#tryit');
    if (tr && p.n === 1) {
      tr.innerHTML = `<p>Run the handout program (open it in the sandbox, single-step with <b>Step</b>, and open the Memory tab at $4000). Then enter the <b>word</b> value at $4000 just before the program would loop back.</p>
        <div class="row"><button class="btn" id="open1">Open the program in the sandbox</button><input id="ans1" class="addr" style="width:120px" placeholder="$XXXX" aria-label="Word value at $4000 in hex" autocomplete="off"><button class="btn go" id="chk1">Check my answer</button></div><div id="res1" style="margin-top:10px"></div>`;
      tr.querySelector('#open1').onclick = () => { location.hash = '#/sandbox?c=' + enc(p.src); };
      tr.querySelector('#chk1').onclick = () => {
        const want = H().CHECKS[1](p.src).value, got = parseInt(tr.querySelector('#ans1').value.trim().replace(/^\$|^0x/i, ''), 16), box = tr.querySelector('#res1');
        if (Number.isNaN(got)) { box.innerHTML = '<div class="fb no"><h3>Enter a hex value</h3>Like $1234 (a word is four hex digits).</div>'; return; }
        if (got === want) { box.innerHTML = `<div class="fb ok"><h3>Correct!</h3>The word at $4000 is ${'$' + want.toString(16).toUpperCase()}. This value was computed just now by running the program on the emulator.</div>`; if (!done(S, 'hw2', 1)) { mark(S, 'hw2', 1); ctx.award(15, 'homework check'); } }
        else box.innerHTML = `<div class="fb no"><h3>Not yet</h3>You entered $${got.toString(16).toUpperCase()}. Re-check the byte order (the first byte stored goes at the lower address, which is the high byte of the word) and the AND with $5555. Try another hint.</div>`;
      };
    } else if (tr) {
      tr.innerHTML = `<p>Write your program here. It is assembled and run on several test inputs; the checker preloads the data, so you do not need your own data block. End with <code>SIMHALT</code>.</p>
        <textarea id="code" class="hwcode" wrap="off" spellcheck="false" autocapitalize="off" aria-label="Your program">${esc(H().SKELETON[p.n])}</textarea>
        <div class="row" style="margin-top:8px"><button class="btn go" id="runchk">Run checks</button><button class="btn" id="opensb">Open in sandbox</button><button class="btn ghost" id="reset">Reset</button></div><div id="chkres" style="margin-top:10px"></div>`;
      const ta = tr.querySelector('#code');
      ta.addEventListener('keydown', (e) => { if (e.key === 'Tab') { e.preventDefault(); ta.setRangeText('        ', ta.selectionStart, ta.selectionEnd, 'end'); } });
      tr.querySelector('#reset').onclick = () => { ta.value = H().SKELETON[p.n]; tr.querySelector('#chkres').innerHTML = ''; };
      tr.querySelector('#opensb').onclick = () => { location.hash = '#/sandbox?c=' + enc(ta.value); };
      tr.querySelector('#runchk').onclick = () => {
        const res = H().CHECKS[p.n](ta.value), box = tr.querySelector('#chkres');
        if (res.error) { box.innerHTML = `<div class="fb no"><h3>Could not run it</h3><pre class="code" style="white-space:pre-wrap">${esc(res.error)}</pre></div>`; return; }
        const all = res.results.every((r) => r.ok);
        box.innerHTML = `<div class="fb ${all ? 'ok' : 'no'}"><h3>${all ? 'All checks passed!' : 'Some checks failed'}</h3><div class="tablewrap"><table class="gt"><thead><tr><th></th><th>Test</th><th>Expected</th><th>Got</th></tr></thead><tbody>${res.results.map((r) => `<tr><td>${r.ok ? '✔' : '✘'}</td><td class="mono" style="white-space:normal">${esc(r.name)}</td><td class="mono" style="white-space:normal">${esc(r.want)}</td><td class="mono" style="white-space:normal">${esc(r.got)}</td></tr>`).join('')}</tbody></table></div></div>`;
        if (all && !done(S, 'hw2', p.n)) { mark(S, 'hw2', p.n); ctx.award(25, 'homework problem ' + p.n); }
      };
    }

    /* solutions + trace */
    const sb = root.querySelector('#solbox');
    if (sb) {
      const solHtml = (sol.length ? sol : [{ title: 'Program', code: p.src }]).map((s, i) => `<div class="panel" style="margin-bottom:10px"><h3>${esc(s.title)}</h3><pre class="code">${esc(s.code || p.src)}</pre><div class="row"><button class="btn" data-open="${i}">Open in sandbox</button><button class="btn" data-trace="${i}">Trace it step by step</button></div><div data-tr="${i}"></div></div>`).join('');
      sb.innerHTML = `<p class="stat">${esc(p.verified)}</p>${solHtml}`;
      const list = sol.length ? sol : [{ code: p.src }];
      sb.querySelectorAll('[data-open]').forEach((b) => (b.onclick = () => { location.hash = '#/sandbox?c=' + enc(list[+b.dataset.open].code || p.src); }));
      sb.querySelectorAll('[data-trace]').forEach((b) => (b.onclick = () => { const i = +b.dataset.trace; const t = H().trace(list[i].code || p.src, p.trace && p.trace.preload); sb.querySelector(`[data-tr="${i}"]`).innerHTML = traceHtml(t); }));
    }
  }

  window.HomeworkUI = { viewList, viewProblem };
})();
