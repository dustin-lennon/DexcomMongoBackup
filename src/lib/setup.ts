// Unless explicitly defined, set NODE_ENV as development:
process.env.NODE_ENV ??= 'development';

import '@sapphire/plugin-api/register';
import '@sapphire/plugin-editable-commands/register';
import '@sapphire/plugin-logger/register';
import * as colorette from 'colorette';
import { type NumberString, type ArrayString, setup, envParseArray } from '@skyra/env-utilities';
import { join } from 'path';
import { inspect } from 'util';
import { rootFolder } from './constants';

// Read env var
setup(join(rootFolder, 'src', '.env'));

// Set default inspection depth
inspect.defaultOptions.depth = 1;

// Enable colorette
colorette.createColors({ useColor: true });

export const OWNERS = envParseArray('BOT_OWNER_IDS');

declare module '@skyra/env-utilities' {
	interface Env {
		BOT_OWNER_IDS: ArrayString;
		BOT_REPORT_CHANNEL_ID: string;
		MONGO_HOST: string;
		MONGO_USERNAME: string;
		MONGO_PASSWORD: string;
		MONGO_DB: string;
		MONGO_API_KEY: string;
		MONGO_DB_MAX_SIZE: NumberString;
		AWS_S3_BUCKET: string;
		AWS_REGION: string;
		SENTRY_URL: string;
	}
}
