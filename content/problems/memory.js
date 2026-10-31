/* Multi-part memory design (practice Problem 3), for 8-, 16- and 32-bit data buses as in the lectures.
   make() uses the page/offset formulas (shifts, logs); verify() rebuilds every answer by counting and enumeration: chips are
   added until the data bus is full, pages are laid end to end until the address space is covered, and ranges are
   accumulated page by page.
   Wide-bus convention (Lesson 7): a page is one chip per byte lane, so its size is (bus bytes) x (chip depth); the address
   lines below the bus width in bytes (A0 on a 16-bit bus, A0-A1 on a 32-bit bus) are implied by the byte strobes and are
   not routed to the chips. */
const hx = (n, d) => '$' + n.toString(16).toUpperCase().padStart(d, '0');
const K = 1024, M = 1024 * 1024;
const kstr = (n) => (n >= M ? `${n / M}M` : n >= K ? `${n / K}K` : `${n}`);
const bytes = (n) => (n >= M ? `${n / M} MB` : `${n / K} KB`);
const ORGS = { 8: [[64 * K, 8], [128 * K, 8], [256 * K, 8], [256 * K, 4], [128 * K, 4], [512 * K, 2], [256 * K, 2], [M, 1], [512 * K, 1], [64 * K, 4], [128 * K, 2]],
  16: [[64 * K, 8], [128 * K, 8], [256 * K, 8], [512 * K, 8], [128 * K, 4], [256 * K, 4], [256 * K, 16], [128 * K, 16], [64 * K, 16]],
  32: [[256 * K, 8], [512 * K, 8], [M, 16], [512 * K, 16], [256 * K, 16], [M, 8], [2 * M, 8]] };
const lg = (n) => Math.log2(n);

export const memoryDesign = {
  id: 'memory-design',
  title: 'Memory system design',
  concepts: ['memory-decoding.chip-organization', 'memory-decoding.pages-and-offsets', 'memory-decoding.page-ranges', 'memory-systems.memory-design-steps', 'memory-systems.bus-width-endianness'],
  conventions: 'Addresses are byte addresses. A page is the set of chips side by side that together supply the whole data bus, so a page holds (bus width in bytes) x (chip depth) bytes. K = 1,024 and M = 1,048,576. Address lines are numbered from A0. On a 16-bit bus A0 is implied by the byte write strobes, and on a 32-bit bus A0 and A1 are; implied lines are not routed to the chips. Offset lines go to the chips and page lines go to the decoder.',
  make(r, { bus: forceBus } = {}) {
    const bus = forceBus || r.pick([8, 8, 16, 32]), bb = bus / 8, k = lg(bb);
    const addr = bus === 32 ? r.pick([24, 26]) : r.pick([20, 22, 24]);
    const [depth, w] = r.pick(ORGS[bus].filter(([d]) => d * bb < 2 ** addr / 4));
    const d = lg(depth), pageBytes = depth * bb, pageLo = k + d, pageBits = addr - pageLo, pages = 2 ** pageBits, per = bus / w;
    const nShow = r.pick([3, 4]), mem = depth * w;
    const probePage = r.int(1, pages - 1), probeOff = r.int(0, pageBytes - 1), probe = probePage * pageBytes + probeOff;
    const popPages = r.int(2, Math.min(6, pages - 1)), popBytes = popPages * pageBytes;
    const org = `${kstr(depth)} x ${w}`, chipSize = mem >= M ? `${mem / M} Mbit` : `${mem / K} Kbit`;
    const range = [];
    for (let i = 0; i < nShow; i++) range.push(i * pageBytes, i * pageBytes + pageBytes - 1);
    const dig = Math.ceil(addr / 4), odig = Math.ceil(lg(pageBytes) / 4);
    const impl = k ? ` (A0${k > 1 ? '-A' + (k - 1) : ''} ${k > 1 ? 'are' : 'is'} implied by the byte strobes and not counted)` : '';
    const parts = [
      { label: 'a', kind: 'numeric', prompt: 'How many RAM chips are on each page?', answer: per, display: String(per), explain: `The bus is ${bus} bits wide and each chip supplies ${w}, so ${bus} / ${w} = **${per}** chips side by side.` },
      { label: 'b', kind: 'numeric', prompt: 'How many RAM chips are needed to fully populate the memory space?', answer: pages * per, display: String(pages * per), explain: `Each page holds ${per} x ${kstr(depth)} x ${w} bits = ${bytes(pageBytes)}, and ${bytes(2 ** addr)} / ${bytes(pageBytes)} = ${pages} pages. ${pages} pages x ${per} chips = **${pages * per}** chips.` },
      { label: 'c', kind: 'numlist', prompt: `Which address lines are the offset bits and which are the page bits${impl}? Give four numbers: the lowest and highest offset line, then the lowest and highest page line (for example, A0-A9 and A10-A19 would be 0, 9, 10, 19).`, answer: [k, pageLo - 1, pageLo, addr - 1], display: `Offset A${k}-A${pageLo - 1}; page A${pageLo}-A${addr - 1}`, explain: `A chip has ${kstr(depth)} = 2^${d} locations, so ${d} lines address a location inside the chip: A${k}-A${pageLo - 1}${k ? ` (A0${k > 1 ? '-A' + (k - 1) : ''} ${k > 1 ? 'are' : 'is'} implied by the byte strobes)` : ''}. The remaining ${addr} - ${pageLo} = ${pageBits} lines (A${pageLo}-A${addr - 1}) are the page bits that feed the decoder.` },
      { label: 'd', kind: 'numeric', prompt: 'How many memory pages do we need?', answer: pages, display: String(pages), explain: `${pageBits} page bits give 2^${pageBits} = **${pages}** pages.` },
      { label: 'e', kind: 'hexlist', prompt: `What is the address range (hex) of the first ${nShow} pages? Give the start and end of each.`, answer: range, display: range.reduce((a, v, i) => a + (i % 2 ? `-${hx(v, dig)}` + (i < range.length - 1 ? ', ' : '') : hx(v, dig)), ''), explain: `Each page is ${bytes(pageBytes)} = ${hx(pageBytes, dig)}. Page n starts at n x ${hx(pageBytes, dig)} and ends ${hx(pageBytes - 1, dig)} higher.` },
      { label: 'f', kind: 'numeric', prompt: `Address ${hx(probe, dig)} is accessed. Which page (decimal, counting from 0) responds?`, answer: probePage, display: String(probePage), explain: `The page bits are the top ${pageBits} address lines: ${hx(probe, dig)} >> ${pageLo} = ${probePage}.` },
      { label: 'g', kind: 'numeric', prompt: `For the same address ${hx(probe, dig)}, what is the byte offset within the page (hex)?`, answer: probeOff, display: hx(probeOff, odig), explain: `The byte offset is the low ${pageLo} lines: ${hx(probe, dig)} AND ${hx(pageBytes - 1, dig)} = ${hx(probeOff, odig)}.` },
      { label: 'h', kind: 'numeric', prompt: `Only the lowest ${bytes(popBytes)} are populated. How many chips are needed?`, answer: popPages * per, display: String(popPages * per), explain: `${bytes(popBytes)} / ${bytes(pageBytes)} per page = ${popPages} pages, and ${popPages} x ${per} chips = **${popPages * per}**.` },
    ];
    return {
      family: 'memory-design', title: 'Memory system', concepts: this.concepts, conventions: this.conventions,
      prompt: `A microprocessor has a **${addr}-bit address bus** and a **${bus}-bit data bus**. Build a memory system from **${chipSize} static RAM chips organised as ${org}**, fully populated.`,
      parts, params: { addr, bus, depth, w, nShow, probe, popBytes },
    };
  },
  verify({ params: { addr, bus, depth, w, nShow, probe, popBytes } }) {
    let per = 0; for (let got = 0; got < bus; got += w) per++;                    /* chips side by side until the bus is full */
    const busBytes = bus / 8, pageBytes = depth * busBytes, space = 2 ** addr;
    const starts = []; for (let a = 0; a < space; a += pageBytes) starts.push(a);  /* pages laid end to end */
    const pages = starts.length;
    let implied = 0, toChips = 0;
    for (let j = 0; j < addr; j++) { const wgt = 2 ** j; if (wgt < busBytes) implied++; else if (wgt < pageBytes) toChips++; }
    const range = []; for (let i = 0; i < nShow; i++) range.push(starts[i], starts[i] + pageBytes - 1);
    let page = 0; while (starts[page + 1] !== undefined && starts[page + 1] <= probe) page++;
    let popPages = 0; for (let b = 0; b < popBytes; b += pageBytes) popPages++;
    return { a: per, b: pages * per, c: [implied, implied + toChips - 1, implied + toChips, addr - 1], d: pages, e: range, f: page, g: probe - starts[page], h: popPages * per };
  },
};
export const problems = { 'memory-design': memoryDesign };
