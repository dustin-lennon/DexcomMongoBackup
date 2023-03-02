import { getRootData } from '@sapphire/pieces';
import { join } from 'path';
import * as os from 'node:os';

export const mainFolder = getRootData().root;
export const rootFolder = join(mainFolder, '..');
export const backupTime = '59 23 * * *';
export const FetchUserAgent = `Sapphire Application Commands/2.0.0 (node-fetch) ${os.platform()}/${os.release()}`;
export const RandomLoadingMessage = ['Computing...', 'Thinking...', 'Cooking some food', 'Give me a moment', 'Loading...'];
