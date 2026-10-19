# Differential testing against the real EASy68K

These scripts compare this site's assembler and CPU (`js/asm.js`, `js/cpu.js`) with a real EASy68K used as a black-box oracle. They are developer tools and are **not** needed to use the site.

1. Build the open-source macOS port of EASy68K (`make asm68k sim68k` in https://github.com/mikewolak/EASy68K-macos). It is GPL/educational-use software; none of its code is included here.
2. Build the small harness that dumps registers and memory after a run (links against that port's `libsim68k.a`):
   `cc -std=c99 -O2 -D_DARWIN_C_SOURCE -I<port>/src/common -I<port>/src/asm -I<port>/src/sim harness.c -o osim <port>/build/lib/libsim68k.a <port>/build/lib/libcommon.a`
3. Put `osim` next to the port's `src/bin/asm68k` (or set `EASY68K_ORACLE` to a directory laid out as `src/bin/asm68k` + `osim`).
4. `node fuzz.js 3000 99` generates 3000 random instructions, assembles and runs each in both implementations, and compares machine code, D0-D7, A0-A7, flags and memory.
   `node cmp_asm.js program.X68` compares the machine code of a whole program line by line.

Known, intentional differences (the site follows Motorola's manual): MULS leaves V alone in EASy68K; DIVU/DIVS overflow leaves C alone; ABCD/SBCD/NBCD N and V are "undefined"; CHK exception frames differ. `ASL` by a register count larger than the operand size also differs (hardware sets V; EASy68K does not).
