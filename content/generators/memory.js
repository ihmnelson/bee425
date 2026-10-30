/* Question generators for the Memory decoding unit.
   make(rand)  -> a check object ({type, prompt, answer, display, explain, ...}); params are kept in check.params.
   verify(chk) -> the expected numeric answer worked out a DIFFERENT way (counting, doubling, enumerating), which
                  the audit compares with chk.answer over many seeds. make() uses the formulas; verify() must not.
*/

const hex = (n, digits) => '$' + n.toString(16).toUpperCase().padStart(digits, '0');
const kb = (n) => (n >= 1048576 ? `${n / 1048576} MB` : n >= 1024 ? `${n / 1024} KB` : `${n} bytes`);
const k = (n) => (n >= 1048576 ? `${n / 1048576}M` : n >= 1024 ? `${n / 1024}K` : `${n}`);

/* ---- How many bytes do n address lines reach? ---- */
const addressBytes = {
  make(rand) {
    const n = rand.pick([10, 12, 14, 16, 18, 20, 22, 24]);
    const size = 2 ** n;
    return {
      type: 'numeric', params: { n },
      prompt: `A processor has **${n} address lines**. How many different byte addresses can it reach? (Decimal is fine, or hex such as $10000.)`,
      answer: size, display: `${size.toLocaleString('en-US')} (${kb(size)})`,
      explain: `Each address line is one bit, so ${n} lines give 2^${n} = ${size.toLocaleString('en-US')} different addresses (${kb(size)}).`,
    };
  },
  verify({ params: { n } }) { return parseInt('1'.repeat(n), 2) + 1; },   /* highest address is all ones; count includes address 0 */
};

/* ---- Chips needed across the data bus ---- */
const chipsPerPage = {
  make(rand) {
    const bus = rand.pick([8, 16]);
    const w = rand.pick([1, 2, 4, 8, 16].filter((x) => x <= bus));
    const depth = rand.pick([64 * 1024, 128 * 1024, 256 * 1024, 512 * 1024]);
    return {
      type: 'numeric', params: { bus, w, depth },
      prompt: `A system has a **${bus}-bit data bus**. It is built from static RAM chips organised as **${k(depth)} x ${w}**. How many chips does **one page** contain?`,
      answer: bus / w, display: String(bus / w),
      explain: `Every chip supplies ${w} of the ${bus} data bits, and a page must supply all ${bus} bits at the same address, so a page needs ${bus} / ${w} = ${bus / w} chips side by side. (The ${k(depth)} depth sets how many addresses the page covers, not how many chips are in it.)`,
    };
  },
  verify({ params: { bus, w } }) { let lanes = 0, covered = 0; while (covered < bus) { covered += w; lanes++; } return lanes; },
};

/* ---- Offset bits, page bits, pages, chips ---- */
const ASKS = {
  offset: 'How many **offset bits** (address lines that go straight to the chips) are there?',
  page: 'How many **page bits** (address lines that go to the decoder) are there?',
  pages: 'How many **pages** are needed to fully populate the address space?',
  chips: 'How many **chips** are needed to fully populate the address space?',
};
const pageLayout = {
  make(rand) {
    const addr = rand.pick([20, 22, 24]);
    const bus = 8;
    const w = rand.pick([1, 2, 4, 8]);
    const depth = rand.pick([64 * 1024, 128 * 1024, 256 * 1024, 512 * 1024]);
    const ask = rand.pick(Object.keys(ASKS));
    const offset = Math.log2(depth), pageBits = addr - offset, pages = 2 ** pageBits, per = bus / w;
    const answer = { offset, page: pageBits, pages, chips: pages * per }[ask];
    return {
      type: 'numeric', params: { addr, bus, w, depth, ask },
      prompt: `A processor has a **${addr}-bit address bus** and an **${bus}-bit data bus**. The memory is built from ${k(depth)} x ${w} static RAM chips and is **fully populated**. ${ASKS[ask]}`,
      answer, display: String(answer),
      explain: `One chip holds ${k(depth)} locations, so a page covers ${k(depth)} addresses = 2^${offset}: **${offset} offset bits** (A0-A${offset - 1}). The other ${addr} - ${offset} = **${pageBits} page bits** (A${offset}-A${addr - 1}) give 2^${pageBits} = **${pages} pages**. Each page needs ${bus} / ${w} = ${per} chips, so ${pages} x ${per} = **${pages * per} chips**.`,
    };
  },
  verify({ params: { addr, bus, w, depth, ask } }) {
    let offset = 0; while ((1 << offset) < depth) offset++;           /* smallest b with 2^b >= depth */
    const pageBits = addr - offset;
    let pages = 1; for (let i = 0; i < pageBits; i++) pages *= 2;
    let per = 0; for (let got = 0; got < bus; got += w) per++;
    return { offset, page: pageBits, pages, chips: pages * per }[ask];
  },
};

/* ---- First or last address of a page ---- */
const pageRange = {
  make(rand) {
    const addr = rand.pick([20, 24]);
    const depth = rand.pick([64 * 1024, 128 * 1024, 256 * 1024]);
    const pages = 2 ** addr / depth;
    const page = rand.int(1, Math.min(pages - 1, 7));
    const ask = rand.pick(['start', 'end']);
    const digits = addr / 4, start = page * depth, end = start + depth - 1;
    return {
      type: 'numeric', params: { addr, depth, page, ask },
      prompt: `Memory on a ${addr}-bit address bus is built in pages of **${k(depth)}** addresses (one byte each). What is the **${ask === 'start' ? 'first' : 'last'} address of page ${page}**, in hex? (Pages are numbered from 0.)`,
      answer: hex(ask === 'start' ? start : end, digits), display: hex(ask === 'start' ? start : end, digits),
      explain: `A page holds ${depth.toLocaleString('en-US')} = ${hex(depth, digits)} addresses. Page ${page} starts at ${page} x ${hex(depth, digits)} = ${hex(start, digits)} and ends one before the next page: ${hex(end, digits)}.`,
    };
  },
  verify({ params: { addr, depth, page, ask } }) {
    let first = 0; for (let p = 0; p < page; p++) first += depth;       /* walk page by page */
    return ask === 'start' ? first : first + depth - 1;
  },
};

/* ---- How many page-bit lines must be 0 for a page? (inverters before the NAND) ---- */
const zerosInPage = {
  make(rand) {
    const bits = rand.pick([4, 6, 8, 9]);
    const page = rand.int(1, 2 ** bits - 2);
    const bin = page.toString(2).padStart(bits, '0');
    const zeros = [...bin].filter((c) => c === '0').length;
    return {
      type: 'numeric', params: { bits, page },
      prompt: `A page is selected by ${bits} page-bit lines. To select page **${page.toString(2).padStart(bits, '0')}** (binary) with a NAND gate, how many of the ${bits} lines need an **inverter** in front of the NAND?`,
      answer: zeros, display: String(zeros),
      explain: `The NAND output goes low only when every input is 1. A line that must be 0 for this page has to be inverted first so it reads 1. Page ${bin} has ${zeros} zeros, so ${zeros} inverters.`,
    };
  },
  verify({ params: { bits, page } }) { let z = 0, p = page; for (let i = 0; i < bits; i++) { if (p % 2 === 0) z++; p = Math.floor(p / 2); } return z; },
};

export const generators = {
  'memory.addressBytes': addressBytes,
  'memory.chipsPerPage': chipsPerPage,
  'memory.pageLayout': pageLayout,
  'memory.pageRange': pageRange,
  'memory.zerosInPage': zerosInPage,
};
