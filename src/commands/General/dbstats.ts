import { ApplicationCommandRegistry, Command } from '@sapphire/framework';
import { envParseNumber, envParseString } from '@skyra/env-utilities';
import { EmbedBuilder } from 'discord.js';
import { filesize } from 'filesize';
import { MongoClient } from 'mongodb';

export class dbStats extends Command {
    private uri = `mongodb+srv://${envParseString('MONGO_USERNAME')}:${envParseString('MONGO_PASSWORD')}` +
        `@${envParseString('MONGO_HOST')}/${envParseString('MONGO_DB')}?retryWrites=true&w=majority`;

    private mongoClient = new MongoClient(this.uri);

    public constructor(context: Command.Context, options: Command.Options) {
        super(context, {
            ...options,
            description: 'Display MongoDB statistics for Nightscout site'
        });
    }

    public override registerApplicationCommands(registry: ApplicationCommandRegistry) {
        registry.registerChatInputCommand((builder) => {
            builder //
                .setName(this.name)
                .setDescription(this.description)
                .setDMPermission(false)
        });
    }

    public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
        // Establish the embed
        const embed = new EmbedBuilder();

        // Connect to the mongoDB
        try {
            await this.mongoClient.connect();

            const db = await this.mongoClient.db(`${envParseString('MONGO_DB')}`);
            const statsResult = await db.command({ dbStats: 1 });
            const maxSize = envParseNumber('MONGO_DB_MAX_SIZE');

            const tSize = filesize(statsResult.dataSize + statsResult.indexSize, { output: 'object', base: 2 }) as unknown as
                    { value: number, symbol: string, exponent: number };
            const dataPercentage = Math.floor((tSize.value * 100.0) / maxSize);

            await interaction.deferReply();

            if (tSize.value >= 400) {
                embed //
                    .setTitle(`Database: ${statsResult.db}`)
                    .setDescription('Current statistics for this database')
                    .setColor(0xFFFF00)
                    .addFields(
                        { name: 'Collections', value: `${statsResult.collections}` },
                        { name: 'Data Size', value: `${filesize(statsResult.dataSize, { base: 2 })}` },
                        { name: 'Storage Size', value: `${filesize(statsResult.storageSize, { base: 2 })}` },
                        { name: 'Index Size', value: `${filesize(statsResult.indexSize, { base: 2 })}` },
                        { name: 'Aggregate Size (Storage + Index)', value: `${filesize(statsResult.storageSize + statsResult.indexSize, { base: 2 })}` },
                        { name: 'Indexes', value: `${statsResult.indexes}` },
                        { name: 'Percent of DB Used', value: `${dataPercentage}% - ${tSize.value} ${tSize.symbol}`},
                        { name: 'Recommendation', value: 'Your database is close to being full. Backup the database and clear some old entries out to shrink the size.' },
                    );
            } else {
                embed //
                    .setTitle(`Database: ${statsResult.db}`)
                    .setDescription('Current statistics for this database')
                    .setColor(0x00FF00)
                    .addFields(
                        { name: 'Collections', value: `${statsResult.collections}` },
                        { name: 'Data Size', value: `${filesize(statsResult.dataSize, { base: 2 })}` },
                        { name: 'Storage Size', value: `${filesize(statsResult.storageSize, { base: 2 })}` },
                        { name: 'Index Size', value: `${filesize(statsResult.indexSize, { base: 2 })}` },
                        { name: 'Aggregate Size (Storage + Index)', value: `${filesize(statsResult.storageSize + statsResult.indexSize, { base: 2 })}` },
                        { name: 'Indexes', value: `${statsResult.indexes}` },
                        { name: 'Percent of DB Used', value: `${dataPercentage}% - ${tSize.value} ${tSize.symbol}` },
                    );
            }
        } finally {
            await this.mongoClient.close();
        }

        return interaction.followUp({ embeds: [embed] });
    }
}