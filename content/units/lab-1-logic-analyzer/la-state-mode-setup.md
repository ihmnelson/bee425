---
track: shared
title: "Setting up the logic analyzer for a state measurement"
summary: "Connect ground and clock, group the data bits, sample in state mode on the correct clock edge, and trigger on a pattern."
needs: ["pseudorandom-generator", "debug-tools.logic-analyzer-tool"]
sources:
  - { type: handout, ref: "lab1 Intro", quote: "The LogicPort can sample 32 signals + 2 clock signals, at up to 500 MHz" }
  - { type: handout, ref: "lab1 Step 2", quote: "have the LA connected to the PC (LA yellow light is on) before applying power to the board" }
  - { type: handout, ref: "lab1 III", quote: "Should you attempt to acquire data while the outputs are changing?" }
  - { type: handout, ref: "lab1 III", quote: "pre-trigger buffer to 1%" }
checks:
  - gen: lab.patternOnes
  - gen: lab.patternOnes
  - type: choice
    prompt: "In state mode, which clock does the analyzer use to decide when to record?"
    options: ["The system (circuit board) clock, CLK1, on the edge you choose; it should not be the edge where the outputs are changing", "Its own internal 500 MHz clock", "No clock", "The USB clock"]
    answer: 0
    explain: "State mode uses the board's clock as the external sample clock. The D flip-flops change on the rising edge, so sampling on the rising edge risks capturing outputs while they are changing; the lab asks you to decide and justify the edge."
  - type: choice
    prompt: "What does a **pre-trigger buffer** of 1% mean?"
    options: ["Only 1% of the memory holds states from before the trigger; the rest is after", "The trigger arrives 1% of the time", "1% of signals are traced", "The clock is 1% slower"]
    answer: 0
    explain: "The number of states saved before the trigger is 1% of the analyzer memory (the smallest the lab uses), so most of the buffer shows what follows the trigger."
  - type: choice
    prompt: "In what order do you connect the power and the analyzer?"
    options: ["Analyzer connected to the PC (yellow light on) first, then power the board; reverse the order when turning off", "Board power first", "Together", "Order does not matter"]
    answer: 0
    explain: "Have the logic analyzer connected before applying power to the board; turn the board off first and then disconnect the analyzer. Also check polarity before plugging in the supply, and touch the bench ground plate to avoid static damage."
card:
  front: "How do you set up and trigger a state measurement in Lab 1?"
  back: "Connect GND, D0-D7 and CLK1 (D7 is the MSB); group the 8 data signals; check the wire status shows T (toggling); set State Mode with the board clock on the chosen edge; pre-trigger 1%; trigger immediate, or pattern A = data value by setting each bit 1/0/X. Pre-trigger states show as negative time."
glossary:
  - { term: "Pattern trigger", def: "A trigger condition made of 1, 0 or X (don't care) values for each channel." }
  - { term: "State mode", def: "A sampling mode in which the analyzer records data on the target's clock." }
---

## Learn

**The instrument.** The Intronix **LogicPort** is a measurement head connected by USB to an application on the lab PC. It samples **32 signals plus 2 clock signals at up to 500 MHz** and is powered from the PC's USB port (the yellow LED shows it is powered), so it shares the PC's ground: be careful with grounds, and measure between grounds if in doubt.

**Connections for the lab:** the board's ground, the clock (CLK1) and eight data bits D0-D7 (D7 is the most significant). The 8-bit output is shown as two hexadecimal digits, giving 256 possible numbers.

**Set-up:** remove default signals, add CLK1 and Data0-Data7, make a **group** (for example PNG-data) so the eight bits read as hex, save the set-up (not on the lab desktop). Check **Wire Status** shows **T** (toggling) for every signal.

**State mode:** *Setup > Sample mode > State mode (external sample clock)*. Choose the clock edge carefully: the D-FFs change on the rising edge, so should you sample while the outputs are changing? Set the time base to the crystal frequency (it does not change the states, only the timing display). Set the **pre-trigger buffer to 1%**, use *Trigger Immediate*, and read the *State List*.

**Pattern trigger:** to trigger on E5h, set Data7..Data0 = 1,1,1,0,0,1,0,1 in the Pattern A column (click each bit to cycle 1, 0, X), then Setup > Trigger > Pattern A is True. Time before the trigger is shown as negative. Export to CSV for Excel, and count how many states occur before the sequence cycles.

## Worked example

*Pattern for the byte 5Ah?*

1. 5Ah = 0101 1010 binary.
2. Data7..Data0 = 0,1,0,1,1,0,1,0.
3. Four of the eight bits are 1.

## Try it

*How can you tell from the analyzer that a channel is connected and active?*

???

The Wire Status column shows a **T** for toggling. A channel stuck high or low is wrong (except ground); check the connections, probe with an oscilloscope, or ask the instructor.
