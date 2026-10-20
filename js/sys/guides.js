/* Written guides and glossary for the Systems section: data conversion, from BEE 425 Lesson 10 (slides 1-35).
   Same authoring format and renderer as the processor packs (a small markdown subset). Slide numbers are PDF page numbers
   of BEE425F26Lesson10.pdf (the printed numbers on the slides are 433 higher). Points where the slides disagree with each
   other or with the arithmetic are called out in the text. */
(function (root) {
  'use strict';
  const render = (root.PACKS && root.PACKS.list && root.PACKS.list.z80 ? root.PACKS.list.z80.QUEST_GUIDES : require('../z80/guides.js')).render;

  const GUIDES = [
    { id: 'conversion', title: 'Analog, digital and the D/A converter', lesson: 'L10', icon: '🔢', practice: ['dac'], summary: 'Comparators, binary-weighted D/A, step size and the resolution/accuracy distinction.', md: `The real world is **analog**: an electrical signal that provides an "analogy" of a physical quantity. Thermocouples, strain gauges, microphones and photocells all give a voltage, resistance or current that a microprocessor cannot read until an **A/D converter** (ADC) turns it into a number. Going the other way, a **D/A converter** (DAC) turns a number into a voltage. *(Source: Lesson 10, slide 1.)*

## The comparator

A comparator is an op-amp running open-loop, with its output conditioned to logic levels. Its output is 1 if the + input is more positive than the − input, and 0 if it is less. It is the one-bit analog-to-digital converter that every other converter is built from. *(Slides 2-3.)*

Add more comparators with different thresholds and the output code gets more bits: three comparators at 0.25, 0.50 and 0.75 of VMAX divide the range into four bands and give a code from 0 to 3. *(Slide 4.)*

## The D/A converter

The idea is simple. Inject currents in a **binary progression** (i, 2i, 4i, 8i, ...) into a summing junction, switch each current with one bit of the digital word, and convert the total current to a voltage. The output is proportional to the word. *(Slide 13.)*

The slide's 4-bit example uses i = 0.1 mA into R = 1 kΩ (Ohm's law, V = i × R):

| Quantity | Value |
|---|---|
| One step (LSB only) | 0.1 mA × 1 kΩ = 0.1 V |
| Maximum, all bits set | (1 + 2 + 4 + 8) × 0.1 V = 1.5 V |

*(Slide 14; the 1.5 V is the sum of all four currents.)*

## Resolution, accuracy and step size

**Resolution** is the ability to measure small differences, and it is set by the number of bits. **Accuracy** is an absolute measure of how well the code represents the input. They are not the same thing: a 16-bit converter with a poor reference can resolve tiny changes yet be wrong by a large amount. *(Slide 17.)*

The course divides the span by the number of steps, 2^N − 1:

| Converter | Span | Step |
|---|---|---|
| 8 bits | 0 to 10 V | 10/255 ≈ 0.04 V |
| 16 bits | 0 to 10 V | 10/65,535 ≈ 0.00015 V |
| 10 bits | 0 to 10.23 V | 10 mV (1023 steps) |

*(Slides 17 and 31.)* Converter data sheets often define the LSB as the span divided by 2^N instead (general knowledge, not from the slides), which differs by a factor of 1 + 1/(2^N − 1); this site follows the slides.

> Use the converter's range. If the input is 0.00015 V and the span is 10 V, a 16-bit converter gives you about **one bit** of information. Amplify the signal first so it spans the input range. *(Slide 17.)*

## Where to go next

The next guide compares the methods that build an ADC from these pieces; the last one covers everything that happens before the converter. In the **Converter lab** you can change the number of bits and the input and watch the code, the staircase and the successive-approximation trials.` },

    { id: 'adc-methods', title: 'A/D conversion methods', lesson: 'L10', icon: '⚙️', practice: ['adc'], summary: 'Flash, single ramp, successive approximation, V/F, dual-slope and delta-sigma compared.', md: `Every A/D method trades **accuracy and resolution**, **conversion speed**, **cost** and **noise immunity** against each other. Apart from flash, each needs a reference voltage, a comparator and a D/A converter. *(Slides 15-16.)*

## Summary table

| Method | Best at | Weak at | Typical |
|---|---|---|---|
| Flash | Speed (about 1 GSPS) | Resolution, cost per bit, power | 8 to 10 bits |
| Single ramp | Simplicity | Non-deterministic conversion time | |
| Successive approximation | General use: the workhorse | | 12 to 18 bits |
| Multiple slope (dual, triple, quad) | Precision | Very slow (about 10 per second) | 16 to 24 bits |
| Voltage to frequency | Noise immunity, resolution | Slowest, not for AC | medium accuracy |
| Delta-sigma | Resolution from simple parts | Hard to describe | |

*(Slides 12, 16, 19, 20, 23.)*

## Flash

One comparator per threshold on a resistor ladder. A 2-bit example uses ladder taps at 1/5, 2/5, 3/5 and 4/5 of Vr and a small logic block that turns the comparator pattern into a binary code. The comparator outputs form a **thermometer code**: all the comparators below the input are 1, all above are 0. *(Slides 4-12.)*

An N-bit flash needs **2^N − 1** comparators (slide 12). Slide 6 says 8 bits need 256 comparators and 257 resistors; the 2^N − 1 rule gives 255 and 256, so use that.

Speed: if the comparators settle in 1 ns and the decode logic takes 1 ns, the converter delivers a result every 2 ns, that is 500 MHz. *(Slide 6.)*

## Single ramp

A counter drives a D/A converter, so the reference voltage rises as a ramp, and the comparator output TEST goes false when the ramp passes the unknown voltage Vx. A processor reads the TEST bit while incrementing a count; when TEST changes, the count is the digitized voltage. The drawback (slide 18's hint is "consider digitizing time"): a bigger input takes more counts, so the conversion time is not fixed. *(Slides 15 and 18.)*

## Successive approximation (SAR)

Instead of counting up, the SAR tests one bit at a time from the **most significant bit** down. For each bit: set it, look at the D/A output, and keep the bit if the D/A output does not exceed the input. N bits take N trials. This is the "workhorse" of data acquisition. The slide's example is the ADC1241: 12 bits plus sign, 13.8 µs conversion time, self-calibrating, with an internal sample and hold. *(Slide 19.)*

> The **Converter lab** shows these trials one by one; the home page of this section runs a 4-bit SAR on 1.23 V.

## Voltage to frequency (V/F)

A V/F converter produces a pulse train whose frequency is proportional to the input: Fout = k × Vin. Counting the pulses for a fixed time gives the result. With k = 100 kHz per volt and 5 V in, Fout = 500 kHz, so you count 500,000 pulses in 1 s, 5,000,000 in 10 s and 50,000,000 in 100 s. The longer you count, the finer the result and the more noise is averaged out, which is why it is good for noisy industrial settings. It does not work for AC voltages. *(Slide 20.)* The AD537 gives 0 to 10 kHz or 0 to 100 kHz for 0 to 10 V, with 0.01% linearity. *(Slide 21.)*

## Dual slope

Dual slope builds on V/F:

1. Convert the unknown voltage to a frequency.
2. Count the pulses for a fixed window T.
3. Switch to a precise reference Vref and count back down to zero, recording the time tref.
4. The areas under the two curves are equal: **Vx × T = Vref × tref**, so Vx = Vref × tref / T.

Errors made in one slope cancel in the other, which is why it is accurate. Triple- and quad-slope versions are more accurate again but slower, in the range of 10 measurements per second. *(Slides 23-24.)*

## Delta-sigma

Think of it as a V/F converter with feedback. The input feeds an integrator, a comparator turns the integrator output into logic, a D flip-flop makes a bitstream of 1s and 0s, and a second comparator turns that stream back into an analog level that is fed back to the integrator. The bitstream represents the input. The slides call it an advanced form that combines the earlier techniques. *(Slide 22.)*` },

    { id: 'acquisition', title: 'Data acquisition and sampling', lesson: 'L10', icon: '🧱', practice: ['acq'], summary: 'Conditioning, analog mux, sample and hold, droop, the Nyquist rate and anti-aliasing.', md: `The converter itself is only part of the system. In front of it sit three steps. *(Slides 25-26 and 33.)*

## 1. Signal conditioning

The input voltage must be in a fixed range (0 to 5 V, 0 to 10 V, ±10 V, ...). A sensor may give a voltage in another range, a current, or a resistance. Conditioning converts it. A **programmable gain amplifier** (for example the PGA103) can scale the sensor range so that it fills the converter's input range, which is how you use the full resolution. *(Slide 25.)*

## 2. Analog multiplexing

Many systems have more than one input (an engine controller, for example) and need to switch between them quickly and cleanly. A mechanical switch is too slow; an **analog switch** is a FET whose channel resistance is set by its gate voltage. A 4-to-1 analog mux is four switches sharing an output, with a 2:4 decoder on two select lines turning one on. The MUX-08 is an 8-channel part. *(Slides 26-28 and 32.)*

| Parameter | Mechanical | Analog |
|---|---|---|
| Switching speed | ~10 ms | 250 ns |
| Bounce | Yes | No |
| On resistance | 0 Ω | 100 Ω |
| Off resistance | Infinite | ~1 GΩ |
| Lifetime | Finite | Infinite |
| Bandwidth | > 1 GHz | 10 to 100 MHz |
| Current | 1 A | 30 mA |

*(Slide 29.)*

## 3. Sample and hold

If the input changes while the converter works, the result is blurred. With an input moving at 1000 V/s and a conversion taking 1 ms, the input moves **1 V** during the conversion. *(Slide 26; the slide poses the question, the 1 V is worked out here.)* A sample-and-hold stores the input on a capacitor: sample = SW1 closed, SW2 open; hold = SW1 open. The stored voltage slowly leaks away, the **droop rate**, which limits how long the conversion may take. *(Slide 30.)*

### Worked droop problem (slides 30-31)

A 10-bit converter spans 0 to 10.23 V. The droop rate is 1 V/ms. How fast must the converter be so that droop error is no more than half an LSB?

1. 1024 counts, 0 to 1023, so one count is 10 mV.
2. Half an LSB is 5 mV.
3. Time = 5 mV ÷ (1 V/ms) = 5 µs.

> **Check the last step of the slide.** It then says the typical droop rate is "50 mV/sec" and the sample time becomes 100 µs. At 50 mV/s the same arithmetic gives 5 mV ÷ 0.05 V/s = 0.1 s = 100 ms; 100 µs corresponds to 50 mV/**ms**. The method is right; the unit on the slide looks like a typo. *(calc; not checked against the Analog Devices source the slide cites.)*

## Aliasing and the Nyquist rate

When you digitize an AC signal, the sampling rate matters. Sample at least **twice** per cycle (sampling frequency 2× the signal frequency) and you do not introduce aliasing; strictly, the rate must exceed twice the highest frequency present. *(Slide 34.)* The slide's example: a 10 kHz sine sampled every 100 µs (a 10 kHz sample rate, one sample per cycle) looks like a **constant voltage**, set by the phase between the two. A frequency f above half the sample rate fs appears folded down as |f − k·fs| for the nearest whole number k; this folding formula is standard theory rather than something stated on the slide (see Analog Devices MT-002, which the slide cites).

To keep unwanted frequencies out, put a **low-pass filter** ahead of the converter. The slide's 2-pole example uses R1 = R2 = 11.2 kΩ, C1 = 1000 pF and C2 = 2000 pF for a 10 kHz cutoff (calc: 1/(2π R √(C1 C2)) ≈ 10 kHz). *(Slide 35.)* The **Converter lab** has a sampling panel where you can raise a signal's frequency past half the sample rate and watch the samples trace the wrong waveform.` },
  ];

  const G = (term, def, lesson, cat) => ({ term, def, lesson, cat });
  const GLOSSARY = [
    G('A/D converter (ADC)', 'Circuit that turns an analog voltage into a binary code.', 'L10', 'Converters'),
    G('Accuracy', 'An absolute measure of how well the code represents the input voltage; different from resolution.', 'L10', 'Converters'),
    G('Aliasing', 'A signal sampled too slowly appears as a different, lower frequency (or a constant) in the samples.', 'L10', 'Sampling'),
    G('Analog', 'A signal that provides an "analogy" of a physical quantity, such as a voltage proportional to temperature.', 'L10', 'Converters'),
    G('Analog switch', 'A FET whose channel resistance is controlled by the gate voltage; fast and without contact bounce.', 'L10', 'Acquisition'),
    G('Comparator', 'An op-amp running open-loop with a logic-level output: 1 if the + input exceeds the − input, otherwise 0.', 'L10', 'Converters'),
    G('Conversion time', 'How long a converter takes to produce a result; for a successive-approximation ADC it is N trials.', 'L10', 'Converters'),
    G('D/A converter (DAC)', 'Circuit that turns a binary code into an analog voltage, typically by summing binary-weighted currents.', 'L10', 'Converters'),
    G('Delta-sigma (ΔΣ)', 'A/D method that feeds a bitstream back to an integrator, like a V/F converter with feedback.', 'L10', 'Converters'),
    G('Droop', 'The rate at which a sample-and-hold\'s stored voltage leaks away while holding.', 'L10', 'Acquisition'),
    G('Dual-slope', 'Multi-slope A/D: count against the unknown for a fixed window, then back down against Vref; Vx = Vref × tref / T.', 'L10', 'Converters'),
    G('Flash converter', 'Fastest A/D: 2^N − 1 comparators on a resistor ladder, with a thermometer code decoded to binary.', 'L10', 'Converters'),
    G('GSPS', 'Giga samples per second: the conversion rate of a fast flash ADC can reach one billion per second.', 'L10', 'Converters'),
    G('LSB', 'Least significant bit; one step of the converter, span ÷ (2^N − 1) in this course.', 'L10', 'Converters'),
    G('Multiplexer (mux)', 'Selects one of several inputs to pass to a single output; an analog mux uses analog switches.', 'L10', 'Acquisition'),
    G('Nyquist rate', 'The minimum sampling rate, twice the highest signal frequency, below which aliasing occurs.', 'L10', 'Sampling'),
    G('PGA', 'Programmable gain amplifier: scales a sensor signal to fill the converter\'s input range.', 'L10', 'Acquisition'),
    G('Resolution', 'The smallest difference a converter can distinguish; set by the number of bits.', 'L10', 'Converters'),
    G('Sample and hold (S/H)', 'Circuit that stores the instantaneous input voltage on a capacitor and keeps it constant during conversion.', 'L10', 'Acquisition'),
    G('Signal conditioning', 'Converting a sensor signal into the voltage range the converter expects.', 'L10', 'Acquisition'),
    G('Single-ramp A/D', 'A counter drives a D/A converter until the comparator trips; simple but conversion time varies with the input.', 'L10', 'Converters'),
    G('Successive approximation', 'A/D method that tests bits from the MSB down against a D/A converter; N trials for N bits.', 'L10', 'Converters'),
    G('Thermometer code', 'The pattern of comparator outputs in a flash ADC: all 1s up to the input level, then all 0s.', 'L10', 'Converters'),
    G('V/F converter', 'Voltage-to-frequency converter: Fout = k × Vin; counting pulses gives a slow, noise-immune conversion.', 'L10', 'Converters'),
  ];

  const SEE = { conversion: ['adc-methods', 'acquisition'], 'adc-methods': ['conversion', 'acquisition'], acquisition: ['adc-methods', 'conversion'] };
  const DECK_GUIDE = { dac: 'conversion', adc: 'adc-methods', acq: 'acquisition' };
  const CAT_GUIDE = { Converters: 'conversion', Sampling: 'acquisition', Acquisition: 'acquisition' };
  const REFS = [
    { title: 'Analog Devices tutorial MT-002 (aliasing and the Nyquist rate)', url: 'http://www.analog.com/static/imported-files/tutorials/MT-002.pdf', note: 'The overview that Lesson 10 slide 34 cites (link copied from the slide; not re-checked).' },
    { title: 'All About Circuits: Delta-sigma ADC', url: 'https://www.allaboutcircuits.com/textbook/digital/chpt-13/delta-sigma-adc/', note: 'The explanation that Lesson 10 slide 22 cites (link copied from the slide; not re-checked).' },
    { title: 'Maxim application note 810 (flash converters)', url: 'http://www.maxim-ic.com/app-notes/index.mvp/id/810', note: 'Cited by Lesson 10 slide 12 (link copied from the slide; may no longer resolve).' },
  ];
  const api = { GUIDES, GLOSSARY, render, SEE, DECK_GUIDE, CAT_GUIDE, REFS };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.QUEST_GUIDES = api;
})(typeof window !== 'undefined' ? window : globalThis);
