/* Course content for the shared "Systems" section: data conversion (BEE 425 Lesson 10, slides 1-35, Fall 2026, Berger).
   Every card and question carries a source tag: lesson plus the PDF page ("slide") number of BEE425F26Lesson10.pdf.
   Figures marked (calc) are worked out from the slide's own numbers; tests/sys/check-content.js recomputes them. */
window.QUEST = {};
(function () {
'use strict';

QUEST.WORLDS = [
  { id: 'dac', icon: '🔢', name: 'Comparators & D/A',     lesson: 'L10', blurb: 'The comparator, binary-weighted D/A, resolution and range' },
  { id: 'adc', icon: '⚙️', name: 'A/D Methods',           lesson: 'L10', blurb: 'Flash, ramp, successive approximation, V/F, dual-slope, delta-sigma' },
  { id: 'acq', icon: '🧱', name: 'Data Acquisition',      lesson: 'L10', blurb: 'Conditioning, analog mux, sample and hold, Nyquist' },
];

const C = (deck, q, a, src) => ({ deck, q, a, src });
QUEST.CARDS = [
  /* ===== Comparators & D/A ===== */
  C('dac', 'What does a comparator do, and what is it built from?', 'It compares the voltages at its two inputs and gives a logic output: 1 if the + input is more positive than the − input, 0 if it is less. It is an op-amp running open-loop, with output conditioning so the level is compatible with logic.', 'L10, slide 2'),
  C('dac', 'How do extra comparators give a converter more resolution?', 'Each comparator has its own threshold. With thresholds at 0.25, 0.50 and 0.75 of VMAX, three comparators split the range into four bands, so the output is a 2-bit code 0 to 3.', 'L10, slide 4'),
  C('dac', 'How does a D/A converter turn a digital word into a voltage?', 'Current sources in a binary progression (i, 2i, 4i, 8i, ...) are each switched by one bit of the word into a summing junction. The summed current goes through a current-to-voltage converter, so Vout is proportional to the sum.', 'L10, slide 13'),
  C('dac', 'A 4-bit D/A converter has i = 0.1 mA and R = 1 kΩ. What are its resolution and maximum output?', 'Resolution (one step) 0.1 mA × 1 kΩ = 0.1 V; maximum with all four bits set (i + 2i + 4i + 8i = 15i) is 15 × 0.1 V = 1.5 V (calc from the slide).', 'L10, slide 14'),
  C('dac', 'Why is the D/A converter "the heart" of most A/D converters?', 'Apart from flash, every A/D method needs three elements: a reference voltage, a comparator and a D/A converter. The D/A produces the test voltage that the comparator checks against the unknown input.', 'L10, slide 15'),
  C('dac', 'Resolution and accuracy: how do they differ?', 'Resolution is the ability to tell small differences apart (set by the number of bits). Accuracy is an absolute measure of how well the code represents the true input voltage. They are not synonymous.', 'L10, slides 16-17'),
  C('dac', 'How many steps and what step size does an 8-bit converter give over 0 to 10 V? And a 16-bit one?', '8 bits: 255 steps, 10/255 ≈ 0.04 V per step. 16 bits: 65,535 steps, 10/65,535 ≈ 0.00015 V per step (the course convention: span divided by 2^N − 1).', 'L10, slide 17'),
  C('dac', 'Why amplify a small signal before a 16-bit converter?', 'An unamplified 0.00015 V input would use about 1 bit of the 16. Amplifying so the signal spans the converter\'s input range uses the resolution you paid for.', 'L10, slide 17'),

  /* ===== A/D Methods ===== */
  C('adc', 'Flash converter: speed, resolution, cost, and comparator count?', 'Fastest (about 1 GSPS), lowest resolution (8 to 10 bits), greatest cost per bit and high power. An N-bit flash needs 2^N − 1 comparators; their outputs are a "thermometer code".', 'L10, slides 12 and 16'),
  C('adc', 'A flash converter\'s comparators respond in 1 ns and its decode logic takes 1 ns. How fast can it convert?', '1 ns + 1 ns = 2 ns per conversion, so 500 MHz (500 million conversions per second).', 'L10, slide 6'),
  C('adc', 'How does a single-ramp A/D work, and what is its drawback?', 'A counter feeds a D/A converter, producing a rising ramp, and the count increments until the comparator says the ramp has passed Vx; the count is the result. It is simple, but the conversion time depends on the input (non-deterministic), and large inputs take longest.', 'L10, slides 15, 16 and 18'),
  C('adc', 'How does successive approximation work, and why is it the workhorse?', 'It tests one bit at a time from the MSB down, keeping the bit when the D/A output does not exceed the input: N trials for N bits. It is the most widely used method in the 12 to 18 bit range. Example: ADC1241, 12 bits plus sign, 13.8 µs, self-calibrating, with internal sample and hold.', 'L10, slides 16 and 19'),
  C('adc', 'Voltage-to-frequency conversion: strengths and limits?', 'Very high resolution (not necessarily accurate) and excellent noise rejection, because the longer you count the more noise averages out; it acts like a digital integrator. It is slow and not useful for AC voltages.', 'L10, slide 20'),
  C('adc', 'A V/F converter has k = 100 kHz per volt. What is the count after 1 s and after 10 s at 5 V?', 'Fout = 100 kHz/V × 5 V = 500 kHz, so 500,000 counts in 1 s and 5,000,000 in 10 s.', 'L10, slide 20'),
  C('adc', 'How does dual-slope conversion work, and why is it accurate?', 'Count the V/F pulses for a fixed window T, then switch to a precise Vref and count back down to zero, timing it (tref). Equal counts give Vx·T = Vref·tref, so Vx = Vref·tref / T. Errors in one slope cancel in the other, so accuracy is high but speed is low (about 10 measurements a second for multi-slope designs).', 'L10, slides 23-24'),
  C('adc', 'What is a delta-sigma A/D, in the slides\' terms?', 'A V/F converter with feedback: the input drives an integrator, a comparator and a D flip-flop turn the result into a bitstream of 1s and 0s, and that bitstream is fed back to the integrator. The bitstream represents the input.', 'L10, slide 22'),
  C('adc', 'Rank the A/D methods by what they are best at.', 'Flash: fastest. Single ramp: simplest. Successive approximation: most widely used (12 to 18 bits). Multiple slope: highest precision (16 to 24 bits), very slow. Voltage to frequency: medium accuracy, slowest, highest noise immunity.', 'L10, slide 16'),

  /* ===== Data Acquisition ===== */
  C('acq', 'What are the steps before the actual conversion in a data acquisition system?', 'Signal conditioning (bring the signal into the converter\'s range), analog multiplexing (choose among inputs), then sample and hold (freeze a moving input during the conversion).', 'L10, slides 25-26'),
  C('acq', 'What does signal conditioning do? Give an example part.', 'It converts a sensor\'s voltage, current or resistance into the fixed voltage range the converter expects (0 to 5 V, 0 to 10 V, ±10 V, ...). A programmable gain amplifier, such as the PGA103, extends the sensor range to use the converter\'s full-scale resolution.', 'L10, slide 25'),
  C('acq', 'What is an analog switch, and why is it used instead of a mechanical one?', 'A field-effect transistor whose channel resistance is controlled by the gate voltage. It switches in under 1 µs and has no contact bounce; a mechanical switch is too slow for a computer system (about 10 ms).', 'L10, slides 27 and 29'),
  C('acq', 'Compare a mechanical switch with an analog switch: speed, on and off resistance, bandwidth, current, lifetime.', 'Mechanical: ~10 ms, bounces, 0 Ω on, infinite off, >1 GHz, 1 A, finite life. Analog: 250 ns, no bounce, ~100 Ω on, ~1 GΩ off, 10 to 100 MHz, 30 mA, effectively unlimited life.', 'L10, slide 29'),
  C('acq', 'How does a 4-to-1 analog multiplexer choose an input?', 'Four analog switches share one output. A 2:4 decoder on two select lines (A0, A1) turns on exactly one switch.', 'L10, slide 28'),
  C('acq', 'What does a sample-and-hold circuit do, and what is droop?', 'It stores the instantaneous input on a capacitor (sample: SW1 closed, SW2 open; hold: SW1 open) so the voltage stays constant while the converter works. Droop is how fast the stored voltage leaks away; it must stay under the accuracy you need during the conversion.', 'L10, slide 30'),
  C('acq', 'An input changes at 1000 V/s and the conversion takes 1 ms. What goes wrong?', 'The input moves 1000 V/s × 1 ms = 1 V during the conversion, so the digitised result is only meaningful to about 1 V. A sample-and-hold freezes the input to prevent this (calc).', 'L10, slide 26'),
  C('acq', 'A 10-bit converter spans 0 to 10.23 V and the S/H droops 1 V/ms. How long may the conversion take for droop error ≤ ½ LSB?', '1 count = 10 mV, so ½ LSB = 5 mV. 5 mV ÷ (1 V/ms) = 5 µs.', 'L10, slides 30-31'),
  C('acq', 'What is the Nyquist rate and what happens below it?', 'Take at least two samples per cycle of the signal (sampling frequency 2× the signal frequency, strictly more in theory) to avoid aliasing. Below that, the samples look like a different, lower frequency; a 10 kHz sine sampled every 100 µs looks like a constant voltage.', 'L10, slide 34'),
  C('acq', 'How do you protect a converter from frequencies above half the sample rate?', 'Limit the bandwidth before the converter with a low-pass filter. The slide\'s 2-pole example uses R1 = R2 = 11.2 kΩ, C1 = 1000 pF and C2 = 2000 pF for a 10 kHz cutoff (calc: 1/(2π·R·√(C1·C2)) ≈ 10 kHz).', 'L10, slide 35'),
];

/* ---------- Quiz: {world, q, correct, wrong[3], why} ---------- */
const Q = (world, q, correct, wrong, why) => ({ world, q, correct, wrong, why });
QUEST.QUIZ = [
  Q('dac', 'A comparator\'s output is 1 when...', 'the + input is more positive than the − input', ['the − input is more positive than the + input', 'both inputs are equal', 'the output stage is saturated'], 'Out = 1 if V1 > V2 (slide 2).'),
  Q('dac', 'An N-bit flash converter needs how many comparators?', '2^N − 1', ['N', '2N', '2^N + 1'], 'One comparator per threshold; slide 12 gives 2^N − 1 (slide 6 counts 256 for 8 bits, which is off by one).'),
  Q('dac', 'In the binary-weighted D/A, what do the bits control?', 'current sources of i, 2i, 4i, 8i... into a summing junction', ['the gain of an amplifier', 'the clock of a counter', 'a resistor ladder\'s reference only'], 'Each bit switches one current in the progression (slide 13).'),
  Q('dac', 'What is the voltage step of an 8-bit converter over 0 to 10 V (course convention)?', 'about 0.04 V', ['about 0.4 V', 'about 0.01 V', 'about 0.00015 V'], '10/255 = 0.039 V (slide 17).'),
  Q('dac', 'Which statement is true?', 'Resolution and accuracy are not synonymous', ['A 16-bit converter is always 16-bit accurate', 'Accuracy is the number of bits', 'Resolution is how well the code matches the true voltage'], 'Slide 17: accuracy is absolute correctness; resolution is the smallest difference you can see.'),
  Q('adc', 'Which A/D method is the fastest?', 'flash', ['successive approximation', 'dual-slope', 'voltage to frequency'], 'Flash reaches about 1 GSPS (slides 12, 16).'),
  Q('adc', 'Which method is the most widely used in the 12 to 18 bit range?', 'successive approximation', ['flash', 'single ramp', 'delta-sigma'], 'Slide 16 and 19: still the workhorse.'),
  Q('adc', 'What is the drawback of a single-ramp A/D?', 'conversion time depends on the input voltage', ['it needs 2^N comparators', 'it cannot work with a D/A converter', 'it only digitises AC'], 'The counter runs until the ramp passes Vx, so the time varies (slides 16, 18).'),
  Q('adc', 'Why is V/F conversion good in noisy environments?', 'counting for longer averages the noise away', ['it uses many comparators', 'it samples very quickly', 'it filters AC with a capacitor'], 'The longer the digitisation period, the greater the noise rejection (slide 20).'),
  Q('adc', 'A V/F converter gives 100 kHz per volt. What is the pulse count in 10 s for 5 V?', '5,000,000', ['500,000', '50,000,000', '50,000'], '100,000 × 5 × 10 = 5,000,000 (slide 20).'),
  Q('adc', 'In dual-slope conversion, Vx is found from...', 'Vx = Vref × tref / T', ['Vx = Vref × T / tref', 'Vx = Vref + tref', 'Vx = Vref / (T × tref)'], 'Equal areas: Vx·T = Vref·tref (slide 24).'),
  Q('adc', 'How many trials does a successive-approximation converter use for 12 bits?', '12', ['1', '4096', '24'], 'One trial per bit, MSB first.'),
  Q('acq', 'What is the correct order of the conditioning steps?', 'signal conditioning, analog mux, sample and hold, A/D', ['sample and hold, signal conditioning, mux, A/D', 'A/D, mux, sample and hold', 'mux, A/D, signal conditioning'], 'Slides 25-26.'),
  Q('acq', 'Why use an analog switch (FET) rather than a mechanical switch in a mux?', 'it is fast (under 1 µs) and does not bounce', ['it has zero on-resistance', 'it passes more current', 'it has a higher bandwidth'], 'Slides 27 and 29: the analog switch has about 100 Ω on-resistance and 30 mA current limit.'),
  Q('acq', 'What problem does a sample-and-hold solve?', 'the input changes while the converter is digitising', ['the input is too small', 'the converter has too few bits', 'the input has noise at 50 Hz'], 'It freezes the input during the conversion (slides 26, 30).'),
  Q('acq', '10-bit converter, 0 to 10.23 V, droop 1 V/ms: maximum conversion time for ½ LSB error?', '5 µs', ['50 µs', '5 ms', '500 ns'], '5 mV ÷ 1 V/ms = 5 µs (slide 31).'),
  Q('acq', 'To avoid aliasing, a sine of frequency f must be sampled at...', 'more than 2f (at least two samples per cycle)', ['f', 'f/2', 'exactly f'], 'Slide 34. Sampling at f makes the signal look constant.'),
  Q('acq', 'What goes in front of the converter to remove frequencies above half the sample rate?', 'a low-pass filter', ['a high-pass filter', 'a second multiplexer', 'a bigger reference voltage'], 'Slide 35 shows a 2-pole low-pass.'),
];

QUEST.BUGS = [];
QUEST.PROGRAMS = [];
QUEST.MODES = [];
})();
