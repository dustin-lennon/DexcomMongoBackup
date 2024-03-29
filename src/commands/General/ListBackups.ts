import { Command } from '@sapphire/framework';
import { envParseString } from '@skyra/env-utilities';
import { ListObjectsCommand, S3Client } from '@aws-sdk/client-s3';
import { filesize } from 'filesize';
import { PaginatedMessage } from '@sapphire/discord.js-utilities';
import { ApplyOptions, RequiresClientPermissions } from '@sapphire/decorators';
import { DateTime } from 'luxon';

@ApplyOptions<Command.Options>({
	description: 'List backups available for download'
})
export class UserCommand extends Command {
	private S3 = new S3Client({
		apiVersion: '2006-03-01'
	});

	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand((builder) => {
			builder //
				.setName(this.name)
				.setDescription(this.description)
				.setDMPermission(false);
		});
	}

	@RequiresClientPermissions(['EmbedLinks'])
	public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		const params = {
			Bucket: envParseString('AWS_S3_BUCKET')
		};

		await interaction.deferReply();

		const response = await this.S3.send(new ListObjectsCommand(params));
		let fieldItemContents = [];

		// Make sure we have a 200 response
		if (response.$metadata.httpStatusCode === 200) {
			// Push contents into fieldItemContents array
			response.Contents?.forEach((item) => {
				const date = item.LastModified.toISOString();
				const formattedDate = DateTime.fromISO(date).toFormat('LLL dd yyyy @ hh:mm a ZZ');

				fieldItemContents.push([
					{
						name: 'File Name',
						value: `${item.Key}`
					},
					{
						name: 'File Size',
						value: `${filesize(item.Size, { base: 2 })}`
					},
					{
						name: 'Uploaded (Last Modified)',
						value: `${formattedDate}`
					},
					{
						name: 'Download',
						value: `https://${envParseString('AWS_S3_BUCKET')}.s3.${envParseString('AWS_REGION')}.amazonaws.com/${item.Key}`
					}
				]);
			});

			let pagesNum = fieldItemContents.length;

			if (pagesNum !== 0) {
				const paginatedMessage = new PaginatedMessage();

				for (let i = 0; i < pagesNum; i++) {
					paginatedMessage.addPageEmbed((embed) =>
						embed //
							.setColor('Gold')
							.setDescription('File and download information for backups made')
							.addFields(fieldItemContents[i])
							.setFooter({ text: `${pagesNum} of files available for download` })
					);
				}

				return paginatedMessage.run(interaction);
			} else {
				return interaction.followUp('There are no backups available to download');
			}
		} else {
			return interaction.followUp('There was an error retrieving the list...');
		}
	}
}
