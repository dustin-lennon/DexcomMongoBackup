import { ApplyOptions } from '@sapphire/decorators';
import { ApplicationCommandRegistry, Command } from '@sapphire/framework';
import { PermissionFlagsBits } from 'discord.js';

@ApplyOptions<Command.Options>({
    description: 'Kill the bot'
})
export class DieCommand extends Command {
    public override registerApplicationCommands(registry: ApplicationCommandRegistry) {
        registry.registerChatInputCommand((builder) => {
            builder //
                .setName(this.name)
                .setDescription(this.description)
                .setDMPermission(false)
                .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        });
    }

    public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
        const replyMessage = interaction.reply('Bot is shutting down by administrator...');

        await replyMessage;

        process.exit(1);
    }
}