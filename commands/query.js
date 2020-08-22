const { Command } = require('discord-akairo')
const moment = require('moment')
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
    const client = await MongoClient.connect(`mongodb://${process.env.MONGO_USERNAME}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_HOST}:${process.env.MONGO_PORT}/${process.env.MONGO_DB}`, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    })

    const db = client.db(`${process.env.MONGO_DB}`)

    this[args.collectionName] = db.collection(args.collectionName)

    switch (args.collectionName) {
      case 'entries':
        await this[args.collectionName].find({
          dateString: {
            $lte: args.dateTime
          }
        }).sort({
          dateString: 1
        }).limit(1).toArray(async (err, oldest) => {
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

          await message.channel.send({
            embed: {
              title: `Oldest entry for ${args.collectionName} collection`,
              fields: fieldItems
            }
          })
        })

        let countEntries = await this[args.collectionName].countDocuments({
          dateString: {
            $lte: args.dateTime
          }
        })

        message.channel.send(`The ${args.collectionName} collection returns ${countEntries.toLocaleString()} results since ${moment(args.dateTime).format('MMM DD YYYY')}`)
        break

      case 'devicestatus':
        await this[args.collectionName].find({
          created_at: {
            $lte: args.dateTime
          }
        }).sort({
          created_at: 1
        }).limit(1).toArray(async (err, oldest) => {
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

          await message.channel.send({
            embed: {
              title: `Oldest entry for ${args.collectionName} collection`,
              fields: fieldItems
            }
          })
        })

        let countDeviceStatus = await this[args.collectionName].countDocuments({
          created_at: {
            $lte: args.dateTime
          }
        })

        message.channel.send(`The ${args.collectionName} collection returns ${countDeviceStatus.toLocaleString()} results since ${moment(args.dateTime).format('MMM DD YYYY')}`)
        break

      case 'treatments':
        await this[args.collectionName].find({
          created_at: {
            $lte: args.dateTime
          }
        }).sort({
          created_at: 1
        }).limit(1).toArray(async (err, oldest) => {
          if (err) console.error(`There was an error: ${err}`)

          let fieldItems = []
          oldest.forEach(element => {
            for (let item in element) {
              fieldItems.push({
                name: item,
                value: (element[item] === "") ? 'null' : `${element[item]}`
              })
            }
          })

          await message.channel.send({
            embed: {
              title: `Oldest entry for ${args.collectionName} collection`,
              fields: fieldItems
            }
          })
        })

        let countTreatments = await this[args.collectionName].countDocuments({
          created_at: {
            $lte: args.dateTime
          }
        })

        message.channel.send(`The ${args.collectionName} collection returns ${countTreatments.toLocaleString()} results since ${moment(args.dateTime).format('MMM DD YYYY')}`)
        break

      default:
        break
    }

    client.close()
  }
}