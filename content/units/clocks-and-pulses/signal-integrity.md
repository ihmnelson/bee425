---
track: shared
title: Overshoot, undershoot and ringing
summary: Real pulses deviate from ideal; poor grounding and bypassing are major causes.
needs: [pulse-parameters, pcb-design.power-planes-bypass]
sources:
  - { type: slide, ref: "L2 s107", quote: "Undershoot: Pulse current or voltage goes below ground reference" }
  - { type: slide, ref: "L2 s107", quote: "Ringing: Damped oscillations at each transition of the waveform" }
  - { type: slide, ref: "L2 s107", quote: "Poor grounding is a major source of non-ideal behavior" }
checks:
  - type: choice
    prompt: "A pulse goes **below the ground reference** after a falling edge. What is this called?"
    options: ["Undershoot", "Overshoot", "Ringing", "Skew"]
    answer: 0
    explain: "Undershoot is the pulse going below the ground reference; overshoot is going above the power rail; ringing is damped oscillation at each transition."
  - type: choice
    prompt: "Which is a listed cause of non-ideal pulse shape?"
    options: ["Poor power-supply bypassing", "Using a single clock", "Wider traces", "A 50% duty cycle"]
    answer: 0
    explain: "The slide lists poor grounding (including the oscilloscope probe's ground), poor or insufficient power-supply bypassing, transmission-line effects from impedance mismatch, inductive loads such as relays and solenoids, and high-speed gate rise and fall times."
  - type: choice
    prompt: "Damped oscillations at each transition of a waveform are called..."
    options: ["Ringing", "Skew", "Duty cycle", "Propagation delay"]
    answer: 0
    explain: "That is the definition of ringing."
card:
  front: "Define overshoot, undershoot and ringing, and name two causes."
  back: "Overshoot: above the power rail. Undershoot: below ground. Ringing: damped oscillation at each transition. Causes: poor grounding or bypassing, impedance mismatch (transmission-line effects), inductive loads, fast edges."
glossary:
  - { term: "Ringing", def: "Damped oscillations at each transition of a waveform." }
---

## Learn

Real clocks and pulses deviate from the ideal shape:

- **Overshoot**: voltage or current goes **above the power rail**.
- **Undershoot**: goes **below the ground reference**.
- **Ringing**: **damped oscillations** at each transition.

Causes listed in the lecture: **poor grounding** (including the scope probe's own ground), **poor or insufficient bypassing**, the overall grounding scheme, **transmission-line effects** from impedance mismatch (gate output, PCB conductor, gate input), **inductive loads** such as relays or solenoids, and **fast gate rise and fall times**.

As speeds go up, PCB design becomes more critical. This links straight back to power planes, bypass capacitors and ground management.

## Worked example

*You see a 5 V logic signal that spikes to 6.2 V and then rings for a few cycles after every rising edge. Name the effects and one fix.*

1. The spike above the rail is **overshoot**; the decaying oscillation is **ringing**.
2. Likely causes: impedance mismatch on the trace, a weak ground return or too little bypassing.
3. Fixes to try: improve the ground path or the scope-probe ground, add bypass capacitors close to the IC, or slow the edge.

## Try it

*Why can a scope probe with a long ground lead make a clean signal look like it is ringing?*

???

The slide on why pulses deviate lists poor grounding as a major source, and says it may be an artifact of the **oscilloscope probe's grounding**. A long ground lead adds inductance, which with the probe's capacitance rings on fast edges, so the ringing may be a measurement artifact.
