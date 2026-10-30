---
track: shared
title: "The analog world and sensors"
summary: "Physical quantities become voltages, resistances or currents before they can be digitised."
needs: []
sources:
  - { type: slide, ref: "L10 s434", quote: "The real world is “analog”" }
  - { type: slide, ref: "L10 s434", quote: "Most often we convert a physical entity to an analog voltage" }
  - { type: slide, ref: "L10 s434", quote: "Strain gauge: Measurement of displacement or pressure" }
checks:
  - type: choice
    prompt: "What does 'analog' mean for an electrical signal?"
    options: ["The signal provides an 'analogy' (a continuous copy) of the physical phenomenon", "The signal is a stream of bits", "The signal is always AC", "The signal is a clock"]
    answer: 0
    explain: "An analog signal is an analogy of the physical quantity: its voltage, resistance or current varies continuously with it."
  - type: choice
    prompt: "Which sensor measures **temperature** by a change in resistance?"
    options: ["Resistance thermometer", "Strain gauge", "Photocell", "Microphone"]
    answer: 0
    explain: "The lecture lists thermocouple (temperature), resistance thermometer (temperature), strain gauge (displacement or pressure), microphone (sound), magnetic pickup (disk data) and photocell (light)."
  - type: choice
    prompt: "Why must a sensor's signal usually be **conditioned** before an A/D converter?"
    options: ["The converter expects a fixed voltage range, but the sensor may give another range, a current or a resistance", "Converters only accept digital input", "To make it faster", "To remove the sensor"]
    answer: 0
    explain: "Signal conditioning converts the sensor's output to the proper voltage range (0-5 V, 0-10 V, +/-10 V and so on) for digitising."
card:
  front: "Name some sensors and what they measure."
  back: "Thermocouple and resistance thermometer: temperature. Strain gauge: displacement or pressure. Microphone: sound. Magnetic pickup: disk data. Photocell: light. Most are converted to an analog voltage first."
glossary:
  - { term: "Analog", def: "A signal that is a continuous analogy of a physical phenomenon." }
---

## Learn

The real world is **analog**: the electrical signal provides an *analogy* of the physical phenomenon. Usually a physical quantity is converted to an **analog voltage** (sometimes a resistance or a current):

| Sensor | Measures |
|---|---|
| Thermocouple | temperature |
| Resistance thermometer | temperature |
| Strain gauge | displacement or pressure |
| Microphone | sound level |
| Magnetic pickup | disk data |
| Photocell | light intensity |

There are A/D and D/A converters even in your home PC (for example the sound hardware): they connect these analog signals to the digital system.

## Worked example

*A strain gauge changes its resistance as a beam bends. How does a number reach a microcontroller?*

1. Condition: put the gauge in a bridge or divider so the resistance change becomes a small voltage.
2. Amplify it to the converter's input range.
3. Digitise it with an A/D converter and read the code.

## Try it

*Which converter takes a sensor reading into the processor, and which sends a value out to an actuator?*

???

The **A/D converter** turns an analog voltage into a digital code (sensor to processor); the **D/A converter** turns a digital code into a voltage (processor to the outside world).
