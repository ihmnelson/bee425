/* Figures for Start here and Labs: our own SVG diagrams (FIGS) and lecture / handout images (IMAGES).
   A lesson places one with a line that holds only {{fig:name}} or {{img:name}}.
   Every diagram states only things already in the lesson text; colours come from the site's tokens so both themes work. */
(function (root) {
  'use strict';
  const svg = (w, h, label, body) => `<svg class="figsvg" viewBox="0 0 ${w} ${h}" role="img" aria-label="${label}"><title>${label}</title>${body}</svg>`;
  const T = (x, y, s, cls, anchor) => `<text x="${x}" y="${y}" class="${cls || 'fg-t'}"${anchor ? ` text-anchor="${anchor}"` : ''}>${s}</text>`;
  const box = (x, y, w, h, cls) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="4" class="${cls || 'fg-box'}"/>`;
  const dot = (x, y) => `<circle cx="${x}" cy="${y}" r="3.5" class="fg-dot"/>`;
  const defs = '<defs><marker id="fa" viewBox="0 0 10 10" refX="9" refY="5" markerUnits="userSpaceOnUse" markerWidth="12" markerHeight="12" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" class="fg-head"/></marker></defs>';

  const FIGS = {
    /* three buses joining the CPU, memory and I/O */
    system: svg(640, 280, 'A CPU, ROM, RAM and I/O all connected to a shared address bus, data bus and control bus',
      defs +
      T(112, 122, 'Address bus', 'fg-t', 'end') + T(112, 140, 'Data bus', 'fg-t', 'end') + T(112, 158, 'Control bus', 'fg-t', 'end') +
      '<line x1="120" y1="118" x2="620" y2="118" class="fg-line" marker-end="url(#fa)"/>' +
      '<line x1="120" y1="136" x2="620" y2="136" class="fg-line" marker-start="url(#fa)" marker-end="url(#fa)"/>' +
      '<line x1="120" y1="154" x2="620" y2="154" class="fg-line"/>' +
      box(20, 14, 220, 62, 'fg-box fg-hi') + T(130, 42, 'CPU', 'fg-tb', 'middle') + T(130, 62, 'fetches and runs instructions', 'fg-s', 'middle') +
      '<line x1="130" y1="76" x2="130" y2="154" class="fg-line"/>' + dot(130, 118) + dot(130, 136) + dot(130, 154) +
      box(130, 196, 140, 62) + T(200, 224, 'ROM', 'fg-tb', 'middle') + T(200, 244, 'keeps its contents', 'fg-s', 'middle') +
      box(290, 196, 140, 62) + T(360, 224, 'RAM', 'fg-tb', 'middle') + T(360, 244, 'loses its contents', 'fg-s', 'middle') +
      box(450, 196, 140, 62) + T(520, 224, 'I/O', 'fg-tb', 'middle') + T(520, 244, 'to the outside world', 'fg-s', 'middle') +
      [200, 360, 520].map((x) => `<line x1="${x}" y1="196" x2="${x}" y2="118" class="fg-line"/>` + dot(x, 118) + dot(x, 136) + dot(x, 154)).join('') +
      T(360, 28, 'Address: the CPU says <tspan class="fg-tb">where</tspan>', 'fg-s') + T(360, 48, 'Data: the value, <tspan class="fg-tb">both ways</tspan>', 'fg-s') + T(360, 68, 'Control: read or write, timing', 'fg-s')),

    /* fetch, decode, execute */
    cycle: svg(640, 215, 'The cycle a CPU repeats: fetch, decode, execute, then back to fetch',
      defs +
      box(20, 20, 180, 92) + T(110, 46, '1. Fetch', 'fg-tb', 'middle') + T(110, 68, 'read the word at the', 'fg-s', 'middle') + T(110, 86, 'address in the PC', 'fg-s', 'middle') + T(110, 104, 'PC moves on', 'fg-s', 'middle') +
      box(230, 20, 180, 92) + T(320, 46, '2. Decode', 'fg-tb', 'middle') + T(320, 68, 'work out which', 'fg-s', 'middle') + T(320, 86, 'instruction those', 'fg-s', 'middle') + T(320, 104, 'bits mean', 'fg-s', 'middle') +
      box(440, 20, 180, 92) + T(530, 46, '3. Execute', 'fg-tb', 'middle') + T(530, 68, 'do it, reading any', 'fg-s', 'middle') + T(530, 86, 'extra words or', 'fg-s', 'middle') + T(530, 104, 'operands it needs', 'fg-s', 'middle') +
      '<line x1="200" y1="66" x2="228" y2="66" class="fg-line" marker-end="url(#fa)"/>' +
      '<line x1="410" y1="66" x2="438" y2="66" class="fg-line" marker-end="url(#fa)"/>' +
      '<path d="M530 112 V160 H110 V114" class="fg-line" fill="none" marker-end="url(#fa)"/>' +
      T(320, 184, 'repeat. A branch or jump just puts a different address in the PC.', 'fg-s', 'middle')),

    /* register sizes */
    regsizes: svg(640, 282, 'Register D0 shown as four bytes, with the byte, word and long parts marked, before and after MOVE.B #$FF,D0',
      T(20, 22, 'D0 = $12345678', 'fg-tb') +
      [['12', '31-24'], ['34', '23-16'], ['56', '15-8'], ['78', '7-0']].map((c, i) => box(120 + i * 110, 34, 110, 44) + T(175 + i * 110, 62, c[0], 'fg-mono', 'middle') + T(175 + i * 110, 94, 'bits ' + c[1], 'fg-s', 'middle')).join('') +
      '<path d="M122 108 H558" class="fg-line" fill="none"/><path d="M122 104 V112 M558 104 V112" class="fg-line"/>' + T(340, 128, '.L  all 32 bits', 'fg-t', 'middle') +
      '<path d="M342 142 H558" class="fg-line" fill="none"/><path d="M342 138 V146 M558 138 V146" class="fg-line"/>' + T(450, 162, '.W  low 16 bits', 'fg-t', 'middle') +
      '<path d="M452 176 H558" class="fg-line" fill="none"/><path d="M452 172 V180 M558 172 V180" class="fg-line"/>' + T(505, 196, '.B  low 8 bits', 'fg-t', 'middle') +
      T(20, 232, 'After MOVE.B #$FF,D0:  D0 = $123456FF', 'fg-tb') +
      box(120, 242, 110, 34) + T(175, 265, '12', 'fg-mono', 'middle') + box(230, 242, 110, 34) + T(285, 265, '34', 'fg-mono', 'middle') + box(340, 242, 110, 34) + T(395, 265, '56', 'fg-mono', 'middle') + box(450, 242, 110, 34, 'fg-box fg-hi') + T(505, 265, 'FF', 'fg-mono', 'middle')),

    /* byte order of a long word */
    endian: svg(640, 196, 'The long word $12345678 stored at $2000: big-endian puts 12 first, little-endian puts 78 first',
      T(20, 24, 'The long word $12345678 stored at address $2000', 'fg-tb') +
      ['$2000', '$2001', '$2002', '$2003'].map((a, i) => T(280 + i * 100, 52, a, 'fg-s', 'middle')).join('') +
      T(20, 90, '68000: big-endian', 'fg-t') + T(20, 108, 'most significant byte first', 'fg-s') +
      ['12', '34', '56', '78'].map((b, i) => box(230 + i * 100, 66, 100, 44, i === 0 ? 'fg-box fg-hi' : 'fg-box') + T(280 + i * 100, 94, b, 'fg-mono', 'middle')).join('') +
      T(20, 156, 'little-endian machine', 'fg-t') + T(20, 174, 'least significant byte first', 'fg-s') +
      ['78', '56', '34', '12'].map((b, i) => box(230 + i * 100, 132, 100, 44, i === 3 ? 'fg-box fg-hi' : 'fg-box') + T(280 + i * 100, 160, b, 'fg-mono', 'middle')).join('') +
      T(630, 192, 'shaded = the byte $12', 'fg-s', 'end')),

    /* ADD.W (A0)+,D0 */
    postinc: svg(640, 236, 'ADD.W (A0)+,D0 adds the word A0 points at to D0, then moves A0 forward by 2 bytes',
      defs +
      T(20, 22, 'ADD.W (A0)+,D0   with D0 = 0 before', 'fg-tb') +
      [['table', '10'], ['table+2', '20'], ['table+4', '30'], ['table+6', '40']].map((c, i) => T(150 + i * 110, 56, c[0], 'fg-s', 'middle') + box(100 + i * 110, 64, 100, 44, i === 0 ? 'fg-box fg-hi' : 'fg-box') + T(150 + i * 110, 92, c[1], 'fg-mono', 'middle')).join('') +
      '<line x1="150" y1="156" x2="150" y2="112" class="fg-line" marker-end="url(#fa)"/>' + T(150, 176, 'A0 before', 'fg-t', 'middle') +
      '<line x1="260" y1="156" x2="260" y2="112" class="fg-line fg-dash" marker-end="url(#fa)"/>' + T(260, 176, 'A0 after (+2)', 'fg-t', 'middle') +
      T(20, 206, 'Step 1: the word A0 points at (10) is added, so D0 = 10.', 'fg-s') + T(20, 224, 'Step 2: A0 moves on by the operand size, which is 2 bytes for .W.', 'fg-s')),

    /* the stack and BSR / RTS */
    stack: svg(640, 276, 'The stack grows downward. BSR pushes a 4-byte return address and moves SP down by 4; RTS pops it',
      defs +
      T(160, 20, 'Before BSR', 'fg-tb', 'middle') + T(480, 20, 'After BSR', 'fg-tb', 'middle') +
      T(20, 52, 'higher', 'fg-s') + T(20, 68, 'addresses', 'fg-s') + T(20, 242, 'lower', 'fg-s') + T(20, 258, 'addresses', 'fg-s') +
      box(100, 34, 120, 40) + T(160, 59, 'older data', 'fg-t', 'middle') +
      '<line x1="290" y1="54" x2="232" y2="54" class="fg-line" marker-end="url(#fa)"/>' + T(296, 59, 'SP', 'fg-tb') +
      '<path d="M160 82 V226" class="fg-dash fg-line" fill="none" marker-end="url(#fa)"/>' + T(160, 246, 'stack grows downward', 'fg-s', 'middle') +
      box(420, 34, 120, 40) + T(480, 59, 'older data', 'fg-t', 'middle') +
      box(420, 74, 120, 56, 'fg-box fg-hi') + T(480, 98, 'return address', 'fg-t', 'middle') + T(480, 118, '(4 bytes)', 'fg-s', 'middle') +
      '<line x1="610" y1="102" x2="552" y2="102" class="fg-line" marker-end="url(#fa)"/>' + T(580, 126, 'SP', 'fg-tb', 'middle') + T(580, 146, '4 bytes', 'fg-s', 'middle') + T(580, 162, 'lower', 'fg-s', 'middle') +
      T(480, 190, 'RTS pops the return address into the PC', 'fg-s', 'middle') + T(480, 208, 'and SP moves back up by 4.', 'fg-s', 'middle')),

    /* page decoding, small example */
    decode: svg(640, 332, 'Address lines A15 to A12 go to a decoder that selects one of the 4 KB chips; A11 to A0 go to every chip',
      defs +
      T(20, 22, 'A15-A12', 'fg-tb') + T(20, 40, 'page select', 'fg-s') +
      '<line x1="20" y1="74" x2="100" y2="74" class="fg-thick" marker-end="url(#fa)"/>' + T(60, 64, '4 lines', 'fg-s', 'middle') +
      box(104, 40, 120, 190) + T(164, 118, 'decoder', 'fg-tb', 'middle') + T(164, 138, 'one output', 'fg-s', 'middle') + T(164, 156, 'on at a time', 'fg-s', 'middle') +
      [0, 1, 2, 3].map((k) => { const y = 56 + k * 54; return `<line x1="224" y1="${y}" x2="330" y2="${y}" class="fg-line" marker-end="url(#fa)"/>` + T(278, y - 8, 'CS' + k, 'fg-s', 'middle') + box(334, y - 22, 170, 44) + T(419, y - 3, '4 KB chip ' + k, 'fg-t', 'middle') + T(419, y + 14, ['$0000-$0FFF', '$1000-$1FFF', '$2000-$2FFF', '$3000-$3FFF'][k], 'fg-mono-s', 'middle'); }).join('') +
      T(164, 248, '(outputs 4 to 15 not shown)', 'fg-s', 'middle') +
      '<line x1="580" y1="34" x2="580" y2="224" class="fg-thick"/>' + [0, 1, 2, 3].map((k) => { const y = 56 + k * 54; return `<line x1="504" y1="${y}" x2="580" y2="${y}" class="fg-line"/>` + dot(580, y); }).join('') +
      T(580, 258, 'A11-A0', 'fg-tb', 'middle') + T(580, 276, 'offset, 12 lines', 'fg-s', 'middle') + T(580, 294, 'to every chip', 'fg-s', 'middle') +
      T(20, 318, 'Example: address $2A5C has A15-A12 = 0010, so CS2 is on; the offset $A5C is where inside chip 2.', 'fg-s')),
  };

  /* lecture slides and handout figures; src is relative to index.html */
  const IMAGES = {
    'L4-s8': ['img/slides/L4-s8.png', 'Slide: 68000 assembly language and machine language, with example op-code words', 'Lecture 4, slide 152 (PDF page 8): op-code words, e.g. NOP = $4E71'],
    'L5-s6': ['img/slides/L5-s6.png', 'Slide: Mode 2, address register indirect addressing', 'Lecture 5, slide 203 (PDF page 6): Mode 2, address register indirect'],
    'L5-s10': ['img/slides/L5-s10.png', 'Slide: Modes 3 and 4, auto-incrementing', 'Lecture 5, slide 207 (PDF page 10): Modes 3 and 4, post-increment and pre-decrement'],
    'L6-s4': ['img/slides/L6-s4.png', 'Slide: two AND gates driving the same bus wire to different levels, a short circuit called bus contention', 'Lecture 6, slide 259 (PDF page 4): bus contention'],
    'L6-s8': ['img/slides/L6-s8.png', 'Slide: tri-state bus organization, a logic function followed by a switch that connects or isolates it from the bus', 'Lecture 6, slide 263 (PDF page 8): tri-state bus organization'],
    'L6-s25': ['img/slides/L6-s25.png', 'Slide: little endian and big endian memory layouts', 'Lecture 6, slide 280 (PDF page 25): little endian and big endian'],
    'L7-s2': ['img/slides/L7-s2.png', 'Slide: page decoding logic, a NAND gate on A23 to A15 producing the chip select for the page at $FF8000 to $FFFFFF', 'Lecture 7, slide 295 (PDF page 2): page decoding logic'],
    'L7-s4': ['img/slides/L7-s4.png', 'Slide: memory decoding logic example 3, the page at page address $1A4 with the bit pattern 1 1010 0100', 'Lecture 7, slide 297 (PDF page 4): decoding the page at $1A4'],
    'L8-s15': ['img/slides/L8-s15.png', 'Slide: transistor biasing, a resistor sets the base current and the worst-case beta is used', 'Lecture 8, slide 355 (PDF page 15): transistor biasing'],
    'L8-s16': ['img/slides/L8-s16.png', 'Slide: worked example sizing the base resistor for 100 mA with beta of at least 75', 'Lecture 8, slide 356 (PDF page 16): the base resistor example'],
    'lab2-fig1': ['img/slides/lab2-fig1.png', 'Timing diagram for a Z80 op-code fetch cycle, T1 to T4 with CLK, address, MREQ, RD, M1 and data', 'Lab 2 handout, Figure 1: timing diagram for a Z80 op-code fetch cycle'],
    'lab2-fig2': ['img/slides/lab2-fig2.png', 'Timing diagram for Z80 memory read and write cycles, three clock cycles each', 'Lab 2 handout, Figure 2: memory timing for read and write operations other than op-code fetches'],
  };

  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  function place(html) {
    return html.replace(/<p>\{\{(fig|img):([\w-]+)\}\}<\/p>/g, (m, kind, name) => {
      if (kind === 'fig' && FIGS[name]) return `<figure class="fig">${FIGS[name]}</figure>`;
      if (kind === 'img' && IMAGES[name]) { const [src, alt, cap] = IMAGES[name]; return `<figure class="fig"><img class="figimg" src="${src}" alt="${esc(alt)}" loading="lazy"><figcaption>${esc(cap)}</figcaption></figure>`; }
      return m;
    });
  }
  root.FIGURES = { FIGS, IMAGES, place };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.FIGURES;
})(typeof window !== 'undefined' ? window : globalThis);
