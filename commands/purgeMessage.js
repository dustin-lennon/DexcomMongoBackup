const {
    Command
} = require('discord-akairo')
const moment = require('moment')

module.exports = class extends Command {
    constructor() {
        super('purgeMessage', {
            aliases: ['pm', 'pMessage', 'pMes'],
            ownerOnly: true
        })
    }

    async exec(message) {
        // 8 days prior to today as Epoch time in ms (S3 holds 8 records at a time)
        const weekDate = +moment().subtract(8, 'days')

        message.channel.fetchMessages({
                limit: 100
            })
            .then(collected => {
                const botMessages = collected.filter(m => m.author.id === this.client.user.id)

                botMessages.forEach(msg => {
                    if (msg.createdTimestamp < weekDate) {
                        console.log(`Message: ${msg}`)
                        msg.delete() // Delete the message
                    }
                })
            })
            .catch(err => console.error(`An error has occured error: ${err}`))
    }
}
