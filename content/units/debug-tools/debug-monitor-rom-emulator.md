---
track: shared
title: "Debug monitors and ROM emulators"
summary: "A monitor is cheap and gives run control but needs stable hardware and perturbs real time; a ROM emulator replaces the ROM and can trace it."
needs: [embedded-systems-and-process]
sources:
  - { type: slide, ref: "L11 s501", quote: "Debug monitor is the simplest way to debug a microprocessor system" }
  - { type: slide, ref: "L11 s502", quote: "Cannot set a breakpoint in ROM" }
  - { type: slide, ref: "L11 s504", quote: "Needs a stable memory in the target, so its not suitable for hw turn-on" }
  - { type: slide, ref: "L11 s506", quote: "Can set breakpoints in “ROM”" }
checks:
  - type: choice
    prompt: "Which is a **disadvantage of a debug monitor**?"
    options: ["It needs stable target memory and a communications link, runs code slower than real time, and cannot set breakpoints in ROM", "It is expensive", "It cannot single step", "It needs an emulator chassis"]
    answer: 0
    explain: "A monitor is simple and low cost ($0 to under $1K) and gives most of what software designers need, but it requires stable memory (so it is not suitable for hardware turn-on), a serial link, is not real time, will not run in ROM, and may lose control if the code is not well behaved."
  - type: choice
    prompt: "How does a debugger set a **breakpoint** in RAM code?"
    options: ["It replaces the instruction with a trap to the debugger entry point and saves the original instruction in its database", "It stops the clock", "It removes the instruction", "It copies the program to ROM"]
    answer: 0
    explain: "The debugger inserts a trap vector in place of the instruction at the breakpoint and moves the original instruction to the debugger's database for safe keeping."
  - type: choice
    prompt: "What advantage does a **ROM emulator** have over a monitor?"
    options: ["It plugs into the ROM socket, downloads code quickly, can trace ROM activity in real time, set breakpoints in 'ROM' and provide a virtual UART", "It is free", "It needs no target", "It replaces the processor"]
    answer: 0
    explain: "A ROM emulator is cost-effective ($1K-$5K), generic across memory configurations, supports large overlay memory, traces ROM code in real time and gives a virtual UART so the target needs no serial port."
  - type: choice
    prompt: "What are the **limits** of ROM emulation?"
    options: ["The target memory must be stable; it only works for code in standard ROMs (not ASICs or on-chip ROM microcontrollers); real-time trace needs code executing from ROM, not copied to RAM", "It works on any chip", "It needs a monitor", "It has no limits"]
    answer: 0
    explain: "ROM emulation requires stable target memory and only works where the code is in standard ROM memories; special ASICs and microcontrollers with on-chip ROM (like the 8751) are out, and many targets copy code to RAM for speed, which defeats the real-time trace."
card:
  front: "Compare a debug monitor and a ROM emulator."
  back: "Monitor: code (in ROM or loaded) with serial link; run control (examine memory/registers, step, breakpoint, load) but not real time, needs stable memory, can be trashed by runaway code. Cost $0-<$1K. ROM emulator: replaces the ROM via its socket; fast download, real-time trace of ROM code, breakpoints in ROM, virtual UART; needs stable memory and standard ROM; $1K-$5K."
glossary:
  - { term: "Debug monitor", def: "A block of code in the target that gives run control (examine, step, breakpoint, load) over a serial link; the simplest debug tool." }
---

## Learn

**Debug monitor:** the simplest way to debug a microprocessor system. It assumes the **processor and memory are stable**. It is a block of code that may be linked into the user's code, loaded separately (taking over key interrupt vectors) or resident in ROM; it talks to the host over a serial (RS-232) or Ethernet link, and overrides execution by being a higher-priority interrupt.

- **Run control:** examine and modify memory and registers, single step, run to a breakpoint, load code.
- **Breakpoint:** the debugger replaces the instruction with a trap to its entry point and keeps the original; each single step saves and restores the whole machine context.
- **Pros:** low cost ($0 to under $1K), provides most services software designers need, simple serial link, good once hardware is stable.
- **Cons:** needs stable target memory (not for hardware turn-on); the debug kernel is a serious perturbation: the application stops, interrupts are disabled, code is not at full speed, cannot trace in real time; cannot set breakpoints in ROM; needs a serial resource; can be trashed by runaway code.

**ROM emulator:** a quick way to download ROM-based code into a target through the **ROM socket**, with a **virtual UART** so a target without a serial port can still talk to the debugger. **Advantages:** cost-effective ($1K-$5K), generic, high-speed download, large overlay memory, **real-time trace of ROM code**, **breakpoints in "ROM"**. **Limits:** stable memory required; only for code in standard ROMs (not ASICs or on-chip-ROM microcontrollers); real-time trace only if the program executes directly from ROM, not from RAM.

## Worked example

*A new board's RAM is not yet working. Can you use a debug monitor on it?*

1. The monitor needs stable memory in the target.
2. The RAM is suspect, so the monitor itself cannot run reliably.
3. Use a **ROM emulator** or logic analyzer to bring up the hardware first.

## Try it

*Why cannot a software breakpoint be placed in ROM?*

???

A software breakpoint works by overwriting the instruction with a trap; ROM cannot be written. A ROM emulator or in-circuit emulator substitutes writable memory, so there you can set breakpoints.
