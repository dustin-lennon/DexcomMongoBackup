const { Command } = require('discord-akairo')
const MLab = require('mlab-data-api')
const filesize = require('filesize')

const config = require('../config/config.json')

module.exports = class extends Command {
  constructor() {
    super('stats', {
      aliases: ['stats', 'dbstats', 'ds'],
      ownerOnly: true
    })
  }

  async exec(message) {
    let mLab = MLab({
      key: config.mongo.apiKey,
      timeout: 10000
    })

    let options = {
      database: config.mongo.database,
      commands: {
        'dbStats': 1
      }
    }

    mLab.runCommand(options).then(res => {
      let tSize = filesize(res.data.storageSize + res.data.indexSize, { output: 'object' })

      if (tSize.value >= 400) {
        return message.channel.send({
          embed: {
            title: `Database: ${res.data.db}`,
            description: `Current statistics for this database`,
            fields: [
              {
                name: 'Collections',
                value: `${res.data.collections}`
              },
              {
                name: 'Data Size',
                value: `${filesize(res.data.dataSize)}`
              },
              {
                name: 'Storage Size',
                value: `${filesize(res.data.storageSize)}`
              },
              {
                name: 'Aggregate Size (Storage + Index)',
                value: `${filesize(res.data.storageSize + res.data.indexSize)}`
              },
              {
                name: 'Index Size',
                value: `${filesize(res.data.indexSize)}`
              },
              {
                name: 'Indexes',
                value: `${res.data.indexes}`
              },
              {
                name: 'File Size',
                value: `${filesize(res.data.fileSize)}`
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
            title: `Database: ${res.data.db}`,
            description: `Current statistics for this database`,
            fields: [
              {
                name: 'Collections',
                value: `${res.data.collections}`
              },
              {
                name: 'Data Size',
                value: `${filesize(res.data.dataSize)}`
              },
              {
                name: 'Storage Size',
                value: `${filesize(res.data.storageSize)}`
              },
              {
                name: 'Aggregate Size (Storage + Index)',
                value: `${filesize(res.data.storageSize + res.data.indexSize)}`
              },
              {
                name: 'Index Size',
                value: `${filesize(res.data.indexSize)}`
              },
              {
                name: 'Indexes',
                value: `${res.data.indexes}`
              },
              {
                name: 'File Size',
                value: `${filesize(res.data.fileSize)}`
              }
            ]
          }
        })
      }
    }).catch(err => {
      console.error('Error: ', err);
    });
  }
}