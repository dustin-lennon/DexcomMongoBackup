import { AkairoClient } from 'discord-akairo'
import * as moment from 'moment'

// Configuration file
const config = require('./config/config.json')

const client = new AkairoClient({
  ownerID: config.bot.ownerId,
  prefix: config.bot.prefix,
  allowMention: false,
  commandDirectory: './commands/',
  inhibitorDirectory: './inhibitors/',
  listenerDirectory: './listeners'
}, {
    disableEveryone: true
  })

client.build()

client.commandHandler.resolver.addType('regexDate', (word) => {
  const regex = /(\d{4})-(\d{2})-(\d{2})/gm

  if (regex.test(word)) {
    return word
  } else {
    return null
  }
})

client.login(config.bot.token).then(() => {
  console.log(`Logged in as ${client.user.tag}`)
})