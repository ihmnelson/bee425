// The assembler "test example" printed in the Oshonsoft Z80 help (Assembler overview > Directives/Expressions),
// with the values worked out by hand from the documented operator rules.
'use strict';
const { assemble } = require('../../js/z80/asm.js');
const src = `   lab1    equ 100*2  ;C8
        lab2 equ 0x1264
   lab3    = 2
   lab4    equ 0x2345
        ld a,lab1-0x10
        ld a,0x55
        ld a,<lab2
        ld a,55h^0xfe+1
        ld a,$55
        ld a,h'55'
        ld a,-1
        ld a,-lab3
        ld a,0x55+0x10
        ld a,0x10*8
        ld a,128/lab3
        ld a,$-2
        ld a,high (0x1234+lab4)
        ld a,low lab4
        ld (ix-0x4-lab3),a
        ld a,128\\lab3
`;
// 55h ^ (0xfe+1) = 0x55 ^ 0xFF = 0xAA   (+ binds tighter than ^)
const want = [0xB8, 0x55, 0x64, 0xAA, 0x55, 0x55, 0xFF, 0xFE, 0x65, 0x80, 0x40, 0x3E - 0 , 0x35, 0x45];
const r = assemble(src);
if (!r.ok) { console.log('errors', r.errors); process.exit(1); }
const imm = r.listing.filter((l) => l.inst && l.bytes[0] === 0x3E).map((l) => l.bytes[1]);
// $-2 is the address of the line minus 2: its address is 0x1E+... compute from the listing
const dollar = r.listing.find((l) => /\$-2/.test(l.text)); const wantDollar = (dollar.addr - 2) & 0xFF;
const expected = [0xB8, 0x55, 0x64, 0xAA, 0x55, 0x55, 0xFF, 0xFE, 0x65, 0x80, 0x40, wantDollar, 0x35, 0x45, 0x40];
const ix = r.listing.find((l) => /ix-0x4/.test(l.text)).bytes;
let bad = 0;
imm.forEach((v, i) => { if (v !== expected[i]) { bad++; console.log(`line ${i}: got ${v.toString(16)} want ${expected[i].toString(16)}`); } });
if (ix.join() !== [0xDD, 0x77, 0xFA].join()) { bad++; console.log('ix', ix); }
console.log(bad ? `${bad} mismatches` : `Oshonsoft help test example: ${imm.length + 1} lines assembled as documented`);
process.exit(bad ? 1 : 0);
