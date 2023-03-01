import { BucketScope, LogLevel, SapphireClient } from '@sapphire/framework';
import { envParseArray } from '@skyra/env-utilities';
import { GatewayIntentBits, Partials } from 'discord.js';

export class DexcomMongoClient extends SapphireClient {
	public constructor() {
		super({
			disableMentionPrefix: true,
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
			defaultCooldown: {
				filteredUsers: envParseArray('BOT_OWNER_IDS'),
				scope: BucketScope.User,
				delay: 10_000,
				limit: 2
			},
			shards: 'auto',
			logger: {
				level: LogLevel.Debug
			},
			partials: [Partials.Channel]
		});
	}
}
