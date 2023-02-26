import './lib/setup';

import { schedule } from 'node-cron';
import { backupTime } from './lib/constants';
import { MongoBackup } from './lib/backupDB';
import { DexcomMongoClient } from './DexcomMongoClient';

const client = new DexcomMongoClient();

const main = async () => {
    try {
        client.logger.info('Logging in');
        await client.login();
        client.logger.info('logged in');

        const dexChan = await client.channels.fetch(process.env.BOT_REPORT_CHANNEL_ID);

        // Make sure the channel is text based - why wouldn't it be?
        if (dexChan?.isTextBased()) {
            // Run the scheduled task that will run nightly at 11:59 pm
            schedule(backupTime, () => {
                backupDBProcess(dexChan)
            });
        }
    } catch (error) {
        client.logger.fatal(error);
        client.destroy();
        process.exit(1);
    }
};

const backupDBProcess = async (channel) => {
    const backupProcess = new MongoBackup(channel);

    await backupProcess.backup();
    // await backupProcess.threadPurge();
}

void main();
