const { Command } = require('discord-akairo')
const { spawn } = require('child_process')

const config = require('../config/config.json')

module.exports = class extends Command {
  constructor() {
    super('backup', {
      aliases: ['backup', 'bu'],
      ownerOnly: true
    })
  }

  async exec(message) {
    console.log('Now: ', Date.now())
  }
}