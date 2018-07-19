const { Command } = require('discord-akairo')
const { spawn } = require('child_process')

const config = require('../config/config.json')

module.exports = class extends Command {
  constructor() {
    super('purge', {
      aliases: ['purge', 'p'],
      ownerOnly: true
    })
  }

  async exec(message) {
    // mongo --host <host>:<port> -u <db_user> -p <db_password> <db_name>
    const mConnect = spawn('mongo', [`--host ${config.mongo.host}:${config.mongo.port}`, `-u ${config.mongo.username}`, `-p ${config.mongo.password}`, `${config.mongo.database}`], { shell: true })

    console.log('mConnect: ', mConnect)
    mConnect.stdin.on('data', (data) => {
      console.log(`Data stdin: ${data}`)
    })

    mConnect.stderr.on('data', (data) => {
      console.log(`Data stderr: ${data}`)
    })
  }
}