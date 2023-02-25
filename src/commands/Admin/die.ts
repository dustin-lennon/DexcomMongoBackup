import { ApplicationCommandRegistry, Command } from '@sapphire/framework';
import { PermissionFlagsBits } from 'discord.js';

export class DieCommand extends Command {
    public constructor(context: Command.Context, options: Command.Options) {
        super(context, {
            ...options,
            description: 'Kill the bot'
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

    public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
        const replyMessage = interaction.reply('Bot is shutting down by administrator...');

        await replyMessage;

        process.exit(1);
    }
}