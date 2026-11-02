---
track: shared
title: Choosing converter resolution for a sensor (furnace example)
summary: Divide the converter range by its codes to get the step, amplify the sensor, then pick enough bits to resolve the smallest change you must detect.
needs: [adc-resolution-step]
sources:
  - { type: handout, ref: "ch12 The resolution of A/D and D/A converters", quote: "Therefore 2.00 / 1023 = 1.9550 x 10-3 volts." }
  - { type: handout, ref: "ch12 The resolution of A/D and D/A converters", quote: "Voltage output @ 400 degrees Celsius ( X 20 ) = 1.7000 V" }
  - { type: handout, ref: "ch12 The resolution of A/D and D/A converters", quote: "we've got to improve our resolution by a factor of 2 mV / 0.04 mV or 50 times!" }
  - { type: handout, ref: "ch12 The resolution of A/D and D/A converters", quote: "A 16-bit A/D converter gives us 65,536 codes." }
checks:
  - type: choice
    prompt: "A 10-bit A/D converter spans 0 to 2.00 V. About how large is one step?"
    options: ["About 1.955 mV (2.00 V divided by 1,023 intervals)", "About 2.00 mV exactly (2.00 V divided by 1,000)", "About 0.2 V (2.00 V divided by 10 bits)", "About 0.49 mV (2.00 V divided by 4,096)"]
    answer: 0
    explain: "A 10-bit converter has 1,024 codes and 1,023 intervals between 0x000 and 0x3FF, so one step is 2.00 / 1,023 = 1.955 mV."
  - type: choice
    prompt: "A thermocouple output changes by 0.02 mV per degree C. After an amplifier of gain 20, how much does the signal change per degree?"
    options: ["0.4 mV per degree", "0.04 mV per degree", "4 mV per degree", "0.02 mV per degree"]
    answer: 0
    explain: "Gain multiplies the transfer function: 20 x 0.02 mV/degree = 0.4 mV/degree."
  - type: choice
    prompt: "The amplified signal changes 0.4 mV per degree C, and the 10-bit converter step is about 2 mV. How far can the temperature shift before the converter notices?"
    options: ["About 5 degrees C", "About 0.2 degrees C", "About 0.5 degrees C", "About 50 degrees C"]
    answer: 0
    explain: "2 mV / 0.4 mV per degree = 5 degrees. A change of that size is needed before the output code changes by one."
  - type: choice
    prompt: "The temperature must be held to +/- 0.1 degree C, which is a 0.04 mV change. The converter step must shrink by 50 times. What is the smallest standard word length that does it?"
    options: ["16 bits, a 64 times improvement over 10 bits", "12 bits, a 4 times improvement", "14 bits, a 16 times improvement", "11 bits, a 2 times improvement"]
    answer: 0
    explain: "Each extra bit halves the step. 12 bits is only 4x better than 10 bits; 16 bits gives 65,536 codes, which is 64x the 1,024 of a 10-bit converter and beats the required 50x."
card:
  front: "How do you decide the A/D resolution needed for a sensor?"
  back: "Step = range / (2^N - 1). Find the sensor's change for the smallest detail you need, amplify so the signal fills the range, then choose N so one step is no larger than that change. Furnace: 2 V range, 0.4 mV/degree after gain 20, 0.1 degree = 0.04 mV needs a 50x finer step, so 16 bits (64x)."
glossary: []
---

## Learn

A converter cannot tell apart analog values closer together than one **step**. For an N-bit converter over a range V there are 2^N codes and 2^N - 1 intervals, so **step = V / (2^N - 1)**. For 10 bits over 0 to 2.00 V that is 2.00 / 1,023 = **1.955 mV**. A value close to a switching point may digitise either way.

To decide whether that is good enough, work backwards from what must be detected:

1. **Amplify** the sensor so its range uses the converter's range (gain 20 turns 85 mV into 1.7 V and 0.02 mV per degree into 0.4 mV per degree).
2. Find the **smallest change** that matters (0.1 degree C = 0.04 mV).
3. Compare it with the step: a 2 mV step only sees changes of about 5 degrees, so the resolution must improve by **2 mV / 0.04 mV = 50 times**.
4. Each extra bit halves the step: 12 bits is 4x better, **16 bits is 64x better**, so 16 bits suffices (0.03 mV per step).

The reading's own figures for the thermocouple are not consistent with each other: 85 mV at 400 degrees would be about 0.21 mV per degree, not 0.02. The amplified numbers (1.7 V and 0.4 mV per degree) are the ones its resolution argument uses, so use those.

## Worked example

*A pressure sensor gives 0 to 5 V and must resolve changes of 2 mV. How many bits are needed?*

1. Codes needed: 5 V / 0.002 V = **2,500** steps.
2. 2^11 = 2,048 is too few; 2^12 = 4,096 is enough.
3. A **12-bit** converter (step about 1.2 mV) will do.

## Try it

*A 12-bit converter spans 0 to 2.00 V. What is its step, and could it resolve the furnace's 0.04 mV change?*

???

2.00 / 4,095 = **0.49 mV** per step. That is about 12 times too coarse for 0.04 mV, so a 12-bit converter could not resolve it (16 bits could).
