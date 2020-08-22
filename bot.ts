import * as dotenv from 'dotenv-flow';

import { AkairoClient } from 'discord-akairo'
import * as moment from 'moment'
import * as schedule from 'node-schedule'

const { spawn } = require('child_process')

const fs = require('fs')
const os = require('os')
const path = require('path')
const mkdirp = require('mkdirp')
const AWS = require('aws-sdk')
const S3 = new AWS.S3()

dotenv.config();

const client = new AkairoClient({
  ownerID: process.env.BOT_OWNER_ID,
  prefix: process.env.BOT_PREFIX,
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

client.login(process.env.BOT_TOKEN).then(() => {
  console.log(`Logged in as ${client.user.tag}`)
  const dexChan = client.channels.get('470100327840874496')

  const job = schedule.scheduleJob('59 23 * * *', () => {
    backupProcess(dexChan)
  })
})

function backupProcess(channel) {
  let tstamp = moment().format("YYYYMMDD")

  // Base backup directory
  let backupDir = '../mongodb-backups'
  let dbBackupDir = `${process.env.MONGO_DB}_${tstamp}`

  if (!fs.existsSync(`${backupDir}/${dbBackupDir}`)) {
    // Check if writing directory for Windows machine or UNIX/Linux machine
    if (!(os.platform() === 'win32')) {
      console.log(`Backup directory does not currently exist. Creating backup directory to write to...`)
      let oldmask = process.umask(0)

      mkdirp(`${backupDir}/${dbBackupDir}`, 0o775, (err) => {
        if (err) {
          console.error(`There was a problem creating the backup directory. Check the console log for what the error was.`)
          console.error(`Error: ${err.message}`)
        } else {
          process.umask(oldmask)
          console.log(`Backup directory was created successfully`)
        }
      })
    } else {
      console.log(`Backup directory does not currently exist. Creating backup directory to write to...`)
      mkdirp(`${backupDir}/${dbBackupDir}`, (err) => {
        if (err) {
          console.error(`There was a problem creating the backup directory. Check the console log for what the error was.`)
          console.error(`Error: ${err.message}`)
        } else {
          console.log(`Backup directory was created successfully`)
        }
      })
    }
  }

  // Run command to do mongo db backup from mlab
  const mbup = spawn('mongodump', [`-h ${process.env.MONGO_HOST}:${process.env.MONGO_PORT}`, `-d ${process.env.MONGO_DB}`, `-u ${process.env.MONGO_USERNAME}`, `-p ${process.env.MONGO_PASSWORD}`, `-o ${backupDir}/${dbBackupDir}`], { windowsVerbatimArguments: true })

  channel.send(`Running database backup from mLab...`)
  mbup.stderr.on('data', async (data) => {
    await console.log(`${data}`)
  })

  mbup.on('close', (code) => {
    console.log(`Mongodump exited with code ${code}`)
    channel.send(`Database backup completed.`)

    const compress = spawn('7z', ['a', '-t7z', `${backupDir}/${dbBackupDir}.7z`, `${backupDir}/${dbBackupDir}/*`, '-r', '-bd', '-y', '-sdel'])

    compress.stderr.on('data', (data) => {
      console.error(`stderr: ${data}`)
    })

    compress.on('close', (code) => {
      console.log(`7zip compression complete with code ${code}`)
      channel.send(`Database compressed to ${backupDir}/${dbBackupDir}.7z`)

      fs.rmdir(`${backupDir}/${dbBackupDir}`, (err) => {
        if (err) {
          channel.send(`An error occurred when trying to remove ${backupDir}/${dbBackupDir}`)
        }
      })

      // Call S3 to retrieve upload file to specified bucket
      let uploadParams = { Bucket: process.env.AWS_S3_BUCKET, Key: '', Body: '', ACL: 'public-read' }
      let file = `${backupDir}/${dbBackupDir}.7z`

      let fileStream = fs.createReadStream(file)
      fileStream.on('error', (err) => {
        console.error(`File Error: ${err}`)
      })

      uploadParams.Body = fileStream
      uploadParams.Key = path.basename(file)

      // Call S3 to retrieve upload file to specified bucket
      S3.upload(uploadParams, (err, data) => {
        if (err) {
          console.error(`Error: ${err}`)
        }

        if (data) {
          console.log(`Upload success - ${data.Location}`)
          channel.send(`Database backup uploaded to Amazon S3 ${data.Location}`)

          // Delete the 7z file after upload
          fs.unlink(`${file}`, (err) => {
            if (err) {
              console.error(`Error deleting file: ${err}`)
            }

            console.log(`${file} was deleted successfully.`)
          })
        }
      })
    })
  })
}