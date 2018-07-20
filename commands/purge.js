const {
  Command
} = require('discord-akairo')
const MongoClient = require('mongodb').MongoClient
const Db = require('mongodb').Db

const config = require('../config/config.json')

module.exports = class extends Command {
  constructor() {
    super('purge', {
      aliases: ['purge', 'p'],
      ownerOnly: true
    })
  }

  async exec(message) {
    MongoClient.connect(`mongodb://${config.mongo.username}:${config.mongo.password}@${config.mongo.host}:${config.mongo.port}/${config.mongo.database}`, {
      useNewUrlParser: true
    }, (err, client) => {
      if (err) {
        console.error(`There was an error: ${err}`)
      }

      const db = client.db(`${config.mongo.database}`)

      const deviceCollection = db.collection('devicestatus')
      const entriesCollection = db.collection('entries')
      const foodCollection = db.collection('food')
      const profileCollection = db.collection('profile')
      const treatmentsCollection = db.collection('treatments')

      console.log('Collections:')
      console.log('devicestatus: %o', deviceCollection)
      console.log('entries: %o', entriesCollection)
      console.log('food: %o', foodCollection)
      console.log('profile: %o', profileCollection)
      console.log('treatments: %o', treatmentsCollection)

    })
  }
}