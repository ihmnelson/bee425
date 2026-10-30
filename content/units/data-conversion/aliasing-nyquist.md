---
track: shared
title: "Aliasing, the Nyquist rate and bandwidth limiting"
summary: "Sample at least twice the highest frequency or it aliases; a low-pass filter limits the signal before the converter."
needs: ["conversion-chain"]
sources:
  - { type: slide, ref: "L10 s467", quote: "we take at least two digital samples per cycle of the AC voltage" }
  - { type: slide, ref: "L10 s467", quote: "A/D converter output will appear to be a constant voltage" }
  - { type: slide, ref: "L10 s468", quote: "reasonable values are R1 = R2 = 11.2 KΩ" }
  - { type: slide, ref: "L10 s469", quote: "Even with 6 terms and an upper limit of" }
checks:
  - gen: conv.alias
  - gen: conv.alias
  - type: choice
    prompt: "A 10 kHz sine wave is sampled once every 100 µs (10 kHz). What does the converter see?"
    options: ["Essentially a constant voltage (one sample per cycle, so the apparent frequency is 0)", "A 10 kHz sine", "A 5 kHz sine", "Noise"]
    answer: 0
    explain: "One sample per cycle lands at the same phase every time, so the output looks constant (its level depends on the phase). To avoid aliasing take at least two samples per cycle: a sample rate of at least twice the signal frequency (the Nyquist rate)."
  - type: choice
    prompt: "What is the minimum sample rate for a signal whose highest frequency is 20 kHz?"
    options: ["40 kHz (twice the highest frequency)", "20 kHz", "10 kHz", "80 kHz"]
    answer: 0
    explain: "The Nyquist criterion: sample at at least 2x the highest frequency of interest. In practice, add an input low-pass filter to remove unwanted higher frequencies and noise first."
  - type: choice
    prompt: "The lecture's 2-pole low-pass has R1 = R2 = 11.2 kΩ, C1 = 1000 pF and C2 = 2000 pF. What is it for?"
    options: ["A 10 kHz cutoff (passing everything below 5 kHz suits voice) to limit the bandwidth before digitising", "A 1 MHz oscillator", "A power filter", "A debouncer"]
    answer: 0
    explain: "It limits the bandwidth of the AC signal so the sampling does not alias. Adding an input filter also removes unwanted high-frequency components and noise that would limit the digitisation accuracy."
  - type: choice
    prompt: "A 220 Hz square wave is built from odd harmonics (220, 660, 1100 ...). With 6 terms the highest frequency is 220 x 11 = 2,420 Hz. What does the slide say, and is the square wave perfect?"
    options: ["It says 2,427 Hz (slightly different from 2,420) and the square wave is still not perfect", "Exactly 2,420 Hz and perfect", "1,320 Hz", "10 kHz"]
    answer: 0
    explain: "The k-th term of a square wave is the (2k - 1)th harmonic, so 6 terms reach 11 x 220 = 2,420 Hz. The slide quotes 2,427 Hz; either way, the waveform with six terms is not perfect."
card:
  front: "What is aliasing and how do you avoid it?"
  back: "Sampling a signal at less than twice its frequency gives a false lower-frequency signal (one sample per cycle looks constant). Sample at at least 2x the highest frequency (Nyquist), and put a low-pass filter before the converter to limit the bandwidth. A square wave needs many odd harmonics."
glossary:
  - { term: "Aliasing", def: "A sampled signal appearing at a false, lower frequency because the sample rate was too low." }
---

## Learn

When digitising a time-varying voltage you must consider the signal's frequency against the converter's **sample rate**. A 10 kHz sine sampled every 100 µs (once per cycle) looks like a constant voltage whose level depends on the phase. To avoid **aliasing**, take **at least two samples per cycle** (the **Nyquist** criterion: sample rate at least **2x** the signal frequency).

**Apparent frequency:** a tone f sampled at fs appears at |f - fs x round(f/fs)|.

**Limiting bandwidth:** add a low-pass filter ahead of the converter. The lecture's 2-pole filter (R1 = R2 = 11.2 kΩ, C1 = 1000 pF, C2 = 2000 pF) has a 10 kHz cutoff and passes everything below about 5 kHz, enough for voice. Choose the upper frequency by how much accuracy you need: the Fourier components of a 220 Hz square wave are odd harmonics, and even with 6 terms (about 2.4 kHz; the slide says 2,427 Hz) the square wave is not perfect.

## Worked example

*A 7 kHz tone is sampled at 10 kHz. What do you see?*

1. The Nyquist limit is 5 kHz; 7 kHz is above it.
2. Apparent frequency = |7 - 10 x round(0.7)| = |7 - 10| = **3 kHz**.
3. A 3 kHz tone appears that is not in the signal: aliasing.

## Try it

*How fast must you sample a 4 kHz signal to meet the Nyquist criterion?*

???

At least **8 kHz** (twice the signal frequency), and in practice somewhat more with a filter in front.
