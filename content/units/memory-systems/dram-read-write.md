---
track: shared
title: "DRAM read and write sequence"
summary: "Row address, ~RAS low, column address, ~CAS low, with ~WE and ~OE set for read or write."
needs: [dram-operation]
sources:
  - { type: slide, ref: "L7 s331", quote: "~WE must be set high for a read operation to" }
  - { type: slide, ref: "L7 s331", quote: "Data appears at the data output pins of the memory device" }
  - { type: slide, ref: "L7 s332", quote: "~WE must be set low for a certain time for a write" }
checks:
  - type: choice
    prompt: "Put the DRAM **read** steps in order."
    options: ["Row address, ~RAS low, column address, ~WE high, ~CAS low, ~OE low, data appears, then ~CAS and ~RAS return high", "~CAS low, ~RAS low, row address, column address", "Data first, then addresses", "~WE low, ~RAS low, data"]
    answer: 0
    explain: "Simplified read: apply the row address, take ~RAS low, apply the column address, keep ~WE high before ~CAS falls, take ~CAS low, ~OE low within its window, data appears at the outputs, then return ~CAS and ~RAS to their inactive states."
  - type: choice
    prompt: "What is the state of **~WE** during a DRAM read, and during a write?"
    options: ["High for a read; low (for a time) for a write", "Low for a read; high for a write", "Low for both", "High for both"]
    answer: 0
    explain: "~WE must be high before and after ~CAS goes low for a read; it must be low for a certain time (tWP) for a write, with the data applied before ~CAS goes low and held after."
  - type: choice
    prompt: "Which transition makes the data **appear** on a read?"
    options: ["It depends on when ~RAS, ~CAS and ~OE went low and when the address was supplied (tRAC, tCAC, tOEA, tAA)", "The CPU clock edge", "Refresh", "Only ~OE"]
    answer: 0
    explain: "The time at which data appears depends on when ~RAS (tRAC), ~CAS (tCAC) and ~OE (tOEA) went low, and when the address is supplied (tAA)."
card:
  front: "Outline a DRAM read and write cycle."
  back: "Read: row address, ~RAS low, column address, ~WE high, ~CAS low, ~OE low, data valid, then ~CAS and ~RAS high. Write: row address, ~RAS low, column address, ~WE low, data in before ~CAS falls, ~CAS low, then ~CAS and ~RAS high. All with set-up and hold times."
glossary: []
---

## Learn

Simplified **read** (lecture):

1. Apply the **row address** before ~RAS falls (setup tASR) and hold it after (tRAH).
2. ~RAS goes **low** and stays low (tRAS).
3. Apply the **column address** (tASC) and hold it after ~CAS falls (tCAH).
4. ~WE is **high** before (tRCS) and after (tRCH) ~CAS falls.
5. ~CAS goes **low** and stays low (tCAS).
6. ~OE goes low within its window (it may be tied low).
7. **Data appears** at the outputs, at a time set by when ~RAS (tRAC), ~CAS (tCAC) and ~OE (tOEA) fell and when the address was supplied (tAA).
8. ~CAS and ~RAS return to inactive (tCRP, tRP).

Simplified **write**: row address; ~RAS low; column address; **~WE low** for a time (tWP), timed from ~CAS falling (tWCS, tWCH); **data in** applied before ~CAS falls (tDS) and held (tDH); ~CAS low; then ~CAS and ~RAS return to inactive. The chip's on-board logic charges or discharges the cell capacitor depending on whether a 1 or 0 is stored.

You do not need to memorise every t-parameter: know the **order** and which signals are high or low.

## Worked example

*Which signal order distinguishes a DRAM write from a read?*

1. Both send the row address with ~RAS and the column address with ~CAS.
2. In a read, ~WE stays **high** and ~OE goes low so the chip drives the data out.
3. In a write, ~WE goes **low** and data is applied to the pins before ~CAS falls.

## Try it

*Why are ~RAS and ~CAS returned to inactive before the next access?*

???

The cycle is not complete until ~CAS and ~RAS return to their inactive states (the precharge times tCRP and tRP); only then can a new row address be accepted.
