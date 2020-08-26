const { Command } = require('discord-akairo')
const MongoClient = require('mongodb').MongoClient
const filesize = require('filesize')

module.exports = class extends Command {
  constructor() {
    super('stats', {
      aliases: ['stats', 'dbstats', 'ds'],
      ownerOnly: true
    })
  }

  async exec(message) {
    const uri = `mongodb+srv://${process.env.MONGO_USERNAME}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_HOST}/${process.env.MONGO_DB}?retryWrites=true&w=majority`

    MongoClient.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    }, (err, client) => {
      if (err) {
        console.error(`There was an error: ${err}`)
      }

      const db = client.db(`${process.env.MONGO_DB}`)

      db.command({ 'dbStats': 1 }, (err, res) => {
        if (err) {
          console.error(`There was an error: ${err}`)
        } else {
          let tSize = filesize(res.storageSize + res.indexSize, { output: 'object' })

          if (tSize.value >= 400) {
            return message.channel.send({
              embed: {
                title: `Database: ${res.db}`,
                description: `Current statistics for this database`,
                fields: [
                  {
                    name: 'Collections',
                    value: `${res.collections}`
                  },
                  {
                    name: 'Data Size',
                    value: `${filesize(res.dataSize)}`
                  },
                  {
                    name: 'Storage Size',
                    value: `${filesize(res.storageSize)}`
                  },
                  {
                    name: 'Index Size',
                    value: `${filesize(res.indexSize)}`
                  },
                  {
                    name: 'Aggregate Size (Storage + Index)',
                    value: `${filesize(res.storageSize + res.indexSize)}`
                  },
                  {
                    name: 'Indexes',
                    value: `${res.indexes}`
                  },
                  {
                    name: 'File Size (Pre-allocated)',
                    value: `${filesize(res.fileSize)}`
                  },
                  {
                    name: 'Recommendation',
                    value: 'Your database is close to being full. Backup the database and clear some old entries out to shrink the size.'
                  }
                ]
              }
            })
          } else {
            return message.channel.send({
              embed: {
                title: `Database: ${res.db}`,
                description: `Current statistics for this database`,
                fields: [
                  {
                    name: 'Collections',
                    value: `${res.collections}`
                  },
                  {
                    name: 'Data Size',
                    value: `${filesize(res.dataSize)}`
                  },
                  {
                    name: 'Storage Size',
                    value: `${filesize(res.storageSize)}`
                  },
                  {
                    name: 'Index Size',
                    value: `${filesize(res.indexSize)}`
                  },
                  {
                    name: 'Aggregate Size (Storage + Index)',
                    value: `${filesize(res.storageSize + res.indexSize)}`
                  },
                  {
                    name: 'Indexes',
                    value: `${res.indexes}`
                  },
                  {
                    name: 'File Size (Pre-allocated)',
                    value: `${filesize(res.fileSize)}`
                  }
                ]
              }
            })
          }
        }
      })

      client.close()
    })
  }
}