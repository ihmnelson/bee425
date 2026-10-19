# Verifying the Z80 simulator

These scripts check this site's CPU core (`js/cpu.js`), assembler (`js/asm.js`) and disassembler (`js/dis.js`) against independent references. They are developer tools and are not needed to use the site. Nothing from the reference tools is copied into the site.

| Script | Reference | What it checks |
|---|---|---|
| `vectors.js` | [SingleStepTests/z80](https://github.com/SingleStepTests/z80) (MIT) | 1,604 files x 1,000 cases: every opcode including undocumented ones. Compares all registers, the alternate set, flags (including undocumented bits 3 and 5), WZ, memory, port accesses and the exact T-state count. |
| `asmcheck.js` | `z80dasm` 1.2.0 (GPL, used as a black box) | Every opcode byte sequence is disassembled by z80dasm; its text is fed to our assembler and the bytes compared. |
| `discheck.js` | our own assembler | Every opcode sequence is disassembled by `js/dis.js`, re-assembled and compared. |

```
git clone --depth 1 https://github.com/SingleStepTests/z80       # about 1.6 GB
node vectors.js <path to z80/v1> [file-name filter] [tests per file]
brew install z80dasm        # for asmcheck.js
node asmcheck.js
node discheck.js
```

Results when this was written: 1,604,000 vector tests, 0 failures; 1,250 instruction forms against z80dasm, 0 mismatches (538 undefined sequences skipped); 1,788 disassembly round trips, 0 mismatches (132 are alternative encodings of the same instruction).

Known behaviours of the vectors worth knowing: they model an NMOS Z80 (the `LD A,I` / `LD A,R` interrupt quirk is implemented but not covered by the vectors), and they do not test interrupts or bus-level timing.
