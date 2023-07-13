import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';
import { type Document, MongoClient, ServerApiVersion } from 'mongodb';
import { envParseString } from '@skyra/env-utilities';
import type { APIApplicationCommandOptionChoice, Message } from 'discord.js';
import { validateDateFormat, validateDate } from '#lib/util/date';
import { DateTime } from 'luxon';

@ApplyOptions<Command.Options>({
	description: 'Purge database entries',
	preconditions: ['BotOwner']
})
export class UserCommand extends Command {
	private uri =
		`mongodb+srv://${envParseString('MONGO_USERNAME')}:${envParseString('MONGO_PASSWORD')}` +
		`@${envParseString('MONGO_HOST')}/?retryWrites=true&w=majority`;

	private mongoClient = new MongoClient(this.uri, { useBigInt64: true, serverApi: ServerApiVersion.v1 });

	readonly #collectionChoices: APIApplicationCommandOptionChoice<string>[] = [
		{ name: 'Entries', value: 'entries' },
		{ name: 'Device Status', value: 'devicestatus' },
		{ name: 'Treatments', value: 'treatments' }
	];

	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand((builder) =>
			builder //
				.setName(this.name)
				.setDescription(this.description)
				.setDMPermission(false)
				.addStringOption((option) =>
					option //
						.setName('date')
						.setDescription('From what date would you like to purge data from? (YYYY-MM-DD)')
						.setRequired(true)
				)
				.addStringOption((option) =>
					option //
						.setName('collection-name')
						.setDescription('What collection are you purging data from? (entries, devicestatus, treatments)')
						.setChoices(...this.#collectionChoices)
						.setRequired(true)
				)
		);
	}

	public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		await interaction.deferReply();

		const dateParam = interaction.options.getString('date', true);
		const selectedCollection = interaction.options.getString('collection-name', true);

		let dateToUTC: string | Promise<Message<boolean>>;
		let date: number | Promise<Message<boolean>>;
		let filter: Document;
		let deletedResult;

		// Connect to the mongoDB
		try {
			await this.mongoClient.connect();

			const collection = await this.mongoClient.db(`${envParseString('MONGO_DB')}`).collection(selectedCollection);

			switch (selectedCollection) {
				case 'entries':
					// First make sure that the date passed in passes the necessary formatting & make sure the date is a valid date
					date = validateDateFormat(dateParam)
						? validateDate(dateParam)
							? DateTime.fromFormat(dateParam, 'yyyy-LL-dd').toMillis()
							: interaction.editReply('Not a valid date')
						: interaction.editReply('Please enter date in the format of YYYY-MM-DD');

					filter = { date: { $lte: date } };
					deletedResult = await collection.deleteMany(filter);

					break;
				case 'devicestatus':
				case 'treatments':
					// ISO formatted date
					dateToUTC = validateDateFormat(dateParam)
						? validateDate(dateParam)
							? DateTime.fromFormat(dateParam, 'yyyy-LL-dd').toISO()
							: interaction.editReply('Not a valid date')
						: interaction.editReply('Please enter date in the format of YYYY-MM-DD');

					filter = { created_at: { $lte: `${dateToUTC}` } };
					deletedResult = await collection.deleteMany(filter);

					break;
			}

			return interaction.followUp(`Deleted ${new Intl.NumberFormat().format(deletedResult.deletedCount)} documents from the ${selectedCollection} collection.`);
		} finally {
			await this.mongoClient.close();
		}
	}
}