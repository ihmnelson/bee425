/* A full mock exam shaped like the instructor's practice midterm: trace width, true/false with reasons, memory design,
   short discussion, pairing, hand assembly, write a program. Same seed, same exam. */
import { families } from './index.js';
import { rng } from '../../engine/lib/rng.js';

export const MOCK_ORDER = ['trace-temp', 'true-false', 'memory-design', 'discussion', 'pairing', 'hand-assembly', 'write-program'];

export function makeMock(seed) {
  return MOCK_ORDER.map((id, i) => {
    const p = families[id].make(rng(seed * 101 + i * 7919 + 1));
    return { n: i + 1, id, ...p };
  });
}
