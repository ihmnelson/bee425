/* Registry of problem families (multi-part exam-style problems). The engine imports this file as '@course/problems'.
   A family is {id, title, concepts, conventions, make(rand, opts) -> problem, verify(problem) -> {label: canonical answer}}. */
import { problems as handAsm } from './handasm.js';
import { problems as memory } from './memory.js';
import { problems as trace } from './trace.js';
import { problems as pairing } from './pairing.js';
import { problems as program } from './program.js';
import { problems as misc } from './misc.js';
import { problems as zprogram } from './zprogram.js';

export const families = { ...handAsm, ...memory, ...trace, ...pairing, ...program, ...misc, ...zprogram };
