const { Command } = require('discord-akairo')

module.exports = class extends Command {
  constructor() {
    super('die', {
      aliases: ['die', 'kill', 'begone'],
      ownerOnly: true
    })
  }

  async exec(message) {
    const goodbye = await message.channel.send(`I know when I am not wanted anymore :frowning2:`)
    const destroy = await this.client.destroy()

    goodbye
    destroy
    process.exit()
  }
}