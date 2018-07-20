const {
  Command
} = require('discord-akairo')
const {
  spawn
} = require('child_process')

module.exports = class extends Command {
  constructor() {
    super('site', {
      aliases: ['site', 's'],
      args: [{
        id: 'startStop',
        type: ['start', 'stop'],
        prompt: {
          start: 'Are you needing to start or stop pm2? (start, stop)',
          retry: 'Valid options are (start, stop)'
        }
      }],
      ownerOnly: true
    })
  }

  async exec(message, args) {
    const pm2 = spawn('pm2', [`${args.startStop}`, 'Dexcom'])


    switch (args.startStop) {
      case 'start':
        pm2.stdout.on('data', (data) => {
          console.log('Data: ', data)
        })

        pm2.stderr.on('data', (data) => {
          console.error('Data: ', data)
        })
        break

      case 'stop':

        break
    }
  }
}