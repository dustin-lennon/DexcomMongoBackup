
import { ApplyOptions } from '@sapphire/decorators';
import { isMessageInstance } from '@sapphire/discord.js-utilities';
import { Command } from '@sapphire/framework';

@ApplyOptions<Command.Options>({
    description: 'Returns the round trip and heartbeat'
})
export class UserCommand extends Command {
    public override registerApplicationCommands(registry: Command.Registry) {
        registry.registerChatInputCommand((builder) => {
            builder //
                .setName(this.name)
                .setDescription(this.description);
        });
    }

    public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
        const msg = await interaction.reply({ content: `Ping?`, fetchReply: true });

        if (isMessageInstance(msg)) {
            const diff = msg.createdTimestamp - interaction.createdTimestamp;
            const ping = Math.round(this.container.client.ws.ping);

            return interaction.editReply(`The round trip took **${diff}ms** and the heartbeat being **${ping}ms**`);
        }

        return interaction.editReply('Failed to retrieve ping...');
    }
}
