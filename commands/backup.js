const { Command } = require('discord-akairo')
const { spawn } = require('child_process')
const moment = require('moment')
const fs = require('fs')
const os = require('os')
const path = require('path')
const mkdirp = require('mkdirp')
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

    if (!fs.existsSync(`${backupDir}/${dbBackupDir}`)) {
      // Check if writing directory for Windows machine or UNIX/Linux machine
      if (!(os.platform() === 'win32')) {
        let channelTxt = await message.channel.send(`Backup directory does not currently exist. Creating backup directory to write to...`)
        let oldmask = process.umask(0)

        mkdirp(`${backupDir}/${dbBackupDir}`, 0o775, (err) => {
          if (err) {
            message.channel.send(`There was a problem creating the backup directory. Check the console log for what the error was.`)
            console.error(`Error: ${err.message}`)
          } else {
            process.umask(oldmask)
            message.channel.send(`Backup directory was created successfully`)
          }
        })

        backupProcess(backupDir, dbBackupDir, message)
      } else {
        let channelTxt = await message.channel.send(`Backup directory does not currently exist. Creating backup directory to write to...`)

        mkdirp(`${backupDir}/${dbBackupDir}`, (err) => {
          if (err) {
            message.channel.send(`There was a problem creating the backup directory. Check the console log for what the error was.`)
            console.error(`Error: ${err.message}`)
          } else {
            message.channel.send(`Backup directory was created successfully`)
          }
        })

        backupProcess(backupDir, dbBackupDir, message)
      }
    } else {
      console.log('Folder exists')
      backupProcess(backupDir, dbBackupDir, message)
    }
  }
}

function backupProcess(backupDir, dbBackupDir, message) {
  // Run command to do mongo db backup from mlab
  const mbup = spawn('mongodump', [`-h ${process.env.MONGO_HOST}:${process.env.MONGO_PORT}`, `-d ${process.env.MONGO_DB}`, `-u ${process.env.MONGO_USERNAME}`, `-p ${process.env.MONGO_PASSWORD}`, `-o ${backupDir}/${dbBackupDir}`], {
    windowsVerbatimArguments: true
  })

  mbup.stderr.on('data', (data) => {
    message.channel.send(`Running database backup from mLab...`)
  })

  mbup.on('close', (code) => {
    console.log(`Mongodump exited with code ${code}`)
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
  })
}