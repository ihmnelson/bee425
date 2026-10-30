/* Registry of every question generator the course uses. The engine imports this file as '@course/generators'. */
import { generators as memory } from './memory.js';
import { generators as pcb } from './pcb.js';
import { generators as number } from './number.js';

export const generators = { ...memory, ...pcb, ...number };
