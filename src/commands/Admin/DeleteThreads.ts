import { MongoBackup } from "#lib/backupDB";
import { ApplyOptions } from "@sapphire/decorators";
import { Command } from "@sapphire/framework";
import type { InteractionEditReplyOptions, MessagePayload, TextChannel } from "discord.js";

@ApplyOptions<Command.Options>({
	description: 'Delete archived threads older than a week',
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
		await interaction.deferReply();

		const dexChan = (await interaction.channel.fetch()) as TextChannel;
		let deleteReply: string | MessagePayload | InteractionEditReplyOptions | Promise<string>;

		if (dexChan?.isTextBased()) {
			const deleteProcess = new MongoBackup(dexChan);
			deleteReply = await deleteProcess.deleteThreads();
		}

		return interaction.editReply(`${deleteReply}`);
	}
}