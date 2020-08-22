const { Command } = require('discord-akairo')
const moment = require('moment')
const AWS = require('aws-sdk')

const S3 = new AWS.S3({
  apiVersion: '2006-03-01',
})

module.exports = class extends Command {
  constructor() {
    super('listbackups', {
      aliases: ['listbackups', 'lbu'],
      ownerOnly: true
    })
  }

  async exec(message) {
    const params = {
      Bucket: process.env.AWS_S3_BUCKET,
    }

    S3.listObjectsV2(params, (err, data) => {
        if (err) {
          console.error(`Error: ${err}`)
      }

      let fieldItemContents = []
      data.Contents.forEach(item => {
        fieldItemContents.push(
          [
            {
              name: 'File Name',
              value: item.Key
            },
            {
              name: 'File Size',
              value: bytesToSize(item.Size, 2)
            },
            {
              name: 'Uploaded (Last Modified)',
              value: moment(item.LastModified).format('MMM DD YYYY @ hh:mm a Z')
            },
            {
              name: 'Download',
              value: `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${item.Key}`
            }
          ]
        )
      })

      fieldItemContents.forEach(async (fieldItem) => {
        await message.channel.send({
          embed: {
            title: 'S3 Bucket Item',
            fields: fieldItem
          }
        })
      })
    })
  }
}

function bytesToSize(bytes, decimals = 2) {
  if (bytes === 0) return '0 Byte'

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

  const i = parseInt(Math.floor(Math.log(bytes) / Math.log(k)))

  return Math.round(bytes / Math.pow(k, i)).toFixed(dm) + ' ' + sizes[i]
}