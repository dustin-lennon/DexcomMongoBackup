import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';
import type { APIApplicationCommandOptionChoice } from 'discord.js';
import { spawn } from 'child_process';

@ApplyOptions<Command.Options>({
	description: 'Start and stop site running via PM2',
	preconditions: ['BotOwner']
})
export class UserCommand extends Command {
	readonly #choices: APIApplicationCommandOptionChoice<string>[] = [
		{ name: 'Start', value: 'start' },
		{ name: 'Stop', value: 'stop' }
	];

	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand((builder) => {
			builder //
				.setName(this.name)
				.setDescription(this.description)
				.setDMPermission(false)
				.addStringOption((option) =>
					option //
						.setName('start-stop')
						.setDescription('Are you needing to start or stop PM2? (start, stop)')
						.setChoices(...this.#choices)
						.setRequired(true)
				);
		});
	}

	public override async chatInputRun(interation: Command.ChatInputCommandInteraction) {
		await interation.deferReply();

		const startStopValue = interation.options.getString('start-stop', true);
		const pm2 = spawn('pm2', [`${startStopValue}`, 'Dexcom']);

		switch (startStopValue) {
			case 'start':
				pm2.stdout.on('data', (data) => {
					if (data.indexOf('Process successfully started') >= 0) {
						return interation.followUp('PM2 successfully started your site.');
					}
				});

				pm2.stderr.on('data', (data) => {
					console.error(`stderr: ${data}`);
					return interation.followUp(`stderr: ${data}`);
				});

				break;
			case 'stop':
				pm2.stdout.on('data', (data) => {
					if (data.indexOf('stopped') >= 0) {
						return interation.followUp('PM2 successfully stopped your site.');
					}
				});

				pm2.stderr.on('data', (data) => {
					console.error(`stderr: ${data}`);
					return interation.followUp(`stderr: ${data}`);
				});

				break;
		}
	}
}
