---
track: shared
title: "Design specifications and stakeholders"
summary: "The specification is the formal roadmap; stakeholders from software, marketing, mechanical, compliance and component engineering shape it."
needs: []
sources:
  - { type: slide, ref: "L10 s485", quote: "The design specification is the formal roadmap for what you are supposed to" }
  - { type: slide, ref: "L10 s485", quote: "wants” versus “musts”" }
  - { type: slide, ref: "L10 s486", quote: "Software design team" }
  - { type: slide, ref: "L10 s486", quote: "Compliance engineering" }
checks:
  - type: choice
    prompt: "What is the **design specification**?"
    options: ["The formal roadmap for what you are to design, listing processor, speed, memory, I/O, environment, power, cooling and more; it can have hundreds of items and separate 'musts' from 'wants'", "A parts list only", "The schematic", "The test plan"]
    answer: 0
    explain: "The spec generally lists processor type, speed, RAM quantity and memory map, ROM type and reprogrammability, upgrade plan, data bus width, user environment, temperature and humidity ranges, shock and vibration, power and cooling, I/O and connectors, custom ASICs, IP and CAD tools."
  - type: choice
    prompt: "Which stakeholder raises **cost goals, use models and competition**?"
    options: ["Marketing", "Compliance engineering", "Mechanical engineering", "Component engineering"]
    answer: 0
    explain: "Marketing: cost goals, use models (customer advocate), competition, upgradability. Software: performance, tools, time, memory, legacy code. Mechanical: board space, connectors, mounting, cooling. Compliance: shielding, foreign regulations, temperature, mechanical environment. Component engineering: part qualification, availability, parts to avoid, obsolescence, preferred vendors."
  - type: choice
    prompt: "A customer needs the product to survive vibration in a car. Which spec item does that belong to, and who cares most?"
    options: ["User environment and mechanical shock and vibration; mechanical and compliance engineering", "Data bus width; software", "ROM size; marketing", "CAD tools; component engineering"]
    answer: 0
    explain: "Environment items (user environment, operating and storage temperature, humidity, mechanical shock and vibration) interact with mechanical engineering (mounting, connectors) and compliance engineering."
card:
  front: "What goes in a design spec and who are the stakeholders?"
  back: "Spec: processor, speed, RAM and memory map, ROM type/size/reprogrammability, upgrade plan, bus width, environment, temperature/humidity, shock/vibration, power, cooling, I/O connectors, ASICs, IP, CAD tools ('musts' versus 'wants'). Stakeholders: software, marketing, mechanical, compliance, component engineering."
glossary:
  - { term: "Design specification", def: "The formal list of requirements the design must meet." }
---

## Learn

The **design specification** is the formal roadmap for what you are supposed to design. It generally lists: processor type, speed, quantity and memory mapping of RAM, ROM type/size/location and in-service reprogrammability, upgrade plan, data bus width, user environment (office or automotive), operating and storage temperature range, humidity, mechanical shock and vibration, power and cooling requirements, I/O and connectors, custom ASICs, IP purchases, special CAD tool needs... It may contain hundreds of items and a list of optional **wants** versus **musts**.

**Stakeholders** to talk to before designing:

| Stakeholder | Cares about |
|---|---|
| Software team | performance goals, tools, time, memory, legacy code |
| Marketing | cost goals, use models, competition, upgradability |
| Mechanical engineering | board space, connector location, chassis mounting, cooling |
| Compliance engineering | shielding, foreign regulations, temperature range, mechanical environment |
| Component engineering | new part qualification, availability, parts to avoid or already in use, obsolescence, preferred vendors |

## Worked example

*Marketing wants the product to be upgradeable. Which spec entries does it affect?*

1. 'Upgradability plan' directly.
2. ROM type and reprogrammability (field upgrades).
3. Memory size margin and connector choices.

## Try it

*Who decides which parts are obsolete or to avoid?*

???

Component engineering.
