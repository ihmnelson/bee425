/* Written guides and glossary for the Systems section: data conversion and system design, from BEE 425 Lesson 10 (slides 1-61).
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

    { id: 'signals', title: 'Noisy inputs: filters, hysteresis, isolation, watchdog', lesson: 'L10', icon: '🔀', practice: ['sig'], summary: 'Bandwidth limits, Schmitt triggers, debouncing, optical isolation and the watchdog timer.', md: `Real inputs are noisy, bouncy and sometimes dangerous. Slides 36 to 41 of Lesson 10 cover the circuits that stand between the outside world and a processor.

## How much bandwidth do you need?

The Nyquist rule says how fast to sample a sine wave. A voice, an instrument or a square wave has many frequency components, so first decide the **highest frequency that matters**, then apply a low-pass or band-pass filter to limit the input to that range. *(Slide 36.)*

A square wave contains only the **odd harmonics**: f, 3f, 5f, 7f and so on. The slide's example is a 220 Hz square wave: six terms reach the 11th harmonic, 2420 Hz (calc), and even then the square wave is not perfect. The slide quotes 2427 Hz for the limit, which is not 11 × 220 Hz; the likely cause is a slightly different fundamental in the web tool it uses, so treat 2427 as approximate.

## Hysteresis and the Schmitt trigger

When the two inputs of a comparator are nearly equal, noise makes the output flip back and forth. **Hysteresis** gives the circuit two thresholds: the input must rise above the upper one to switch the output high, and fall below the lower one to switch it low. The gap between them is the **deadband**. Noise smaller than the deadband cannot cause a false switch; that margin is the **noise margin**. The price is accuracy, because the circuit now switches at two different points. *(Slide 37.)*

The **Converter lab** has a Schmitt-trigger panel: a slow ramp with noise goes into a plain comparator and into one with hysteresis, and it counts the output transitions of each.

## Switch bounce and debouncing

The contacts of a mechanical switch open and close electrically many times before they settle, and the circuit sees every bounce as an input. A **Schmitt trigger** makes the input immune to it. The reset circuit on slide 38 puts an **RC low-pass filter** after the switch, which turns the bounce into a slow ramp, and then a **NAND gate with Schmitt inputs** that converts the ramp into a clean logic edge. Without the hysteresis the slowly rising input would make the NAND output oscillate as it crossed the threshold. *(Slides 37-38.)*

## Optical isolation

Embedded systems work in harsh places: an arc welder produces severe electrical noise, and a long cable acts like an antenna that funnels energy into the circuits. An **opto-isolator** couples a signal with an **LED and a phototransistor**, so there is no electrical connection between the two sides. It allows systems at different ground references to communicate, often with about 1000 V of isolation, and protects patients in medical instruments. *(Slide 39.)*

The slide-40 problem: gate A comes from a battery-powered thermostat biased at +1000 VDC above ground, and gate B (the heater) is ground-referenced. A current amplifier on the A side sets the LED's on-current; the phototransistor, with a pull-up resistor to Vcc, drives gate B's input on the ground side. *(Slide 40.)*

## The watchdog timer

An industrial or mission-critical system must not stay failed because of a software fault. A **watchdog timer** monitors the computer and issues a **RESET or NMI** if the supply voltage leaves its range, or if the processor has not pulsed the timer's retrigger input within the allowed interval. The software retriggers it by writing a bit of an output port from its main loop, so the loop must have a **predictable cycle time**. *(Slide 41.)*

> **RESET or NMI?** The slide asks which input the watchdog output should drive and does not give the answer. A reasoned answer (not from the slides): RESET, because it returns the processor to a known state even if the program, stack or interrupt vectors have been corrupted, while an NMI handler is itself software that may be corrupted too.` },

    { id: 'power-rf', title: 'Power, RF emissions and trace termination', lesson: 'L10', icon: '💡', practice: ['pwr'], summary: 'CMOS power, regulation, compliance, bus loading and terminating traces.', md: `## Power

Processors need anywhere from microwatts to tens of watts, and the requirement **often scales with clock speed**, which sets the cooling needs. The slide's 68K example is 0.13 W at 8 MHz and 0.38 W at 20 MHz. (calc: the clock rose 2.5 times and the power 2.9 times, so the scaling is only roughly linear.) When you work out supply needs, use both the **typical** and the **worst-case** current specifications. *(Slide 42.)*

### Why CMOS power depends on switching

While a CMOS gate stays high or low only leakage current flows, which is why a few AAA batteries can run a data logger for a year. When a gate **switches**, there is a short time when both transistors conduct together, so power rises with the number of transitions. *(Slide 44.)* The slide's summary: *(slide 46)*

1. Power depends on how many gates switch per unit time; save power by disabling the clock to regions that are not needed.
2. Power falls as **Vcc squared**.
3. Slower rise and fall times raise power.
4. Power rises linearly with clock frequency.
5. Over-clocking can exceed the package's ability to shed heat.

(calc: moving from 5 V to 3.3 V cuts power to 3.3 squared over 5 squared, about 44%, at the same clock and activity.)

### Central or local regulation

**Central:** one well-regulated supply feeds every board, and each board needs only a local filter capacitor. The supply may cost more, and the voltage drop between supply and boards matters. **Local:** each board has its own regulator, which costs more per board and dissipates heat on it. *(Slide 45.)*

## RF emissions and compliance

RF emission limits are one of the hardest hurdles, and suppression should be **designed in, not fixed later**. The slide's list of techniques: spread-spectrum clock oscillators, avoid current loops, shield clock lines on inner layers or run guard traces, avoid long clock lines and long bus runs, use logic with slower edges (ALS rather than FCT) if delays allow, use microcontrollers and ASICs, ferrite cores on cables, shield locally, avoid switching supplies, run the slowest acceptable clock, use sleep modes, terminate long traces, and study products that already solved the problem. *(Slide 47.)*

## Bus loading

Each input on a line adds capacitance, and an output can drive only so many inputs (its **fan-out**): a standard TTL output reliably drives about 10. Large memory systems therefore **buffer** the address and data buses: the 74XX245 is a bidirectional bus transceiver for data, and the 74XX244 a unidirectional buffer for addresses. The buffers add propagation delay to every memory access. *(Slide 48.)*

## Terminating traces

Traces on a PC board are **transmission lines**. Without termination the signal reflects at the receiving end; the reflections cause RF interference and cut the noise margin. *(Slide 49.)*

When must you terminate? The rule of thumb is that a trace needs it when its length is at least

**length ≥ tR / (2 × tPR)**

where tR is the fastest rise or fall time and tPR is the propagation delay, about 150 ps per inch on an ordinary board. For 0.5 ns logic: 500 ps / (2 × 150 ps) = **1.67 inches**. *(Slide 49.)*

| Method | How | Notes |
|---|---|---|
| Parallel | One resistor R = ZT at the receiver | Simple; constant current drain |
| Thévenin | R1 to supply and R2 to ground, with R1 in parallel with R2 equal to ZT | Set the Thévenin voltage at the logic switching point; do not use with floating outputs |
| With a capacitor | Capacitor in the divider | Reduces steady-state current drain |

*(Slides 50-51.)* The **Converter lab** has a calculator for the length rule and for CMOS power scaling.` },

    { id: 'partitioning', title: 'Specification, partitioning and cost', lesson: 'L10', icon: '🧬', practice: ['des'], summary: 'The design specification, stakeholders, hardware versus software, and the ASIC cost example.', md: `## The design specification

The design specification is the formal roadmap of what you are supposed to design. It lists the processor type and speed, the amount and memory map of RAM, the ROM type, size, location and in-service reprogramming needs, an upgrade plan, data bus width, user environment (office, automotive), operating and storage temperature, humidity, shock and vibration, power and cooling, I/O connectors, custom ASICs, IP to be purchased and special CAD tools. It can contain hundreds of items and may also carry an optional wish list. *(Slide 52.)*

## Stakeholders

Before the design is final, talk to the people it affects: **software** (performance goals, tools, time, memory, legacy code), **marketing** (cost goals, use models, competition, upgrades), **mechanical engineering** (board space, connector locations, mounting, cooling), **compliance engineering** (shielding, foreign regulations) and **component engineering** (part qualification, availability, parts to avoid or already in use, obsolescence, preferred vendors). *(Slide 53.)*

## Partitioning

Partitioning is deciding what the system does in hardware and what in software. It is an **iterative** process and it is critical, because mistakes here can produce an inferior product. Hardware engineers lean toward hardware and software developers toward software. Hardware is fast but adds real cost to every unit shipped; software is slow but very flexible, and its real cost is often hidden in development time and performance. *(Slides 54-55.)*

| Choice | Speed | Flexibility | Cost |
|---|---|---|---|
| Dedicated hardware | Fast | Inflexible | Expensive |
| Reconfigurable hardware | Fast | Flexible | More expensive |
| Software | Slower | Flexible | Cheaper |

*(Slide 56, a laser-printer engine as the example.)*

### Hardware: pros and cons *(slide 57)*

- **Pros:** 10x, 100x or more speed; a simpler processor; less software design time; a small hardware bug may be worked around in software.
- **Cons:** extra bill-of-materials cost; added circuit complexity (power, board space, RFI); large NRE (about $100K); a long development cycle (about 3 months); little margin for error (only about 50% of ASICs work the first time); IP royalties; design tools at $50K to $100K per seat.

### Software: pros and cons *(slide 58)*

- **Pros:** no added materials cost, power or circuit complexity; bugs are easy to fix, even in the field; inexpensive tools; not sensitive to sales volume.
- **Cons:** performance far below hardware, which forces a bigger and faster processor, more memory and a bigger supply; a real-time OS may need royalties; schedule uncertainty; performance goals may not be reachable; a larger team.

## The cost example (slides 59-60)

Add an ASIC to an embedded system. The ASIC costs **$14.00** each at 1,000 units a year and **$6.00** at 500,000. Its development costs are the same at either volume:

| Item | Cost |
|---|---|
| Development (2 engineer-years) | $300,000 |
| Foundry NRE | $200,000 |
| Tools, amortised | $25,000 |
| **Total NRE** | **$525,000** |

Spread over the volume, that is **$525** per device at 1,000 units and **$1.05** at 500,000. The software alternative costs $300,000 to develop: **$300** per device at 1,000 units and **$0.60** at 500,000.

| | 1,000 units | 500,000 units |
|---|---|---|
| Software total | $300,000 | $300,000 |
| Hardware total | $525,000 + $14,000 = **$539,000** | $525,000 + $3,000,000 = **$3,525,000** |

The point is how the answer changes with volume. At low volume the NRE dominates and the hardware per-unit price hardly matters; at high volume the per-unit price dominates. *(Every figure in this table is recomputed by the site's tests.)* Note the slide's two meanings of "cost per device": the amortised development cost ($525, $1.05, $300, $0.60) and the unit price of the ASIC ($14, $6).

## The printer decision (slide 61)

The slide gives the facts and asks which way to go; it does not give an answer. The hardware solution prints 4 pages per minute and sells for $139; the software solution prints 1 page per minute and sells for $89. The risks: a 30% chance the ASIC needs a second pass through the foundry at **$200,000 and 2 months**; software teams have averaged a **3-month overrun** on the last four projects; and the Consumer Electronics Show is **4 months** away.

A way to start (our analysis, not from the slide): the expected cost of the ASIC respin is 0.30 × $200,000 = **$60,000** and 0.30 × 2 = 0.6 months of expected delay; the software overrun is a 3-month delay on average. Without the planned schedule of each approach you cannot say which one meets the 4-month show date, which is the first thing to find out. Both choices carry schedule risk; the price premium ($139 against $89) and the speed (4 against 1 page per minute) are what the risk buys.` },
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
    G("Bandwidth limiting", "Using a low-pass or band-pass filter so the input contains only the frequencies that matter.", 'L10', "Sampling"),
    G("Bounce", "A mechanical switch's contacts open and close many times before settling; each bounce looks like an input.", 'L10', "Signals"),
    G("Deadband", "The switching range between the two thresholds of a circuit with hysteresis; it limits accuracy.", 'L10', "Signals"),
    G("Fan-out", "How many inputs one output can drive; about 10 for a standard TTL output.", 'L10', "Power"),
    G("Hysteresis", "Two switching thresholds, so noise near the switching point does not toggle the output.", 'L10', "Signals"),
    G("Noise margin", "How much noise an input can carry before it causes a false switch.", 'L10', "Signals"),
    G("NRE", "Non-recurring engineering: one-off development, foundry and tool costs, such as the $525,000 for the slide's ASIC.", 'L10', "Design"),
    G("Opto-isolator", "An LED and a phototransistor that pass a signal with light, with no electrical connection.", 'L10', "Signals"),
    G("Partitioning", "Deciding what a system does in hardware and what in software; iterative.", 'L10', "Design"),
    G("Schmitt trigger", "A gate or comparator with hysteresis, used to debounce switches and clean slow edges.", 'L10', "Signals"),
    G("Sleep mode", "A low-power state in which the processor stops almost all internal activity.", 'L10', "Power"),
    G("Stakeholder", "Anyone affected by the design: software, marketing, mechanical, compliance, component engineering.", 'L10', "Design"),
    G("Termination", "A resistor (or network) that matches a trace's characteristic impedance to stop reflections.", 'L10', "Power"),
    G("Transmission line", "A PC-board trace long enough, for the signal's edge rate, that reflections matter.", 'L10', "Power"),
    G("Watchdog timer", "A timer that resets or interrupts the processor if the software does not retrigger it in time.", 'L10', "Signals"),
  ];

  const SEE = { conversion: ['adc-methods', 'acquisition'], 'adc-methods': ['conversion', 'acquisition'], acquisition: ['adc-methods', 'signals'], signals: ['acquisition', 'power-rf'], 'power-rf': ['signals', 'partitioning'], partitioning: ['power-rf', 'signals'] };
  const DECK_GUIDE = { dac: 'conversion', adc: 'adc-methods', acq: 'acquisition', sig: 'signals', pwr: 'power-rf', des: 'partitioning' };
  const CAT_GUIDE = { Converters: 'conversion', Sampling: 'acquisition', Acquisition: 'acquisition', Signals: 'signals', Power: 'power-rf', Design: 'partitioning' };
  const REFS = [
    { title: 'Analog Devices tutorial MT-002 (aliasing and the Nyquist rate)', url: 'http://www.analog.com/static/imported-files/tutorials/MT-002.pdf', note: 'The overview that Lesson 10 slide 34 cites (link copied from the slide; not re-checked).' },
    { title: 'All About Circuits: Delta-sigma ADC', url: 'https://www.allaboutcircuits.com/textbook/digital/chpt-13/delta-sigma-adc/', note: 'The explanation that Lesson 10 slide 22 cites (link copied from the slide; not re-checked).' },
    { title: 'Maxim application note 810 (flash converters)', url: 'http://www.maxim-ic.com/app-notes/index.mvp/id/810', note: 'Cited by Lesson 10 slide 12 (link copied from the slide; may no longer resolve).' },
  ];
  const api = { GUIDES, GLOSSARY, render, SEE, DECK_GUIDE, CAT_GUIDE, REFS };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.QUEST_GUIDES = api;
})(typeof window !== 'undefined' ? window : globalThis);
