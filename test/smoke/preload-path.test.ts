import assert from 'assert';
import { existsSync } from 'fs';
import { join } from 'path';

const packaged = process.env.NODE_ENV === 'production';
const p = packaged
  ? join(__dirname, '..', '..', 'dist', 'preload.js')
  : join(__dirname, '..', '..', 'src', 'main', 'preload.ts');

assert.ok(existsSync(p), `preload missing at ${p}`); 