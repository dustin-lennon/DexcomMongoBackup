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
  });

client.login(config.bot.token).then(() => {
  console.log(`Logged in as ${client.user.tag}`)
})