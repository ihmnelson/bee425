---
track: shared
title: "Timing mode and measuring propagation delay"
summary: "Sample at 500 MHz, place cursors on the clock edge and on the data change, and compare the delay with the data sheets."
needs: ["la-state-mode-setup", "pcb-design.clock-skew"]
sources:
  - { type: handout, ref: "lab1 Step 2", quote: "set the Sample Rate to 500 Mhz" }
  - { type: handout, ref: "lab1 Step 2", quote: "determine the propagation delay from the rising edge of the clock to the data becoming stable" }
  - { type: handout, ref: "lab1 Step 2", quote: "74LS175 (Quad D-FF) and the 74LS86 (Quad, 2-input XOR gate)" }
  - { type: handout, ref: "lab1 Step 2", quote: "What is the critical path through the circuit that determines the maximum operating frequency" }
checks:
  - gen: lab.laResolution
  - type: choice
    prompt: "How do you measure the propagation delay from the clock to the data?"
    options: ["Put cursor A on a rising clock edge and B where the data settles, then read the interval", "Count the states between the two edges in the state list", "Read the clock period from the timing display", "Measure the delay with a multimeter on the data line"]
    answer: 0
    explain: "In timing mode at 500 MHz, right-click the trace to place cursors A and B and read the time between them from the measurement bar."
  - type: choice
    prompt: "Which parts does the measured clock-to-data delay include?"
    options: ["The flip-flop clock-to-output delay plus the XOR gates in the path", "Only the delay of the clock source feeding the flip-flops", "Only the delay of the probe cable to the analyzer", "The USB link delay between the analyzer and the PC"]
    answer: 0
    explain: "The lab has you compare the measured clock-to-data-out delay with the data-sheet propagation delays of the D flip-flop (74LS175) and the XOR gate (74LS86), which may be min/max or typical."
  - type: choice
    prompt: "What limits the maximum clock frequency of the circuit?"
    options: ["The critical path: flip-flop plus XOR delays plus set-up time", "The crystal frequency chosen for the system clock", "The USB cable length between the analyzer and the PC", "The number of states in the pseudorandom sequence"]
    answer: 0
    explain: "The clock period must be longer than the slowest path (clock-to-output + gate delays + set-up). The lab asks you to find that critical path and the maximum and minimum clock frequencies without violating timing."
card:
  front: "How do you measure and use propagation delay in Lab 1?"
  back: "Switch to timing mode, 500 MHz sample rate (2 ns resolution), trigger on a rising edge of CLK1; zoom in; place cursor A on the clock edge and B where the data is stable; read the interval; compare with the 74LS175 (D-FF) and 74LS86 (XOR) data sheets; the critical path (flip-flop + XOR delays + set-up) sets the maximum clock frequency."
glossary:
  - { term: "Critical path", def: "The longest delay path in a synchronous circuit; it limits the maximum clock frequency." }
---

## Learn

For the last part of Lab 1 switch to **timing mode** and set the sample rate to **500 MHz** (2 ns per sample). Set the *Edge A* column for Clock1 to a rising edge (up arrow) and trigger on *Edge A occurs 1 time*; set the pre-trigger buffer to about 10%; take a *single acquisition*; zoom until you can see the data signals changing after the rising clock edge. Place **cursor A** on a rising clock edge and **cursor B** where the data first becomes stable and read the interval: the **propagation delay from the clock edge to stable data**.

Then compare with data sheets: find the propagation-delay tables for the **74LS175** (quad D flip-flop) and the **74LS86** (quad two-input XOR). Sometimes you will find minimum and maximum values, sometimes only maximum, rarely min, typical and maximum. Compare the clock-to-output delay and discuss.

Finally, from the schematic compute the **maximum and minimum clock frequency** that would not violate any timing restriction and name the **critical path**: the path with the longest total delay (flip-flop clock-to-output plus XOR gates plus the next flip-flop's set-up) fixes the minimum clock period, hence the maximum frequency.

## Worked example

*Flip-flop clock-to-Q is 25 ns max, two XOR levels at 22 ns each, set-up 20 ns. Maximum clock frequency?*

1. Critical path = 25 + 2 x 22 + 20 = 89 ns.
2. Maximum frequency = 1 / 89 ns = **11.2 MHz**.
3. The lab's 8 MHz clock (125 ns) leaves margin.

## Try it

*Why is the measured delay usually below the data sheet's maximum?*

???

Data sheets quote worst case over temperature, voltage and manufacturing variation; a typical part at room temperature is faster. (Lab 3 notes the parts are all from one batch and measure remarkably close.)
