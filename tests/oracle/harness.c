/* Differential-test harness: run an S68 to halt (or max instructions) and dump state.
   usage: osim file.S68 [maxInsns] [memStartHex:lenHex ...] */
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "def.h"
#include "simhost.h"
extern void initSim(void);
extern int  loadSrec(char *name);
extern int  runprog(void);
extern char *memory;
extern int32_t PC, OLD_PC;
extern int32_t D[], A[];
extern short SR;
extern uint64_t cycles;
extern bool halt, runMode, trace, sstep, stopInstruction;
extern int exceptions;
extern bool bitfield;
int main(int argc, char **argv) {
  if (argc < 2) return 2;
  install_cli_host();
  memory = (char *)calloc(MEMSIZE, 1);
  exceptions = 1; bitfield = false;
  initSim();
  if (loadSrec(argv[1]) != SUCCESS) { fprintf(stderr, "load failed\n"); return 1; }
  OLD_PC = PC; trace = false; sstep = false; halt = false; stopInstruction = false; runMode = true;
  long max = argc > 2 ? atol(argv[2]) : 1000000, n = 0;
  while (runMode && !halt && n < max) { runprog(); n++; }
  printf("{\"halted\":%d,\"steps\":%ld,\"PC\":\"%08X\",\"SR\":\"%04X\",\"cycles\":%llu,\"D\":[", halt ? 1 : 0, n, (unsigned)PC, (unsigned short)SR, (unsigned long long)cycles);
  for (int i = 0; i < 8; i++) printf("%s\"%08X\"", i ? "," : "", (unsigned)D[i]);
  printf("],\"A\":[");
  for (int i = 0; i < 8; i++) printf("%s\"%08X\"", i ? "," : "", (unsigned)((i == 7 && (SR & 0x2000)) ? A[8] : A[i]));
  printf("],\"mem\":{");
  for (int k = 3; k < argc; k++) {
    unsigned st, len; sscanf(argv[k], "%x:%x", &st, &len);
    printf("%s\"%X\":\"", k > 3 ? "," : "", st);
    for (unsigned i = 0; i < len; i++) printf("%02X", (unsigned char)memory[st + i]);
    printf("\"");
  }
  printf("}}\n");
  return 0;
}
