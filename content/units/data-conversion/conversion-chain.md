---
track: shared
title: "The data-conversion chain: conditioning, multiplexing, sample and hold"
summary: "Real systems condition the signal, select a channel, freeze it and then digitise it."
needs: ["adc-methods"]
sources:
  - { type: slide, ref: "L10 s458", quote: "Signal conditioning converts signal to proper voltage range for digitizing" }
  - { type: slide, ref: "L10 s459", quote: "Need to rapidly and cleanly switch between input sources" }
  - { type: slide, ref: "L10 s459", quote: "S/H holds (freezes) the input at a fixed value during the digitization" }
checks:
  - type: choice
    prompt: "Put these in the order of a data-conversion chain."
    options: ["Signal conditioning, analog multiplexer, sample and hold, A/D converter", "A/D converter, multiplexer, conditioning, sample and hold", "Sample and hold, conditioning, converter, multiplexer", "Multiplexer only"]
    answer: 0
    explain: "Step 1 signal conditioning; step 2 analog multiplexing (several sources, such as an engine controller); step 3 sample and hold (freeze the changing input); then the actual conversion."
  - type: choice
    prompt: "What does a **programmable-gain amplifier** do?"
    options: ["Extends the range of a sensor to maximise the full-scale resolution of the ADC", "Converts to digital", "Selects channels", "Samples the input"]
    answer: 0
    explain: "It is signal conditioning: scale the signal to fill the converter's range (the lecture cites the TI PGA103)."
  - type: choice
    prompt: "The input changes at 1,000 V/s and a conversion takes 1 ms. How much can the input change during the conversion?"
    options: ["1 V (1,000 V/s x 0.001 s), so the result is uncertain to about 1 V without a sample-and-hold", "1 mV", "1,000 V", "0 V"]
    answer: 0
    explain: "1,000 V/s x 1 ms = 1 V of change during the conversion. A sample-and-hold freezes the input at a fixed value during digitisation to remove this error."
card:
  front: "What is in a data-conversion system?"
  back: "1 Signal conditioning (to a fixed range, e.g. a programmable-gain amp); 2 analog multiplexing (many inputs, fast and clean switching); 3 sample and hold (freeze a time-varying input during digitisation); then the A/D converter. May be integrated in the microcontroller or built from discrete parts."
glossary:
  - { term: "Signal conditioning", def: "Converting a sensor's signal to the voltage range a converter needs." }
---

## Learn

Most A/D systems need several elements before the actual conversion, either integrated into the microcontroller or assembled from discrete parts:

1. **Signal conditioning:** the unknown input must be inside a fixed range (0-5 V, 0-10 V, +/-10 V...). The sensor may give a different voltage range, a current or a resistance. A **programmable-gain amplifier** extends the sensor's range to maximise the converter's full-scale resolution.
2. **Analog multiplexing:** there may be several input sources (an automobile engine controller). Real-time systems may need thousands of conversions per second, so switching must be rapid and clean.
3. **Sample and hold (S/H):** time-varying signals change during the conversion. The lecture's example: the input changes at 1,000 V/s and a conversion takes 1 ms: the input changes by 1 V during the conversion. The S/H freezes it.

## Worked example

*A sensor produces 0 to 20 mV and the converter spans 0-2 V. Which block do you add?*

1. The signal uses only 1% of the range.
2. Add signal conditioning: a gain of 100 (a programmable-gain amplifier).
3. Now 20 mV becomes 2 V, using the full range.

## Try it

*Why not just run the converter faster instead of adding a sample-and-hold?*

???

A faster converter shrinks the change during conversion but never removes it (and costs more). The S/H holds the voltage still while a slower, cheaper converter digitises it.
