---
track: shared
title: "DRAM organisation: rows, columns, RAS, CAS and refresh"
summary: "A square array is addressed in two halves (row then column) and refreshed a row at a time."
needs: [sram-vs-dram]
sources:
  - { type: slide, ref: "L7 s329", quote: "Row address is clocked in first with a Row Address Strobe (RAS)" }
  - { type: slide, ref: "L7 s329", quote: "Memory is refreshed by doing a RAS cycle" }
  - { type: slide, ref: "L7 s329", quote: "Must have a refresh cycle every 2 microseconds to complete refresh in" }
  - { type: slide, ref: "L7 s330", quote: "Most PC’s use specialized ASIC’s ( chip sets ) to manage external memory" }
checks:
  - gen: dram.rowBits
  - gen: dram.refreshInterval
  - type: choice
    prompt: "In what order are the two halves of a DRAM address sent?"
    options: ["The row address first (with ~RAS), then the column address (with ~CAS)", "Column first, then row", "Both together", "Row address only"]
    answer: 0
    explain: "The row address is clocked in first with the Row Address Strobe (RAS), followed by the column address and the Column Address Strobe (CAS). The same pins carry both halves, so a DRAM has half as many address pins."
  - type: choice
    prompt: "How is a DRAM **refreshed**?"
    options: ["By doing a RAS cycle, which refreshes a whole row at a time (8,192 cells in the lecture's example)", "By turning the power off and on", "By reading each bit with CAS", "By rewriting from the CPU"]
    answer: 0
    explain: "A RAS cycle refreshes one whole row (8,192 cells in the 64-Mbit example). Those cells cannot be accessed for data during the refresh."
  - type: choice
    prompt: "Why is DRAM refresh a 'significant perturbation' to memory access?"
    options: ["A refresh cycle is needed about every 2 µs for the lecture's 8,192 rows in 16.384 ms, and the refreshed row cannot be used for data", "It happens once an hour", "It never interrupts the processor", "It is only done at power-up"]
    answer: 0
    explain: "8,192 rows every 16.384 ms means a refresh cycle about every 2 µs, which interferes with normal memory access."
card:
  front: "How is a DRAM organised, addressed and refreshed?"
  back: "A square matrix of cells (a 64-Mbit DRAM is 8192 x 8192: 13 row + 13 column bits, multiplexed on the same pins). Row address with ~RAS first, then column address with ~CAS. Refresh by doing a RAS cycle (one row at a time): all rows within ~16 ms means a refresh every (total time / rows), e.g. 2 µs."
glossary:
  - { term: "RAS / CAS", def: "Row Address Strobe and Column Address Strobe: signals that latch the row and then the column half of a DRAM address." }
---

## Learn

Reading or writing a DRAM cell recharges it, but how do you read or write all the cells often enough (about every 10 ms)? The solution: **"sort of read" a group of cells at a time.**

The cells are organised as a **matrix**. The lecture's example is a **64-Mbit DRAM** as an **8192 x 8192** array: a 26-bit address made of a **13-bit row address** and a **13-bit column address**.

- The **row address** is clocked in first with the **Row Address Strobe (~RAS)**, followed by the **column address** and the **Column Address Strobe (~CAS)**.
- A memory cycle is therefore more complex: each may involve both RAS and CAS.
- **Refresh** is done by a **RAS cycle**: **8,192 cells are refreshed at a time**, and they cannot be accessed for data while it happens.
- To refresh all 8,192 rows every **16.384 ms**, a refresh cycle is needed **every 2 µs**: a significant perturbation to memory access.

The solutions are complex: large on-chip caches and SRAM secondary caches reduce how often the external DRAM bus is active; DRAM variants (EDO, SDRAM, DDR, DDR2, DDR3 and so on) improve efficiency but need more complex support logic. **Most PCs use ASIC chip sets** to manage memory interfaces, and many embedded processors have **built-in DRAM controllers**.

## Worked example

*A 256-Mbit DRAM is a square array. How many row and column bits, and what is the row refresh interval if 16,384 rows must be refreshed in 32 ms?*

1. 256 Mbit = 2^28 cells; square array: **14 row bits and 14 column bits** (16,384 x 16,384).
2. Refresh interval = 32 ms / 16,384 = **1.95 µs** per row.
3. A smaller interval means more of the time is spent refreshing.

## Try it

*Why can a DRAM use half as many address pins as an SRAM of the same size?*

???

The row and column addresses are sent one after the other on the **same pins** (multiplexed with ~RAS and ~CAS), so the chip needs only as many pins as one half of the address.
