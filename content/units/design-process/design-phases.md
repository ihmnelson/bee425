---
track: shared
title: "The four phases of a design"
summary: "Research, design, implementation, then assembly and test; a checklist gates ordering parts."
needs: []
sources:
  - { type: slide, ref: "L1 s50", quote: "Research phase" }
  - { type: slide, ref: "L1 s50", quote: "Use a spreadsheet to help bound the problem space" }
  - { type: slide, ref: "L1 s51", quote: "Have I done a design review and addressed all the issues that arise?" }
  - { type: slide, ref: "L1 s51", quote: "Without a plan you will waste time and destroy PCBs and parts" }
checks:
  - type: choice
    prompt: "Which phase includes creating a **project schedule** and sketching a **block diagram**?"
    options: ["The design phase", "The research phase", "The implementation phase", "Assembly and test"]
    answer: 0
    explain: "Research: assess the problem, write what you know and need to research, read articles and gather data. Design: schedule, spreadsheet to bound the problem, block diagram, calculations and simulations."
  - type: choice
    prompt: "Which question belongs to the **checklist before sending off for parts**?"
    options: ["Have I done a design review and addressed all the issues that arise?", "Which colour should the board be?", "Is the logo ready?", "Where is the lab notebook stored?"]
    answer: 0
    explain: "The implementation checklist: do I fully understand how my design works; do I have a complete set of documentation and schematics; have I done separate design reviews of the schematic, the PCB and the software architecture; are the software requirements understood?"
  - type: choice
    prompt: "What is the main reason to have a **plan** for assembly and test?"
    options: ["Without a plan you waste time and destroy PCBs and parts", "It is required by the vendor", "It shortens the schedule by half", "It replaces testing"]
    answer: 0
    explain: "The assembly and test phase goes from loading parts onto the PCB to a product that meets all specifications. The lecture warns that without a plan you will waste time and destroy PCBs and parts."
  - type: choice
    prompt: "Why does the lecture say 'all-nighters' do not work for real projects?"
    options: ["Real-world projects need a schedule; last-minute all-nighters cannot make up for a missing plan", "Employers forbid them", "They use too much electricity", "They only work on weekends"]
    answer: 0
    explain: "In the design phase, create a project schedule: realize that last-minute all-nighters don't work for real-world projects."
card:
  front: "List the four design phases and what each contains."
  back: "1 Research: assess the problem, loose specs, learn what you need, read notes, gather data, talk to experts. 2 Design: schedule, spreadsheet to bound the problem, block diagram, calculations and simulation. 3 Implementation: checklist (understand it, full schematics, design reviews, software requirements) before ordering. 4 Assembly and test: a plan from loading parts to a product that meets specs."
glossary: []
---

## Learn

Whether the project is a function generator, a Capstone project or anything else, the process is very similar:

1. **Research phase.** Assess the problem and decide what to create; write down a loose set of specifications (formalised later); list what you know and what you need to research (including how to design a PCB); read articles and application notes; gather manufacturers' data; discuss it with knowledgeable people.
2. **Design phase.** Create a **project schedule**; use a **spreadsheet to bound the problem space**; sketch the design at **block diagram** level; do calculations and simulations to home in on the final design.
3. **Implementation phase.** Before sending off for parts, check: Do I fully understand how my design works? Do I have complete documentation and a full set of schematics? Have I done a **design review** and addressed all the issues, with separate reviews of the schematic, the PCB and the software architecture? Are the software requirements understood, and can I write the code?
4. **Assembly and test phase.** The process that starts with loading parts onto the PCB and ends with a product that meets all specifications. **Without a plan you will waste time and destroy PCBs and parts.**

## Worked example

*You have a finished schematic and PCB layout for a signal generator. What must happen before you order the boards?*

1. Confirm you understand how every block works and that the documentation is complete.
2. Hold separate design reviews of the schematic, of the PCB design and of the software architecture, and fix what they find.
3. Make sure the software requirements are understood and you can write the code. Only then order parts.

## Try it

*In which phase would you build a spreadsheet of required output amplitudes and component values?*

???

The **design phase** (the lecture says to use a spreadsheet to bound the problem space).
