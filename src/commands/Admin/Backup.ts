import { PermissionFlagsBits, TextChannel, type CommandInteraction } from 'discord.js';
import { ApplicationCommandRegistry, Command } from '@sapphire/framework';
import { MongoBackup } from '../../lib/backupDB';
import { ApplyOptions } from '@sapphire/decorators';

@ApplyOptions<Command.Options>({
    description: 'Manually backs up mongo database for Nightscout website'
})
export class UserCommand extends Command {
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