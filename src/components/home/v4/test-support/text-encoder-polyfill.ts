/**
 * jsdom provides no TextEncoder, and the served-path builder hashes with one at module load.
 *
 * Kept as its own module so it can be imported ahead of the module that needs it: import
 * declarations are hoisted, so assigning these globals in the test body would run too late.
 */
import { TextDecoder, TextEncoder } from "node:util";

Object.assign(globalThis, { TextEncoder, TextDecoder });
