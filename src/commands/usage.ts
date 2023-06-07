import { Colors, SlashCommandBuilder } from 'discord.js';
import { SlashCommand } from '../classes';
import si from 'systeminformation';
import { stripIndents } from 'common-tags';
import { getRuntime, humanReadableBytes } from '../util';
import { exec } from 'child_process';
import { MS_IN_ONE_MINUTE } from '../constants';

// CREDIT: https://github.com/chalk/ansi-regex/blob/main/index.js#L3
const ansiRegex = new RegExp(
  [
    '[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)',
    '(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-nq-uy=><~]))',
    '[ \u200b]' // Also remove whitespace
  ].join('|'),
  'g'
);

const latestSpeedTestResult = {
  loaded: false,
  speedTestServerLocation: 'n/a',
  clientIp: 'n/a',
  latency: '0ms',
  jitter: '0ms',
  downloadSpeed: '0Mbps',
  uploadSpeed: '0Mbps'
};

const doSpeedTest = async (): Promise<void> => {
  exec('npx speed-cf', (error, stdout) => {
    if (error !== null) {
      console.error('Error encounter while performing CloudFlare Speed Test:');
      console.error(error.message);
      return;
    }
    if (stdout !== '') {
      const [
        serverLocation,
        yourIp,
        latency,
        jitter,
        ,,,,,
        downloadSpeed,
        uploadSpeed
      ] = stdout.replace(ansiRegex, '').split('\n');

      // Update speed test reference
      latestSpeedTestResult.loaded = true;
      latestSpeedTestResult.speedTestServerLocation = serverLocation?.split(':')[1] ?? 'n/a';
      latestSpeedTestResult.clientIp = yourIp?.split(':')[1] ?? 'n/a';
      latestSpeedTestResult.latency = latency?.split(':')[1] ?? '0ms';
      latestSpeedTestResult.jitter = jitter?.split(':')[1] ?? '0ms';
      latestSpeedTestResult.downloadSpeed = downloadSpeed?.split(':')[1] ?? '0Mbps';
      latestSpeedTestResult.uploadSpeed = uploadSpeed?.split(':')[1] ?? '0Mbps';
    }
  });
};

// Schedule update of speed-test results
doSpeedTest()
  .then(() => {
    setInterval(() => {
      console.info('Performing internet speed-test...');
      doSpeedTest()
        .catch((err) => {
          console.error('Error encountered while performing internet speed-test:');
          console.error(err);
        });
    }, MS_IN_ONE_MINUTE * 5);
  })
  .catch((err) => {
    console.error('Error encountered while initializing internet speed-test schedule:');
    console.error(err);
  });

const specsCommand = new SlashCommand({
  data: new SlashCommandBuilder()
    .setName('usage')
    .setDescription('Display current machine usage statistics'),
  execute: async (interaction) => {
    // Initialize runtime timer
    const runtimeStart = process.hrtime.bigint();

    // Resolve from specs(cache)
    const [
      , // Defer our reply
      cpuLoad,
      mem
    ] = await Promise.all([
      await interaction.deferReply(),
      await si.currentLoad(),
      await si.mem()
    ]);

    // Debug logging
    // if (process.env['NODE_ENV'] !== 'production') {
    //   console.dir({
    //     cpuLoad,
    //     mem
    //   }, { depth: Infinity });
    // }

    // Resolve fields
    // const separatorField = {
    //   name: '\u200b',
    //   value: '\u200b',
    //   inline: false
    // };
    const cpuField = {
      name: 'CPU Information',
      value: stripIndents`
        **Average Load**: ${cpuLoad.avgLoad.toFixed(2)}%
        **Current Load**: ${cpuLoad.currentLoad.toFixed(2)}%
        **Current Load User**: ${cpuLoad.currentLoadUser.toFixed(2)}%
        **Average Load System**: ${cpuLoad.currentLoadSystem.toFixed(2)}%
      `,
      inline: true
    };
    const memoryField = {
      name: 'Memory',
      value: stripIndents`
        **• Total:** ${humanReadableBytes(mem.total)}
        **• Used:** ${humanReadableBytes(mem.free)}
        **• Free:** ${humanReadableBytes(mem.free)}
        **• Cache:** ${humanReadableBytes(mem.cached)}
        **• Swap:** ${humanReadableBytes(mem.swapused)} / ${humanReadableBytes(mem.swaptotal)}
      `,
      inline: true
    };
    const internetUsageField = {
      name: 'Network Speed',
      value: latestSpeedTestResult.loaded
        ? stripIndents`
          **Server Location:** ${latestSpeedTestResult.speedTestServerLocation}
          **Machine Location:** ${latestSpeedTestResult.clientIp.slice(
    latestSpeedTestResult.clientIp.lastIndexOf('(') + 1,
    latestSpeedTestResult.clientIp.length - 1
  )}
          **Latency:** ${latestSpeedTestResult.latency}
          **Jitter:** ${latestSpeedTestResult.jitter}
          **Download Speed:** ${latestSpeedTestResult.downloadSpeed}
          **Upload Speed:** ${latestSpeedTestResult.uploadSpeed}
      `
        : 'Internet speed-testing hasn\'t been initialized yet, please be patient',
      inline: false
    };

    // Finally, display our specs
    void interaction.editReply({
      embeds: [
        {
          color: Colors.Aqua,
          title: 'System Usage',
          fields: [
            cpuField,
            memoryField,
            internetUsageField
          ],
          footer: { text: `Analyzed system usage statistics in: ${getRuntime(runtimeStart).ms} ms\nFor machine specifications, use the /specs command` }
        }
      ]
    });
  }
});

export default specsCommand;
