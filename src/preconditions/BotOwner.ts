import { OWNERS } from '#lib/setup';
import { AllFlowsPrecondition } from '@sapphire/framework';
import type { ContextMenuCommand, MessageCommand, PreconditionContext, PreconditionResult } from '@sapphire/framework';
import type { CacheType, CommandInteraction, ContextMenuCommandInteraction, Message, Snowflake } from 'discord.js';

export class UserPrecondition extends AllFlowsPrecondition {
	messageRun(message: Message<boolean>, command: MessageCommand, context: PreconditionContext): PreconditionResult {
		throw new Error('Method not implemented.');
	}

	contextMenuRun(
		interaction: ContextMenuCommandInteraction<CacheType>,
		command: ContextMenuCommand,
		context: PreconditionContext
	): PreconditionResult {
		throw new Error('Method not implemented.');
	}

	#message = 'This command can only be used by the owner.';

	public override chatInputRun(interaction: CommandInteraction) {
		return this.doOwnerCheck(interaction.user.id);
	}

	private doOwnerCheck(userId: Snowflake) {
		return OWNERS.includes(userId) ? this.ok() : this.error({ message: this.#message });
	}
}

declare module '@sapphire/framework' {
	interface Preconditions {
		BotOwner: never;
	}
}
