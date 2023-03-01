import type { TextChannel } from 'discord.js';
import { Command } from '@sapphire/framework';
import { MongoBackup } from '#lib/backupDB';
import { ApplyOptions } from '@sapphire/decorators';

@ApplyOptions<Command.Options>({
	description: 'Manually backs up mongo database for Nightscout website',
	preconditions: ['OwnerOnly']
})
export class UserCommand extends Command {
	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand((builder) => {
			builder //
				.setName(this.name)
				.setDescription(this.description)
				.setDMPermission(false);
		});
	}

	public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		const dexChan = (await interaction.channel.fetch()) as TextChannel;

		if (dexChan?.isTextBased()) {
			const backupProcess = new MongoBackup(dexChan);
			backupProcess.backup();
		}

		return interaction.reply('Backup process starting... Please check the newly created thread.');
	}
}
