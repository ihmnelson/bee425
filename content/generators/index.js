/* Registry of every question generator the course uses. The engine imports this file as '@course/generators'. */
import { generators as memory } from './memory.js';
import { generators as pcb } from './pcb.js';
import { generators as number } from './number.js';
import { generators as dram } from './dram.js';
import { generators as misc } from './misc.js';
import { generators as transistor } from './transistor.js';
import { generators as conv } from './conv.js';

export const generators = { ...memory, ...pcb, ...number, ...dram, ...misc, ...transistor, ...conv };
