const { Command } = require('discord-akairo')
const MongoClient = require('mongodb').MongoClient

const config = require('../config/config.json')

module.exports = class extends Command {
  constructor() {
    super('purge', {
      aliases: ['purge', 'p'],
      args: [
        {
          id: 'dateTime',
          type: 'regexDate',
          prompt: {
            start: 'From what date would you like to purge data from? (YYYY-MM-DD)',
            retry: 'Please enter a valid date (YYYY-MM-DD)'
          }
        },
        {
          id: 'collectionName',
          type: ['entries', 'devicestatus', 'treatments'],
          prompt: {
            start: 'What collection are you purging data from? (entries, devicestatus, treatments)',
            retry: 'Please select from one of the following types (entries, devicestatus, treatments)'
          }
        }
      ],
      ownerOnly: true
    })
  }

  async exec(message, args) {
    MongoClient.connect(`mongodb://${config.mongo.username}:${config.mongo.password}@${config.mongo.host}:${config.mongo.port}/${config.mongo.database}`, {
      useNewUrlParser: true
    }, (err, client) => {
      if (err) {
        console.error(`There was an error: ${err}`)
      }

      const db = client.db(`${config.mongo.database}`)

      this[args.collectionName] = db.collection(args.collectionName)

      switch (args.collectionName) {
        case 'entries':
          this[args.collectionName].bulkWrite([{ deleteMany: { filter: { dateString: { $lte: args.dateTime } } } }], (result) => {
            if (result === null) message.channel.send(`Entries purged from the ${args.collectionName} collection`)
          })
          break

        case 'devicestatus':
          this[args.collectionName].bulkWrite([{ deleteMany: { filter: { created_at: { $lte: `${args.dateTime}:T01:01:01.000Z` } } } }], (result) => {
            if (result === null) message.channel.send(`Entries purged from the ${args.collectionName} collection`)
          })
          break

        case 'treatments':
          this[args.collectionName].bulkWrite([{ deleteMany: { filter: { created_at: { $lte: `${args.dateTime}:T01:01:01.000Z` } } } }], (result) => {
            if (result === null) message.channel.send(`Entries purged from the ${args.collectionName} collection`)
          })
          break

        default:
          break
      }
    })
  }
}