const { Command } = require('discord-akairo')
const MongoClient = require('mongodb').MongoClient

module.exports = class extends Command {
  constructor() {
    super('query', {
      aliases: ['query', 'q'],
      args: [
        {
          id: 'dateTime',
          type: 'regexDate',
          prompt: {
            start: 'From what date would you like to query data from? (YYYY-MM-DD)',
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
    MongoClient.connect(`mongodb://${process.env.MONGO_USERNAME}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_HOST}:${process.env.MONGO_PORT}/${process.env.MONGO_DB}`, {
      useNewUrlParser: true
    }, (err, client) => {
      if (err) {
        console.error(`There was an error: ${err}`)
      }

      const db = client.db(`${process.env.MONGO_DB}`)

      this[args.collectionName] = db.collection(args.collectionName)

      switch (args.collectionName) {
        case 'entries':
          this[args.collectionName].find({
            dateString: {
              $lte: args.dateTime
            }
          }).sort({
            dateString: 1
          }).limit(1).toArray((err, oldest) => {
            if (err) console.error(`There was an error: ${err}`)

            let fieldItems = []
            oldest.forEach(element => {
              for (let item in element) {
                fieldItems.push({
                  name: item,
                  value: element[item]
                })
              }
            })

            message.channel.send({
              embed: {
                title: `Oldest entry for ${args.collectionName} collection`,
                fields: fieldItems
              }
            })
          })

          this[args.collectionName].countDocuments({
            dateString: {
              $lte: args.dateTime
            }
          }, (err, count) => {
            if (err) console.error(`There was an error: ${err}`)
            message.channel.send(`The ${args.collectionName} collection returns ${count.toLocaleString()} results`)
          })
          break

        case 'devicestatus':
          this[args.collectionName].find({
            created_at: {
              $lte: args.dateTime
            }
          }).sort({
            created_at: 1
          }).limit(1).toArray((err, oldest) => {
            if (err) console.error(`There was an error: ${err}`)

            let fieldItems = []
            oldest.forEach(element => {
              for (let item in element) {
                fieldItems.push({
                  name: item,
                  value: element[item]
                })
              }
            })

            message.channel.send({
              embed: {
                title: `Oldest entry for ${args.collectionName} collection`,
                fields: fieldItems
              }
            })
          })

          this[args.collectionName].countDocuments({
            created_at: {
              $lte: args.dateTime
            }
          }, (err, count) => {
            if (err) console.error(`There was an error: ${err}`)
            message.channel.send(`The ${args.collectionName} collection returns ${count.toLocaleString()} results`)
          })
          break

        case 'treatments':
          this[args.collectionName].find({
            created_at: {
              $lte: args.dateTime
            }
          }).sort({
            created_at: 1
          }).limit(1).toArray((err, oldest) => {
            if (err) console.error(`There was an error: ${err}`)

            let fieldItems = []
            oldest.forEach(element => {
              for (let item in element) {
                fieldItems.push({
                  name: item,
                  value: element[item]
                })
              }
            })

            message.channel.send({
              embed: {
                title: `Oldest entry for ${args.collectionName} collection`,
                fields: fieldItems
              }
            })
          })

          this[args.collectionName].countDocuments({
            created_at: {
              $lte: args.dateTime
            }
          }, (err, count) => {
            if (err) console.error(`There was an error: ${err}`)
            message.channel.send(`The ${args.collectionName} collection returns ${count.toLocaleString()} results`)
          })
          break

        default:
          break
      }

      client.close()
    })
  }
}