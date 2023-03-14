import '#lib/setup';

import { schedule } from 'node-cron';
import { backupTime, rootFolder } from '#lib/constants';
import { MongoBackup } from '#lib/backupDB';
import { DexcomMongoClient } from './DexcomMongoClient';
import { envParseString } from '@skyra/env-utilities';
import { RewriteFrames } from '@sentry/integrations';
import { container } from '@sapphire/framework';

import * as Sentry from '@sentry/node';
import * as Tracing from '@sentry/tracing';

const client = new DexcomMongoClient();

const main = async () => {
	// Load in Sentry for error logging
	if (envParseString('SENTRY_URL')) {
		Sentry.init({
			dsn: envParseString('SENTRY_URL'),
			tracesSampleRate: 1.0,
			environment: envParseString('NODE_ENV'),
			integrations: [
				new Sentry.Integrations.Modules(),
				new Sentry.Integrations.FunctionToString(),
				new Sentry.Integrations.LinkedErrors(),
				new Sentry.Integrations.Console(),
				new Sentry.Integrations.Http({ breadcrumbs: true, tracing: true }),
				new RewriteFrames({ root: rootFolder })
			]
		});
	}

	try {
		client.logger.info('Logging in');
		await client.login();
		client.logger.info('logged in');

		const dexChan = await client.channels.fetch(envParseString('BOT_REPORT_CHANNEL_ID'));

		// Make sure the channel is text based - why wouldn't it be?
		if (dexChan?.isTextBased()) {
			// Run the scheduled task that will run nightly at 11:59 pm
			schedule(backupTime, () => {
				dexChan.send('Starting nighly backup, thread archive, and thread purge...');
				backupDBProcess(dexChan);
			});
		}
	} catch (error) {
		container.logger.error(error);
		client.destroy();
		process.exit(1);
	}
};

const backupDBProcess = async (channel) => {
	const backupProcess = new MongoBackup(channel);

	await backupProcess.backup();
	await backupProcess.archiveThreads();
};

main().catch(container.logger.error.bind(container.logger));
