const { Command } = require('discord-akairo')

const moment = require('moment')

// File System
const { spawn } = require('child_process')
const fs = require('fs')
const os = require('os')
const path = require('path')
const mkdirp = require('mkdirp')

// Amazon S3
const AWS = require('aws-sdk')
const S3 = new AWS.S3({
  apiVersion: '2006-03-01',
})

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
    let dbBackupDir = `${process.env.MONGO_DB}_${tstamp}`

    backupProcess(backupDir, dbBackupDir, message)
    purgeMessages(message)
  }
}

function backupProcess(backupDir, dbBackupDir, message) {
  // Handle directory creations
  if (!fs.existsSync(`${backupDir}/${dbBackupDir}`)) {
    // Check if writing directory for Windows machine or UNIX/Linux machine
    if (!(os.platform() === 'win32')) {
      console.log(`Backup directory does not currently exist. Creating backup directory to write to...`)
      let oldmask = process.umask(0)

      mkdirp(`${backupDir}/${dbBackupDir}`, 0o775, (err) => {
        if (err) {
          console.error(`There was a problem creating the backup directory. ${err.message}`)
        } else {
          process.umask(oldmask)
          console.log(`Backup directory was created successfully`)
        }
      })
    } else {
      console.log(`Backup directory does not currently exist. Creating backup directory to write to...`)

      mkdirp(`${backupDir}/${dbBackupDir}`, (err) => {
        if (err) {
          console.error(`There was a problem creating the backup directory. ${err.message}`)
        } else {
          console.log(`Backup directory was created successfully`)
        }
      })
    }
  }

  // Run command to do mongo db backup from MongoDB Atlas
  const uri = `mongodb+srv://${process.env.MONGO_USERNAME}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_HOST}/${process.env.MONGO_DB}`
  const mbup = spawn('mongodump', [`--uri ${uri}`, `-o ${backupDir}/${dbBackupDir}`], {
    windowsVerbatimArguments: true
  })

  message.channel.send(`Running database backup from MongoDB Atlas...`)
  mbup.stderr.on('data', async (data) => {
    await console.log(`${data}`)
  })

  mbup.on('close', (code) => {
    console.log(`Mongodump exited with code ${code}`)

    if (code === 0) {
      message.channel.send(`Database backup completed.`)

      const compress = spawn('7z', ['a', '-t7z', `${backupDir}/${dbBackupDir}.7z`, `${backupDir}/${dbBackupDir}/*`, '-r', '-bd', '-y', '-sdel'])
      compress.stderr.on('data', (data) => {
        console.error(`stderr: ${data}`)
      })

      compress.on('close', (code) => {
        console.log(`7zip compression complete with code ${code}`)
        message.channel.send(`Database compressed to ${backupDir}/${dbBackupDir}.7z`)

        fs.rmdir(`${backupDir}/${dbBackupDir}`, (err) => {
          if (err) {
            message.channel.send(`An error occurred when trying to remove ${backupDir}/${dbBackupDir}`)
          }
        })

        // Call S3 to retrieve upload file to specified bucket
        let uploadParams = {
          Bucket: process.env.AWS_S3_BUCKET,
          Key: '',
          Body: '',
          ACL: 'public-read'
        }
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
            message.channel.send(`Database backup uploaded to Amazon S3 ${data.Location}`)

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
    } else {
      message.channel.send(`There was an issue performing the MongoDB Atlas backup`)
    }
  })
}

function purgeMessages(message) {
  // 8 days prior to today as Epoch time in ms (S3 holds 8 records at a time)
  const weekDate = +moment().subtract(8, 'days')

  message.channel.fetchMessages({
      limit: 100
    })
    .then(collected => {
      const botMessages = collected.filter(m => m.author.id === '468950084831412234')

      botMessages.forEach(msg => {
        if (msg.createdTimestamp < weekDate) {
          console.log(`Message: ${msg}`)
          msg.delete() // Delete the message
        }
      })
    })
    .catch(err => console.error(`An error has occured error: ${err}`))
}
