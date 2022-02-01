/* eslint-disable import/no-named-as-default-member */
import fs from 'fs-extra';
import path from 'path';
import { SetupConfig } from './interfaces.js';

const lockFile = path.join('test', 'express.lock');

export default function getConfig(): Promise<SetupConfig> {
  return fs.readJSON(lockFile);
}
