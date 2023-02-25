import { join } from 'path';
import * as os from 'node:os';

export const rootDir = join(__dirname, '..', '..');
export const srcDir = join(rootDir, 'src');
export const backupTime = '59 23 * * *';
export const FetchUserAgent = `Sapphire Application Commands/2.0.0 (node-fetch) ${os.platform()}/${os.release()}`;