/* Pack description for the Systems section (data conversion): the strings and options the shared shell needs (see js/shell/app.js).
   This pack has no processor: its "sandbox" is the converter lab, and it has no Explain-code page. */
window.PACK_UI = {
  id: 'sys', slug: 'sys', name: 'System design', fullName: 'Data conversion and system design (Lesson 10)', chip: 'A/D', icon: '', accent: 'teal', kind: 'topic',
  projects: { key: 'qsys.projects.v1', ext: 'txt', label: 'Data conversion' },
  tagline: 'A/D and D/A conversion, noisy inputs, power, termination and hardware/software partitioning. Shared by both processors.',
  hero: {
    title: 'Data conversion and system design',
    lede: 'Lesson 10 is not specific to the 68000 or the Z80: it covers how a processor system turns real-world voltages into numbers, how it survives noisy inputs, power and RF limits, and how a design is partitioned between hardware and software. The topics follow the lesson, and the lab lets you change the numbers.',
    buttons: [['#/sandbox', 'Open the converter lab', '']],
  },
  how: { build: ['Experiment', 'Change bits, span and input in the converter lab and watch the code.'] },
  sandboxLabel: 'Converter lab', hasRead: false,
  topicGames: { dac: ['convert'], adc: ['convert'], acq: ['convert'], sig: ['design'], pwr: ['design'], des: ['design'] },
  topicSandbox: ['dac', 'adc', 'acq', 'sig', 'pwr', 'des'],
  topicSandboxText: 'Change the numbers in the lab: the converter staircase and trials, the sampling panel, a Schmitt trigger on a noisy ramp, and the termination, power and cost calculators.',
  guideGroups: [['Converters', ['conversion', 'adc-methods']], ['Around the converter', ['acquisition', 'signals']], ['The whole system', ['power-rf', 'partitioning']]],
  arcade: [
    ['convert', '🧮', 'Converter Drills', 'Step sizes, codes, comparators, V/F counts, droop, dual-slope, aliasing. A new set of numbers every time.', 'L10'],
    ['design', '🧱', 'Design Drills', 'Hysteresis, harmonics, trace termination, CMOS power, hardware against software cost.', 'L10'],
    ['blitz', '⚡', 'Quiz Blitz', 'Timed multiple choice across Lesson 10.', 'L10'],
  ],
  navExtra: [],
  guidesButtons: [['#/sandbox', 'Converter lab']],
  examples: () => [],
  colorize: (l) => l,
  demo: {
    src: `for bit = 3 downto 0
    code = code OR (1 << bit)      ; try the bit
    vdac = code x 0.1 V            ; D/A output
    if vdac > vin then
        code = code AND NOT (1 << bit)
    end if
next bit`,
    make() {
      const vin = 1.23, n = 4, vfs = 1.5, CV = ConvSys; let bit = n - 1, code = 0, vdac = 0, phase = 0, trial = 0, over = false, fin = false;
      return {
        // phases per bit: 0 try, 1 D/A, 2 compare, 3 clear (only when too big), 4 next
        step() {
          if (fin) return;
          if (phase === 0) { code |= 1 << bit; phase = 1; trial++; }
          else if (phase === 1) { vdac = CV.dac(code, vfs, n); phase = 2; }
          else if (phase === 2) { over = vdac > vin + 1e-9; phase = over ? 3 : 4; }
          else if (phase === 3) { code &= ~(1 << bit); phase = 4; }
          else { if (bit === 0) fin = true; else { bit--; phase = 0; } }
        },
        done: () => fin,
        line: () => (fin ? 0 : [2, 3, 4, 5, 7][phase]),
        regs: () => [['BIT', bit, 1], ['CODE', code, 1], ['VDAC x10', Math.round(vdac * 10), 1]],
        flags: () => `Vin ${vin} V, D/A ${CV.dac(code, vfs, n).toFixed(1)} V${fin ? `, result ${CV.bin(code, n)}B = ${code}` : ''}`,
        count: () => `trial ${Math.min(trial, n)} of ${n}`,
      };
    },
  },
  auditFile: null,
  testsIntro: `<p class="lede"><b>In short:</b> every number on this section was recomputed by program, and every statement on a card or in a guide is tied to a slide of Lesson 10. Nobody has compared it with other textbooks, and where the slides disagree with each other this site says so.</p>
    <div class="panel"><h3>What was checked</h3><ul>
      <li><b>Arithmetic.</b> <code>node tests/sys/check-content.js</code> recomputes every worked figure on the cards and in the guides (step sizes, the 1.5 V DAC maximum, 5 µs droop time, 500 MHz flash rate, V/F counts, the 10 kHz filter cutoff, the 1.67 inch termination length, the $525, $1.05, $539,000 and $3,525,000 cost figures) and checks that successive approximation gives the same code as direct quantization for thousands of inputs and 1 to 8 bits.</li>
      <li><b>Drills.</b> Every drill generator is run thousands of times; each must grade its own computed answer as correct and a wrong answer as wrong.</li>
      <li><b>Quiz and cards.</b> Each quiz item has its correct answer among distinct options; each card names a slide.</li></ul></div>
    <div class="panel" style="margin-top:12px"><h3>Where the slides disagree or look wrong</h3><ul>
      <li><b>Comparator count.</b> Slide 12 says an N-bit flash converter needs 2^N − 1 comparators; slide 6 says 256 (and 257 resistors) for 8 bits. This site uses 2^N − 1.</li>
      <li><b>Droop example.</b> Slide 31 gives a typical droop of "50 mV/sec" and a 100 µs sample time; 50 mV/s gives 100 ms, and 100 µs matches 50 mV/ms. The worked 1 V/ms case (5 µs) is right. The Analog Devices source was not checked.</li>
      <li><b>Square-wave limit.</b> Slide 36 quotes 2427 Hz for six terms of a 220 Hz square wave; the sixth odd harmonic is 11 × 220 = 2420 Hz.</li>
      <li><b>Power against clock.</b> Slide 42 says power scales with clock speed, but its own 68K figures (0.13 W at 8 MHz, 0.38 W at 20 MHz) rise 2.9 times for a 2.5 times faster clock.</li>
      <li><b>Cost per device.</b> Slides 59-61 use the phrase for both the amortised development cost ($525, $1.05) and the ASIC unit price ($14, $6); the guide separates them.</li>
      <li><b>Step size.</b> The slides divide the span by 2^N − 1 (8 bits over 10 V = 10/255); many data sheets divide by 2^N. This site follows the slides.</li></ul></div>
    <div class="panel" style="margin-top:12px"><h3>What is not verified</h3><ul>
      <li>Links copied from the slides (Analog Devices, Maxim, All About Circuits) were not opened.</li>
      <li>The aliasing formula |f − k·fs| is standard theory, not from the slides.</li>
      <li>Lesson 9 was not available when this section was written; Lesson 10 is covered through slide 61, but only what is printed on the slides: the slides pose the watchdog RESET-or-NMI question and the printer partitioning question without answering them, and this site labels its own analysis of them as ours.</li>
      <li>The break-even drill uses a hypothetical cost model of ours (software adding a per-unit cost), not the slides' model.</li></ul></div>`,
};
