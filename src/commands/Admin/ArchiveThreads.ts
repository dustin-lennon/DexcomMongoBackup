import { ApplyOptions } from "@sapphire/decorators";
import { Command } from "@sapphire/framework";
import type { InteractionEditReplyOptions, MessagePayload, TextChannel } from "discord.js";
import { MongoBackup } from '#lib/backupDB';

@ApplyOptions<Command.Options>({
	description: 'Archive Threads',
	preconditions: ['BotOwner']
})
export class UserCommand extends Command {
	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand((builder) =>
			builder //
				.setName(this.name)
				.setDescription(this.description)
				.setDMPermission(false)
		);
	}

	public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		await interaction.reply('Starting archive thread process');

		const dexChan = (await interaction.channel.fetch()) as TextChannel;
		let archiveReply: string | MessagePayload | InteractionEditReplyOptions | Promise<string>;

		if (dexChan?.isTextBased()) {
			const archiveProcess = new MongoBackup(dexChan);
			archiveReply = await archiveProcess.archiveThreads();
		}

		return interaction.editReply(`${archiveReply}`);
	}
}