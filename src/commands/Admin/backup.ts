import { PermissionFlagsBits, TextChannel } from 'discord.js';
import { ApplicationCommandRegistry, Command } from '@sapphire/framework';
import { MongoBackup } from '../../lib/backupDB';
import type { CommandInteraction } from 'discord.js';

export class BackupCommand extends Command {
    public constructor(context: Command.Context, options: Command.Options) {
        super(context, {
            ...options,
            description: 'Manually backs up mongo database for Nightscout website'
        });
    }

    public override registerApplicationCommands(registry: ApplicationCommandRegistry) {
        registry.registerChatInputCommand((builder) => {
            builder //
                .setName(this.name)
                .setDescription(this.description)
                .setDMPermission(false)
                .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        });
    }

    public override async chatInputRun(interaction: CommandInteraction) {
        const dexChan = await interaction.channel.fetch() as TextChannel;

        if (dexChan?.isTextBased()) {
            const backupProcess = new MongoBackup(dexChan);
            backupProcess.backup();
        }

        return interaction.reply('Backup process starting... Please check the newly created thread.');
    }
}