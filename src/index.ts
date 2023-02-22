import './lib/setup';
import { LogLevel, SapphireClient } from '@sapphire/framework';
import { GatewayIntentBits, Partials } from 'discord.js';
import { schedule } from 'node-cron';
import { backupTime } from './lib/constants';
import { MongoBackup } from './lib/backupDB';

const client = new SapphireClient({
    defaultPrefix: process.env.DEFAULT_PREFIX,
    regexPrefix: /^(hey +)?bot[,! ]/i,
    caseInsensitiveCommands: true,
    logger: {
        level: LogLevel.Debug
    },
    shards: 'auto',
    intents: [
        GatewayIntentBits.DirectMessageReactions,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.GuildBans,
        GatewayIntentBits.GuildEmojisAndStickers,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.MessageContent
    ],
    partials: [Partials.Channel],
    loadMessageCommandListeners: true,
    defaultCooldown: {
        limit: 1,
        delay: 3
    }
});

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
    await backupProcess.threadPurge();
}

main();
