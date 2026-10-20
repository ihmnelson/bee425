#!/bin/sh
# Runs every automated check that does not need a download.
#   NODE_PATH=<dir containing node_modules/jsdom>   enables the UI test
#   Z80_VECTORS=<SingleStepTests z80/v1 folder>      enables a sample of the CPU vectors (first 100 cases per file)
# z80dasm on the PATH enables the assembler check. The 68K differential fuzzer needs a locally built EASy68K: see tests/m68k/oracle/README.md.
set -e
cd "$(dirname "$0")/.."
echo "== Z80 =="
node tests/z80/run-examples.js
node tests/z80/check-content.js
node tests/z80/oshonsoft-expr.js
node tests/z80/oracle/discheck.js
if command -v z80dasm >/dev/null 2>&1; then node tests/z80/oracle/asmcheck.js; else echo "(skipping z80 asmcheck: z80dasm not installed)"; fi
if [ -n "$Z80_VECTORS" ]; then
  node tests/z80/oracle/vectors.js "$Z80_VECTORS" "" 100
  node --max-old-space-size=8192 tests/z80/oracle/bustrace-check.js "$Z80_VECTORS"
  node tests/z80/oracle/bustrace-decode.js "$Z80_VECTORS" 50
else echo "(skipping z80 vectors and bus-trace checks: set Z80_VECTORS)"; fi
echo "== Site =="
if [ -n "$NODE_PATH" ]; then node tests/ui-smoke.js; else echo "(skipping ui-smoke: set NODE_PATH to a folder with jsdom)"; fi
echo "all checks passed"
