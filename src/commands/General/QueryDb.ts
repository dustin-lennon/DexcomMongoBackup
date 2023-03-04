import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';
import { Document, MongoClient, ServerApiVersion } from 'mongodb';
import { envParseString } from '@skyra/env-utilities';
import { APIApplicationCommandOptionChoice, EmbedBuilder, Message } from 'discord.js';
import { validateDateFormat, validateDate } from '#lib/util/date';
import * as moment from 'moment';

@ApplyOptions<Command.Options>({
	description: 'Query MongoDB collections data'
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
						.setDescription('From what date would you like to query data from? (YYYY-MM-DD)')
						.setRequired(true)
				)
				.addStringOption((option) =>
					option //
						.setName('collection-name')
						.setDescription('What collection are you query data from? (entries, devicestatus, treatments)')
						.setChoices(...this.#collectionChoices)
						.setRequired(true)
				)
		);
	}

	public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		await interaction.deferReply();

		// Establish the embed
		const embed = new EmbedBuilder();

		const dateParam = interaction.options.getString('date', true);
		const selectedCollection = interaction.options.getString('collection-name', true);

		let dateToUTC: string | Promise<Message<boolean>>;
		let date: number | Promise<Message<boolean>>;
		let query: Document;
		let fieldItems = [];
		let countEntries: number;

		// Connect to the mongoDB
		try {
			await this.mongoClient.connect();

			const collection = await this.mongoClient.db(`${envParseString('MONGO_DB')}`).collection(selectedCollection);

			switch (selectedCollection) {
				case 'entries':
					// First make sure that the date passed in passes the necessary formatting & make sure the date is a valid date
					date = validateDateFormat(dateParam)
						? validateDate(dateParam)
							? new Date(dateParam).getTime()
							: interaction.editReply('Not a valid date')
						: interaction.editReply('Please enter date in the format of YYYY-MM-DD');

					query = { date: { $lte: date } };
					const entriesResult = await collection.find(query).limit(1).toArray();

					entriesResult.forEach((element) => {
						for (let item in element) {
							fieldItems.push({
								name: `${item}`,
								value: `${element[item]}`
							});
						}
					});

					countEntries = await collection.countDocuments(query);

					embed //
						.setTitle(`Oldest entry for ${selectedCollection} collection`)
						.setColor(0xffff00)
						.addFields(fieldItems)
						.setFooter({
							text: `The ${selectedCollection} collection returns ${countEntries.toLocaleString()} results since ${moment(
								dateParam
							).format('MMM DD YYYY')}`
						});

					break;
				case 'devicestatus':
					// ISO formatted date
					dateToUTC = validateDateFormat(dateParam)
						? validateDate(dateParam)
							? moment(dateParam).toISOString(true)
							: interaction.editReply('Not a valid date')
						: interaction.editReply('Please enter date in the format of YYYY-MM-DD');

					query = { created_at: { $lte: dateToUTC } };
					const deviceStatusResult = await collection.find(query).limit(1).toArray();

					deviceStatusResult.forEach((element) => {
						for (let item in element) {
							fieldItems.push({
								name: `${item}`,
								value: `${element[item]}`
							});
						}
					});

					countEntries = await collection.countDocuments(query);

					embed //
						.setTitle(`Oldest entry for ${selectedCollection} collection`)
						.setColor(0xffff00)
						.addFields(fieldItems)
						.setFooter({
							text: `The ${selectedCollection} collection returns ${countEntries.toLocaleString()} results since ${moment(
								dateParam
							).format('MMM DD YYYY')}`
						});

					break;
				case 'treatments':
					// ISO formatted date
					date = validateDateFormat(dateParam)
						? validateDate(dateParam)
							? new Date(dateParam).getTime()
							: interaction.editReply('Not a valid date')
						: interaction.editReply('Please enter date in the format of YYYY-MM-DD');

					query = { timestamp: { $lte: date } };
					const treatmentsResult = await collection.find(query).limit(1).toArray();

					treatmentsResult.forEach((element) => {
						for (let item in element) {
							fieldItems.push({
								name: `${item}`,
								value: (element[item] === "") ? 'null' : `${element[item]}`
							});
						}
					});

					countEntries = await collection.countDocuments(query);

					embed //
						.setTitle(`Oldest entry for ${selectedCollection} collection`)
						.setColor(0xffff00)
						.addFields(fieldItems)
						.setFooter({
							text: `The ${selectedCollection} collection returns ${countEntries.toLocaleString()} results since ${moment(
								dateParam
							).format('MMM DD YYYY')}`
						});

					break;
			}

			return interaction.followUp({ embeds: [embed] });
		} finally {
			await this.mongoClient.close();
		}
	}
}
