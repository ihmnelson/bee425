---
track: shared
title: "Homework 2: the EASy68K workflow"
summary: "Edit a .X68 source, assemble with F9 to get a .L68 listing and .S68 S-record, then run in the simulator one step at a time."
needs: ["assembly-intro.assembly-line-format"]
sources:
  - { type: handout, ref: "hw2 P1", quote: "all assembly language source files should have the extension" }
  - { type: handout, ref: "hw2 P1", quote: "HW2.L68 and HW2.S68" }
  - { type: handout, ref: "hw2 P1", quote: "a Motorola S-Record" }
  - { type: handout, ref: "hw2 P1", quote: "Because if you cut and paste, you’ll also copy in all of the invisible formatting characters" }
checks:
  - type: choice
    prompt: "What do the **.X68, .L68 and .S68** files contain?"
    options: ["X68: the assembly source. L68: the list file (addresses, machine code, errors). S68: the S-record of executable code used by the simulator", "All the same", "X68 is the listing", "S68 is the source"]
    answer: 0
    explain: "Assembling creates two more files. If there are errors only the L68 list file is created (look in it for the offending lines). If it assembles, the S-record (a text version of the executable code you could burn into a programmable device) is produced and used by the simulator."
  - type: choice
    prompt: "Why does the handout say **not to cut and paste** the program?"
    options: ["Pasting copies hidden formatting characters that cause assembly errors; copy it into the editor by hand", "It is plagiarism", "It is slower", "The editor cannot paste"]
    answer: 0
    explain: "Cut-and-paste may also bring invisible formatting characters that 'drive you nuts'. Labels (and the eight EQUs) start in column 1; instructions start one tab stop to the right."
  - type: choice
    prompt: "How should you run the program in the simulator?"
    options: ["Single-step from the start and watch the registers; stop at the final BRA and open View > Memory to read the answer", "Run it at full speed and ignore it", "Print it", "Only look at the list file"]
    answer: 0
    explain: "Single-step through the program watching the registers; the memory window shows bytes even if the program wrote words or long words."
  - type: choice
    prompt: "Where do the EQU statements go, and why?"
    options: ["First, after the title block, because the assembler flags a label used before it is defined", "At the end", "Anywhere", "In the data section"]
    answer: 0
    explain: "Equates are like #define in C; they must come first because the assembler will flag an error if it finds a label used before it is defined. The default number system is decimal: %01001111 is binary, $72CF hex."
card:
  front: "Walk through the HW2 workflow."
  back: "Install EASy68K; start a new file named HW2.X68; type (don't paste) the equates in column 1 and the instructions one tab in; save; press F9 to assemble (L68 list file, S68 S-record); if no errors choose EXECUTE; single-step; read memory with View > Memory. Default radix decimal, % binary, $ hex."
glossary:
  - { term: "S-record", def: "A Motorola text format for executable code that can be loaded into a simulator or programmed into a device." }
---

## Learn

**Problem 1 of Homework 2** introduces the **EASy68K** editor/assembler/simulator (written by Professor Chuck Kelly; it will run on a Mac under Wine). The assembler turns your source into executable 68000 code, and an **instruction set simulator** (ISS) runs it as if on a real 68000.

Steps in the handout:

1. Install EASy68K; open the template.
2. Copy the program in by hand (**do not cut and paste**: invisible formatting characters cause errors). The eight **EQUATE** statements begin in **column 1**; the ten instructions begin **one tab stop** to the right. Name it **HW2.X68** (source files use the **.X68** extension) and save.
3. Press **F9** (or Project, or the green arrow) to assemble. This creates **HW2.L68** (the **list file**, which has the addresses, machine code and any errors; print it landscape at 9 points because lines are 132 characters) and, if there are no errors, **HW2.S68**, a **Motorola S-record** (a text form of the executable code).
4. Answer **EXECUTE** to open the simulator and **single-step** the program, watching the registers.
5. At the final `BRA start` stop and open **View > Memory** to answer.

Comments from the handout: EQU, ORG and END are **pseudo-ops** (instructions to the assembler); the **default number system is decimal**; binary uses %, hex uses $.

## Worked example

*Where does the handout say the equates go, and what happens if you put one after its first use?*

1. Equates go first, right after the title block.
2. A label used before it is defined is flagged as an error by the assembler.
3. EQU values are substituted at assembly time, so they generate no machine code.

## Try it

*Which of the three files lets you see why an assembly failed?*

???

The **.L68 list file**: it is the only file created when there are errors, and it marks the lines that caused them.
