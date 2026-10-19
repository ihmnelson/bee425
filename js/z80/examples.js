/* Example programs for the sandbox and the Read Code page. Each carries an `expect` object that
   tests/run-examples.js checks by running the program on the CPU core (registers, memory and terminal output).
   Syntax follows the Oshonsoft Z80 Simulator IDE: directives with a leading period, [HL] or (HL) for memory. */
(function (root) {
  'use strict';
  const EX = [
    { name: 'Hello, Z80 (terminal output)', src: `; Print a zero-terminated string to the output terminal (port 02H).
        .ORG 0100H
TERM    .EQU 02H            ; the Oshonsoft output terminal is on port 2
START:  LD HL,MSG           ; HL points at the first character
LOOP:   LD A,[HL]           ; fetch one character
        OR A                ; OR A with itself: sets Z only if A = 0
        JR Z,DONE           ; the 0 byte ends the string
        OUT (TERM),A        ; send it to the terminal
        INC HL              ; next character
        JR LOOP
DONE:   HALT
MSG:    .DB "Hello, Z80!",0DH,0AH,0
        .END
`, expect: { out: 'Hello, Z80!\r\n' } },

    { name: 'Sum a table of bytes (DJNZ loop)', src: `; Add up 8 bytes. DJNZ decrements B and loops until B = 0.
        .ORG 0100H
COUNT   .EQU 8
START:  LD HL,TABLE         ; pointer to the data
        LD B,COUNT          ; loop counter
        XOR A               ; A = 0, the running sum
LOOP:   ADD A,[HL]          ; A = A + (HL)
        INC HL
        DJNZ LOOP
        LD [RESULT],A       ; store the sum
        HALT
TABLE:  .DB 12,7,20,3,45,9,100,1
RESULT: .DS 1
        .END
`, expect: { sym: { RESULT: 197 } } },

    { name: 'Subroutines and the stack', src: `; CALL pushes the return address; RET pops it. PUSH/POP save a register pair.
        .ORG 0100H
START:  LD SP,0F000H        ; the stack grows downward from here
        LD A,7
        CALL SQUARE         ; A = A * A
        LD [RESULT],A
        LD A,12
        CALL SQUARE
        LD [RESULT+1],A
        HALT
SQUARE: PUSH BC             ; keep the caller's BC safe
        LD B,A              ; B = how many times to add
        LD C,A              ; C = the number to add
        XOR A
SQ1:    ADD A,C
        DJNZ SQ1
        POP BC
        RET
RESULT: .DS 2
        .END
`, expect: { sym: { RESULT: 49, 'RESULT+1': 144 }, regs: { SP: 0xF000 } } },

    { name: 'Shift-and-add multiply (25 x 13)', src: `; 8 x 8 -> 16-bit multiply. HL accumulates the product.
        .ORG 0100H
START:  LD D,0
        LD E,25             ; DE = multiplicand (16 bits, shifts left)
        LD C,13             ; C = multiplier (shifts right)
        LD HL,0             ; product
        LD B,8              ; 8 bits
LOOP:   SRL C               ; low multiplier bit goes into the carry flag
        JR NC,SKIP          ; bit was 0: nothing to add
        ADD HL,DE
SKIP:   SLA E               ; DE = DE * 2
        RL D
        DJNZ LOOP
        LD [PRODUCT],HL     ; stored low byte first (little-endian)
        HALT
PRODUCT: .DS 2
        .END
`, expect: { regs: { HL: 325 }, bytes: { PRODUCT: [0x45, 0x01] } } },

    { name: 'Block copy with LDIR', src: `; LDIR copies BC bytes from (HL) to (DE), advancing both pointers.
        .ORG 0100H
START:  LD HL,SRC
        LD DE,DEST
        LD BC,LEN
        LDIR                ; repeats until BC = 0
        HALT
SRC:    .DB "COPY ME",0
LEN     .EQU $-SRC          ; length of the source, worked out by the assembler
DEST:   .DS 8
        .END
`, expect: { regs: { BC: 0 }, text: { DEST: 'COPY ME\0' } } },

    { name: 'Echo the keyboard (IN / OUT)', src: `; Type characters in the "Send" box; each is echoed. Enter (0DH) ends the program.
; Each IN asks you for a value, as the Oshonsoft IDE does.
        .ORG 0100H
KEY     .EQU 01H
TERM    .EQU 02H
START:  IN A,(KEY)          ; read the input device
        CP 0DH              ; carriage return?
        JR Z,DONE
        OUT (TERM),A        ; echo it
        JR START
DONE:   LD A,0AH
        OUT (TERM),A
        HALT
        .END
`, input: [0x5A, 0x38, 0x30, 0x0D], expect: { out: 'Z80\n' } },

    { name: 'Fibonacci table', src: `; Build the first 13 Fibonacci numbers in memory (each fits in a byte).
        .ORG 0100H
START:  LD HL,FIB
        LD [HL],0           ; F(0) = 0
        INC HL
        LD [HL],1           ; F(1) = 1
        LD B,11             ; 11 more terms
NEXT:   LD A,[HL]           ; F(n)
        DEC HL
        ADD A,[HL]          ; + F(n-1)
        INC HL
        INC HL
        LD [HL],A           ; F(n+1)
        DJNZ NEXT
        HALT
FIB:    .DS 13
        .END
`, expect: { sym: { FIB: 0, 'FIB+12': 144, 'FIB+11': 89 } } },

    { name: 'Bubble sort', src: `; Sort 8 bytes into ascending order. Compare neighbours, swap if out of order.
        .ORG 0100H
N       .EQU 8
START:  LD C,N-1            ; number of passes
PASS:   LD HL,ARR
        LD B,C              ; compares in this pass
CMPL:   LD A,[HL]           ; this element
        INC HL
        CP [HL]             ; A - next element: carry if A < next
        JR C,OK
        JR Z,OK
        LD D,[HL]           ; out of order: swap
        LD [HL],A
        DEC HL
        LD [HL],D
        INC HL
OK:     DJNZ CMPL
        DEC C
        JR NZ,PASS
        HALT
ARR:    .DB 45,3,99,12,7,200,1,58
        .END
`, expect: { bytes: { ARR: [1, 3, 7, 12, 45, 58, 99, 200] } } },

    { name: 'Index registers: records with (IX+d)', src: `; Each record is 3 bytes: id, score, bonus. IX points at a record, (IX+d) picks a field.
        .ORG 0100H
START:  LD IX,TAB
        LD B,4              ; four records
        LD DE,3             ; record size
        XOR A
LOOP:   ADD A,[IX+1]        ; score
        ADD A,[IX+2]        ; bonus
        ADD IX,DE           ; next record
        DJNZ LOOP
        LD [TOTAL],A
        HALT
TAB:    .DB 1,10,2
        .DB 2,20,0
        .DB 3,15,5
        .DB 4,30,1
TOTAL:  .DS 1
        .END
`, expect: { sym: { TOTAL: 83 } } },

    { name: 'Print a byte in decimal', src: `; Repeated subtraction turns 203 into the characters 2, 0, 3.
        .ORG 0100H
START:  LD A,203
        LD B,100
        CALL DIGIT          ; hundreds
        LD B,10
        CALL DIGIT          ; tens
        ADD A,'0'           ; what is left is the units digit
        OUT (02H),A
        HALT
DIGIT:  LD C,0              ; C counts the subtractions
D1:     CP B                ; A - B: carry if A < B
        JR C,D2
        SUB B
        INC C
        JR D1
D2:     PUSH AF             ; keep the remainder
        LD A,C
        ADD A,'0'           ; digit value -> ASCII
        OUT (02H),A
        POP AF
        RET
        .END
`, expect: { out: '203' } },

    { name: 'BCD addition with DAA', src: `; DAA fixes up the result of adding two packed-BCD bytes.
        .ORG 0100H
START:  LD A,47H            ; BCD 47
        ADD A,38H           ; binary add: 7FH
        DAA                 ; decimal adjust: 85H
        LD [RESULT],A
        LD A,99H
        ADD A,01H
        DAA                 ; 99 + 1 = 100: A = 00H and carry set
        LD [RESULT+1],A
        HALT
RESULT: .DS 2
        .END
`, expect: { sym: { RESULT: 0x85, 'RESULT+1': 0x00 }, flags: { C: 1 } } },

    { name: 'Interrupts (IM 1) and the INT button', src: `; Press INT in the sandbox: the CPU saves PC, jumps to 0038H, runs the handler, and RETI returns.
        .ORG 0000H
        JP START
        .ORG 0038H          ; IM 1 interrupt vector
        PUSH AF
        LD A,[COUNT]
        INC A
        LD [COUNT],A        ; count the interrupts
        LD A,'*'
        OUT (02H),A
        POP AF
        EI                  ; interrupts are disabled when one is accepted
        RETI
        .ORG 0100H
START:  LD SP,0F000H
        IM 1
        EI
IDLE:   JR IDLE             ; wait here for interrupts
        .ORG 0200H
COUNT:  .DB 0
        .END
`, expect: { interrupts: 3, out: '***', sym: { COUNT: 3 } } },
  ];
  const api = { EXAMPLES: EX };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.EXAMPLES_Z80 = EX;
})(typeof window !== 'undefined' ? window : globalThis);
