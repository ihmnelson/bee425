---
track: shared
title: "Homework 3, problem 3: smallest byte, signed versus unsigned"
summary: "The same loop gives different answers depending on the branch: BGT for signed bytes ($80 smallest), BHI for unsigned ($00 smallest)."
needs: ["program-control.m68k-signed-unsigned-branches"]
sources:
  - { type: handout, ref: "hw3 P3", quote: "This is a tricky problem because you are looking for the smallest number" }
  - { type: handout, ref: "hw3 P3", quote: "I used BHI, branch if higher, which is the unsigned number test" }
  - { type: handout, ref: "hw3 P3", quote: "BCS (branch on Carry Set)" }
  - { type: oracle, ref: "both readings below are run on the 68000 core with the same data" }
programs:
  - cpu: m68k
    name: "signed reading: smallest byte is $80"
    source: |
      * program
      start_addr EQU $00003000
      end_addr   EQU $0000300C
              ORG     $1000
      start   LEA     start_addr,A0
              LEA     end_addr,A1
              MOVE.B  #$7F,D0
      loop    CMPA.L  A1,A0
              BHS     done
              MOVE.B  (A0)+,D1
              CMP.B   D0,D1
              BGT     loop
              MOVE.B  D1,D0
              BRA     loop
      done    SIMHALT
              ORG     $3000
              DC.B    5,$7F,$FF,$20,$80,9,0,1,2,3,4,6
              END     start
    expect: {"regs": {"D0": 128}}
  - cpu: m68k
    name: "unsigned reading: smallest byte is 1"
    source: |
      * program
      start_addr EQU $00003000
      end_addr   EQU $0000300C
              ORG     $1000
      start   LEA     start_addr,A0
              LEA     end_addr,A1
              MOVE.B  #$FF,D0
      loop    CMPA.L  A1,A0
              BHS     done
              MOVE.B  (A0)+,D1
              CMP.B   D0,D1
              BHI     loop
              MOVE.B  D1,D0
              BRA     loop
      done    SIMHALT
              ORG     $3000
              DC.B    5,$7F,$FF,$20,$80,9,3,1,2,3,4,6
              END     start
    expect: {"regs": {"D0": 1}}
checks:
  - type: choice
    prompt: "Looking for the **smallest signed byte**, what do you load into D0 first and which branch skips larger bytes?"
    options: ["$7F (the largest signed byte) and BGT", "$00 and BLT", "$FF and BHI", "$80 and BEQ"]
    answer: 0
    explain: "Start with the largest possible value so every real byte is smaller or equal: for signed bytes that is $7F (+127), because $80 (-128) is the smallest. Skip with a signed 'greater than' (BGT) after CMP.B D0,D1."
  - type: choice
    prompt: "Looking for the smallest **unsigned** byte, what do you start with and which branch?"
    options: ["$FF and BHI", "$7F and BGT", "$00 and BCS", "$80 and BLT"]
    answer: 0
    explain: "For unsigned bytes the largest is $FF, and the unsigned 'higher' branch is BHI. (The handout says: 'I used BHI, branch if higher, which is the unsigned number test.')"
  - type: choice
    prompt: "The same data run through both programs gives $80 (signed) and the smallest unsigned value. Why are the answers different?"
    options: ["$80 is -128 as signed (the smallest) but 128 as unsigned (large); the branches interpret the same bits differently", "One program is wrong", "The CPU changes mode", "The data differ"]
    answer: 0
    explain: "The handout's key point: the 68K 'pretty much assumes you are always working with signed numbers'. In the unsigned reading the data byte $00 (or the smallest value present) wins."
  - type: choice
    prompt: "According to the table, which unsigned branch is the counterpart of BLT, and of BGE?"
    options: ["BCS for BLT and BCC for BGE (not BLO/BHS names)", "BHI and BLS", "BEQ and BNE", "BGT and BLE"]
    answer: 0
    explain: "After CMP D0,D1: D1 < D0 is BLT (signed) or BCS (unsigned); D1 >= D0 is BGE (signed) or BCC (unsigned). The asymmetry of the names is the confusing part."
card:
  front: "Signed versus unsigned smallest-byte search?"
  back: "Start D0 at the largest value of the interpretation and replace D0 with D1 when D1 is smaller or equal. Signed: start $7F, skip with BGT ($80 = -128 smallest). Unsigned: start $FF, skip with BHI. The handout notes the table: BLT/BCS, BLE/BLS, BGT/BHI, BGE/BCC."
glossary: []
---

## Learn

**Problem 3:** find the **smallest byte** in a memory block of arbitrary size (reuse the loop structure from the search problem; the handout says 'problem #4', but the handout has only three problems). The handout calls it **tricky**: you are looking for the smallest number and the 68K 'pretty much assumes that you are always working with signed numbers'. If you read the bytes as **signed**, the largest byte is $7F (+127) and **$80 is -128, the smallest**. The instructor's solution used **BHI** (branch if higher), the **unsigned** test.

The handout's table (after `CMP D0,D1`): D1 < D0: BLT / BCS; D1 <= D0: BLE / BLS; D1 = D0: BEQ; D1 <> D0: BNE; D1 > D0: BGT / BHI; D1 >= D0: BGE / BCC (signed / unsigned). The unsigned counterparts of BLT and BGE are **BCS and BCC**, not BLO and BHS in the standard mnemonics.

The handout does not say which reading is intended, so the lessons give both solutions (confirmed on the core): the **signed** one starts D0 at $7F and skips with BGT; the **unsigned** one starts at $FF and skips with BHI.

(The handout header also says 'Spring Quarter 2024' although it is the Fall 2026 problem set.)

## Worked example

*Data bytes $05, $FF, $80. Signed and unsigned minimum?*

1. Signed: $05 = +5, $FF = -1, $80 = -128. Minimum **$80**.
2. Unsigned: 5, 255, 128. Minimum **$05**.
3. Same bytes, different answers: choose the branch that matches the meaning of the data.

## Try it

*What would happen if you start D0 at $FF but use the signed branch BGT?*

???

$FF is -1 signed, so the loop treats -1 as the 'largest' starting value and would skip every positive byte as bigger; you would miss values between -1 and +127. Start value and branch must match the interpretation.
