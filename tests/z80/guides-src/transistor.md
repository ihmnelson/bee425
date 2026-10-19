
A microcontroller pin supplies only about 1 to 20 mA at 3.3-5 V. Real loads (motors, relays, lamps) may need amps or hundreds of volts. A transistor lets the pin *control* a bigger supply.

## The NPN model

- Base current `IB` flows through the base-emitter junction, which looks like a forward-biased diode: **VBE ≈ 0.6 V**.
- Collector current is a multiple of it: **IC = β × IB** (β, also hFE, is the current gain).
- In **switching** use, the transistor is either off (no base current) or driven into **saturation**.

## Saturation

Push in more base current than the load needs and the collector voltage can't fall below about **0.4 V** (VCE(sat), the lecture's conservative figure; small-signal parts are often 0.1-0.3 V). The transistor is now a closed switch.

- Input 0 V: transistor off, collector at the supply voltage.
- Input high: collector ≈ 0.4 V.
- Power in the saturated transistor ≈ **0.4 V × IC**.

> The arithmetic can say a collector should be at −5 V. Sanity check: it can't go below ground, so the transistor is simply saturated.

## Sizing the base resistor

Never connect a pin straight to a base: the junction is a diode to ground and would burn out the pin. Always use a series resistor.

1. Collector current you need: `IC`.
2. Worst-case (minimum) gain: `β(min)`.
3. Base current: `IB = IC / β(min)`.
4. `R = (V_IO − 0.6 V) / IB`.
5. Choose a standard value at or just below the result.

### Worked example (from the lecture)

The pin gives 5 V; the load needs 100 mA; 75 ≤ β ≤ 200.

```
IB = 100 mA / 75 = 1.33 mA
R  = (5 V - 0.6 V) / 1.33 mA = 3.3 kOhm      (rounding IB to 1.3 mA, as the lecture does, gives 3.38 k;
                                              either way the closest standard value is 3.3 k)
```

### Worked example: a lightly driven transistor

25 V supply, 330 Ω collector resistor, 5 V drive through 10 kΩ, β = 100.

```
IB = (5 - 0.6) / 10 k = 440 uA
IC = 100 x 440 uA = 44 mA
drop across 330 ohm = 14.5 V  ->  collector = 25 - 14.5 = 10.5 V
```

Replace 10 kΩ by 1 kΩ: IB = 4.4 mA, the formula wants IC = 440 mA and 145 V across the resistor, which is impossible, so the transistor saturates (collector ≈ 0.4 V).

## Why β is not a constant

It changes with collector current, temperature and between supposedly identical parts (min/max can differ by 3× or more). Design for the **minimum** β.

## Choosing a transistor

- Maximum collector voltage when off must exceed the supply (a 100 V supply → pick a 200 V part).
- Maximum collector current and power dissipation.
- β range at your operating current.
- Linear vs switching type, and package.

## Sourcing and sinking

A pin can **source** current (flows out of the pin, through the load, to ground) or **sink** it (flows into the pin). Many outputs can sink more than they can source (modern CMOS pins are often symmetric).

## Small parts

- **Diode:** conducts anode to cathode once the anode is about 0.6 V above the cathode (silicon; Schottky diodes turn on nearer 0.2-0.4 V). Mind forward current and reverse breakdown.
- **Zener:** uses reverse breakdown as a voltage reference; needs a series resistor to limit current.
- **LED:** forward voltage about 1-4 V; brightness follows forward current; always use a current-limiting resistor.