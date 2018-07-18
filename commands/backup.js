const {
  Command
} = require('discord-akairo')
const {
  spawn
} = require('child_process')
const moment = require('moment')
const fs = require('fs')
const os = require('os')
const path = require('path')
const mkdirp = require('mkdirp')

const config = require('../config/config.json')

module.exports = class extends Command {
  constructor() {
    super('backup', {
      aliases: ['backup', 'bu'],
      ownerOnly: true
    })
  }

  async exec(message) {
    let tstamp = moment().format("YYYYMMDD")

    // Base backup directory
    let backupDir = '../mongodb-backups'
    let dbBackupDir = config.mongo.database + "_" + tstamp

    if (!fs.existsSync(backupDir + '/' + dbBackupDir)) {
      // Check if writing directory for Windows machine or UNIX/Linux machine
      if (!(os.platform() === 'win32')) {
        let channelTxt = await message.channel.send(`Backup directory does not currently exist. Creating backup directory to write to...`)

        let oldmask = process.umask(0)

        mkdirp(backupDir + '/' + dbBackupDir, 0o775, (err) => {
          if (err) {
            message.channel.send(`There was a problem creating the backup directory. Check the console log for what the error was.`)
            console.error(`Error: ${err.message}`)
          } else {
            process.umask(oldmask)
            message.channel.send(`Backup directory was created successfully`)
          }
        })

        // Run command to do mongo db backup from mlab
        const mbup = spawn('mongodump', [`-h ${config.mongo.host}:${config.mongo.port}`, `-d ${config.mongo.database}`, `-u ${config.mongo.user}`, `-p ${config.mongo.password}`, `-o ${backupDir}/${dbBackupDir}`])

        console.log('mbup: ', mbup)

        // fs.mkdir(backupDir, 0o775, (err) => {
        //   if (err) {
        //     message.channel.send(`There was a problem creating the backup directory. Check the console log for what the error was.`)
        //     console.error(`Error: ${err.message}`)
        //   }

        //   process.umask(oldmask)
        //   message.channel.send(`Backup directory was created successfully`)
        // })
      } else {
        let channelTxt = await message.channel.send(`Backup directory does not currently exist. Creating backup directory to write to...`)

        mkdirp(backupDir + '/' + dbBackupDir, (err) => {
          if (err) {
            message.channel.send(`There was a problem creating the backup directory. Check the console log for what the error was.`)
            console.error(`Error: ${err.message}`)
          } else {
            message.channel.send(`Backup directory was created successfully`)
          }
        })

        // Run command to do mongo db backup from mlab
        // message.channel.send(`Running database backup from mLab...`)
        const mbup = spawn('mongodump', [`-h ${config.mongo.host}:${config.mongo.port}`, `-d ${config.mongo.database}`, `-u ${config.mongo.username}`, `-p ${config.mongo.password}`, `-o ${backupDir}/${dbBackupDir}`])
        console.log('mbup: ', mbup)
      }
    } else {
      console.log('Folder exists')
    }
  }
}