/* Example programs for the sandbox. Several are taken from the BEE 425 lectures (Lessons 4-5). */
(function (root) {
  'use strict';
  const EXAMPLES = [
    { name: 'Hello, world (TRAP #15)', src: `* Print a string with TRAP #15 task 14, then halt (task 9)
        ORG     $1000
START   LEA     msg,A1          * A1 -> null-terminated string
        MOVE.B  #14,D0          * task 14: display string at (A1), no newline
        TRAP    #15
        MOVE.B  #9,D0           * task 9: halt
        TRAP    #15
msg     DC.B    'Hello, 68000!',$0D,$0A,0
        END     START
` },
    { name: 'Read a number, print its square (I/O)', src: `* Task 18: prompt + read a number into D1.L; task 17: prompt + print D1.L
        ORG     $1000
START   LEA     ask,A1
        MOVE.B  #18,D0          * display prompt, read number into D1.L
        TRAP    #15
        MULS    D1,D1           * D1 = D1 * D1 (word x word -> long)
        LEA     out,A1
        MOVE.B  #17,D0          * display string then the number in D1.L
        TRAP    #15
        MOVE.B  #9,D0
        TRAP    #15
ask     DC.B    'Enter a number (-181..181): ',0
out     DC.B    'Its square is ',0
        END     START
` },
    { name: 'Zero a block of memory (L4)', src: `* Clear a block of long words. Memory is pre-filled with $FF so you can watch it clear.
st_addr  EQU   $00002000
end_addr EQU   $00002020

         ORG   st_addr
         DCB.B 64,$FF            Pre-fill 64 bytes with $FF

         ORG   $00001000
START    LEA   st_addr,A0        A0 = start of block
         LEA   end_addr,A1       A1 = limit (never cleared)
clr_loop CMPA.L A1,A0            reached the end?
         BEQ   done
         CLR.L (A0)+             clear a long word, advance A0 by 4
         BRA   clr_loop
done     SIMHALT
         END   START
` },
    { name: 'Sum five bytes (L5)', src: `* Add five numbers with post-increment
         ORG   $1000
START    MOVE.B #5,D0            five numbers to add
         LEA   Table,A0          A0 points to the first
         CLR.W D1                clear the sum
Loop     ADD.B (A0)+,D1          add number to total
         SUBQ.B #1,D0            decrement loop counter
         BNE   Loop              until all numbers added
         SIMHALT
Table    DC.B  1,4,2,6,5
         END   START
` },
    { name: 'Largest of 4 bytes (L4)', src: `* Compare 4 bytes; the largest ends up in MAX_NUM. (The lecture header says D0, but the
* last compare stores straight to memory, so D0 finishes holding $4C, not $7F.)
         ORG   $00001000
START    LEA   DATA,A0           pointer to data
         LEA   MAX_NUM,A1        pointer to result
         MOVE.B (A0)+,D0         first number
         MOVE.B (A0)+,D1         second number
         CMP.B D1,D0
         BGE   NEXT1             keep first
         MOVE.B D1,D0            else take second
NEXT1    MOVE.B (A0)+,D1
         CMP.B D1,D0
         BGE   NEXT2
         MOVE.B D1,D0
NEXT2    MOVE.B (A0),D1
         CMP.B D1,D0
         BGE   NEXT3
         MOVE.B D1,(A1)
         BRA   DONE
NEXT3    MOVE.B D0,(A1)
DONE     SIMHALT
DATA     DC.B  $05,$4C,$42,$7F
MAX_NUM  DS.B  1
         END   START
` },
    { name: 'Largest in null-terminated array (L5)', src: `* Find the largest byte; array ends with $00
         ORG   $400
start    LEA   data,A0
         CLR.B D0
next     MOVE.B (A0)+,D1
         BEQ   exit              null byte? we're done
         CMP.B D0,D1             D1 - D0
         BLE   end_test          not bigger: skip
         MOVE.B D1,D0            new maximum
end_test BRA   next
exit     SIMHALT
         ORG   $1000
data     DC.B  12,13,5,6,8,4,10,0
         END   $400
` },
    { name: 'Subroutine, stack and MOVEM (L5)', src: `* BSR pushes the return address; MOVEM saves registers
         ORG   $1000
start    LEA   $2000,SP          initialise the stack
         MOVE.L #$11111111,D1    D1 must survive the call
         MOVE.B #5,D0
         BSR   double
         BSR   double            D0 = 20
         SIMHALT
double   MOVEM.L D1,-(SP)        save D1
         MOVE.B D0,D1
         ADD.B D1,D0             D0 = D0 * 2
         MOVE.L #$DEADBEEF,D1    trash D1 on purpose
         MOVEM.L (SP)+,D1        restore D1
         RTS
         END   start
` },
    { name: 'Memory test (L5)', src: `* Write four patterns to RAM and read them back (lecture example, shortened)
end_test EQU   $11
test1    EQU   $00
test2    EQU   $FF
test3    EQU   $55
test4    EQU   $AA
st_addr  EQU   $00002000
end_addr EQU   $00002100
stack    EQU   $00007000
max_cnt  EQU   10

         ORG   $400
start    LEA   stack,SP
         LEA   tests,A2          A2 -> test patterns
         LEA   bad_addr,A3       A3 -> bad address list
         LEA   bad_cnt,A4        A4 -> bad count
         MOVE.B #end_test,D6
         MOVE.B #max_cnt,D7
tst_loop CMP.B (A2),D6           done?
         BEQ   done
         LEA   st_addr,A0
         LEA   end_addr,A1
         BSR   do_test
         ADDQ.L #1,A2            next pattern
         CMP.B (A4),D7
         BGT   tst_loop
done     MOVE.B #9,D0
         TRAP  #15               halt the simulator

do_test  MOVEM.L A5,-(SP)        save A5
         MOVEA.L A0,A5           A5 walks through memory
         MOVE.B (A2),D1          D1 = pattern
chk_loop MOVE.B D1,(A5)          write
         CMP.B (A5),D1           read back and compare
         BEQ   nxt_test
         MOVE.L A5,(A3)+         record bad address
         ADDQ.B #1,(A4)
         CMP.B (A4),D7
         BLE   exit
nxt_test ADDQ.L #1,A5
         CMPA.L A5,A1
         BGE   chk_loop
exit     MOVEM.L (SP)+,A5
         RTS

bad_addr DS.L  10
tests    DC.B  test1,test2,test3,test4,end_test
bad_cnt  DC.B  0
         END   start
` },
    { name: 'Odd-address error (try it!)', src: `* A word access on an odd address is an address error on a real 68000.
* No handler is installed, so the simulator stops and reports it.
         ORG   $1000
start    LEA   $2001,A0
         MOVE.W (A0),D0          <- address error
         SIMHALT
         END   start
` },
    { name: 'Multiply and divide, flags', src: `* MULU/DIVU use word operands; DIVU leaves quotient in the low word, remainder in the high word
         ORG   $1000
start    MOVE.W #1000,D0
         MULU  #50,D0            D0 = 50000
         DIVU  #7,D0             quotient 7142, remainder 6
         SWAP  D0                remainder in the low word now
         SIMHALT
         END   start
` },
  ];
  if (typeof module !== 'undefined' && module.exports) module.exports = { EXAMPLES }; else root.EXAMPLES_68K = EXAMPLES;
})(typeof window !== 'undefined' ? window : globalThis);
