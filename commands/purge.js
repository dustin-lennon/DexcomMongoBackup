const { Command } = require('discord-akairo')
const MongoClient = require('mongodb').MongoClient

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
   const client = await MongoClient.connect(`mongodb://${process.env.MONGO_USERNAME}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_HOST}:${process.env.MONGO_PORT}/${process.env.MONGO_DB}`, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    })

    const db = client.db(`${process.env.MONGO_DB}`)

    this[args.collectionName] = await db.collection(args.collectionName)

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

    client.close()
  }
}