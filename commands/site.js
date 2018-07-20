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
          if (data.indexOf('Process successfully started') >= 0) {
            message.channel.send('PM2 successfully started your site.')
          }
        })

        pm2.stderr.on('data', (data) => {
          console.error(`stderr: ${data}`)
        })
        break

      case 'stop':
        pm2.stdout.on('data', (data) => {
          console.log(`stdout: ${data}`)
          if (data.indexOf('stopped') >= 0) {
            message.channel.send('PM2 successfully stopped your site.')
          }
        })

        pm2.stderr.on('data', (data) => {
          console.error(`stderr: ${data}`)
        })
        break
    }
  }
}