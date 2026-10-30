---
track: shared
title: Ground management and split ground planes
summary: Keep noisy digital and quiet analog grounds apart and join them at one point only.
needs: [power-planes-bypass]
sources:
  - { type: slide, ref: "L2 s70", quote: "Should only allow the two (or more) planes to come together at one point" }
  - { type: slide, ref: "L2 s70", quote: "Digital circuitry is electrically “noisy” due to switching current spikes" }
  - { type: slide, ref: "L2 s71", quote: "Isolating planes prevents digital return currents from creating noise on analog signals" }
checks:
  - type: choice
    prompt: "Why are **separate (split) ground planes** used on a board with both analog and digital circuits?"
    options: ["Digital switching current spikes would add noise to low-level analog signals", "Analog circuits need a higher voltage", "To save copper", "To make the board easier to solder"]
    answer: 0
    explain: "Digital circuitry is electrically noisy from switching current spikes. Analog circuitry, especially one measuring low-amplitude signals, needs a quiet ground. Isolating the planes keeps digital return currents from creating noise on analog signals."
  - type: choice
    prompt: "Where should the isolated analog and digital ground planes be connected?"
    options: ["At one point only", "At every IC", "Nowhere", "At every connector pin"]
    answer: 0
    explain: "Planes should come together at only one point. Several connections allow small voltage differences to drive current between them: a ground loop, which causes noise, 60 cycle hum or oscillations."
  - type: choice
    prompt: "What is a **ground loop**?"
    options: ["Current flowing between two ground connection points because their voltages differ slightly", "A trace that loops back on itself", "A grounded antenna", "A capacitor to ground"]
    answer: 0
    explain: "The slide's footnote: slight differences in voltage between the contact points allow current to flow between them, often causing noise, 60 cycle hum or oscillations."
card:
  front: "Why use split ground planes, and where do they join?"
  back: "Digital switching noise would corrupt quiet analog signals, so the planes are isolated; they are joined at one point only, because multiple connections create ground loops (noise, 60 Hz hum, oscillation)."
glossary:
  - { term: "Ground loop", def: "Current flowing between two ground connections that sit at slightly different voltages; a source of noise and hum." }
  - { term: "Split ground plane", def: "Separate or isolated ground planes for analog and digital circuitry, joined at a single point." }
---

## Learn

A ground plane is good, but it is not the only consideration when a board mixes **analog and digital** circuits.

- **Digital circuitry is noisy**: its switching causes current spikes.
- **Analog circuitry needs a quiet ground** to measure low-amplitude signals. A/D converters often have separate analog and digital ground pins.
- So use **separate planes** (more layers) or **isolated planes on the same layer**. Isolation keeps digital return currents from making noise on analog signals.
- Let the planes **meet at one point only**. If they are connected in several places, tiny voltage differences between those points let current flow around the loop: a **ground loop**, which causes noise, 60-cycle hum or oscillation.

## Worked example

*A board has a 12-bit A/D converter with AGND and DGND pins, a microcontroller, and a noisy motor driver. How do you handle grounds?*

1. Put the A/D converter and its input conditioning on an **analog ground plane**.
2. Put the microcontroller and the motor driver on the **digital ground plane**.
3. Connect AGND to DGND at **one point**, close to the converter, so the two returns meet once.
4. Keep digital traces from crossing the analog plane so digital return currents do not run through it.

## Try it

*A student ties analog and digital ground together at three places 'to be safe'. What can go wrong, and what symptom would you see?*

???

The three connection points are at slightly different voltages, so current circulates through the loop they form (a ground loop). The symptom is noise on the analog signal: hum at 60 Hz, hash, or oscillation. Join the grounds at a single point instead.
