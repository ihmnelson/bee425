/* Registry of every question generator the course uses. The engine imports this file as '@course/generators'. */
import { generators as memory } from './memory.js';

export const generators = { ...memory };
