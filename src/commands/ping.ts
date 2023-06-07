import { type CommandInteraction, SlashCommandBuilder, Colors, EmbedBuilder } from 'discord.js';
import {
  BYTES_IN_KIB, HOURS_IN_ONE_DAY,
  MINUTES_IN_ONE_HOUR, MS_IN_ONE_DAY,
  MS_IN_ONE_HOUR, MS_IN_ONE_MINUTE,
  MS_IN_ONE_SECOND,
  SECONDS_IN_ONE_MINUTE
} from '../constants';
import { stripIndents } from 'common-tags';
import { SlashCommand } from '../classes';

const pingCommand = new SlashCommand({
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Display Discord latency information for the bot'),
  async execute (interaction: CommandInteraction) {
    const { client } = interaction;

    // Calculating our API latency
    const latency = Math.round(client.ws.ping);
    const sent = await interaction.reply({
      content: 'Pinging...',
      fetchReply: true
    });
    const fcLatency = sent.createdTimestamp - interaction.createdTimestamp;

    // Utility function for getting appropriate status emojis
    const getMsEmoji = (ms: number): string => {
      let emoji;

      for (const [key, value] of Object.entries({
        250: '🟢',
        500: '🟡',
        1000: '🟠'
      })) {
        if (ms <= Number(key)) {
          emoji = value;
          break;
        }
      }
      return (emoji ??= '🔴');
    };

    // Memory Variables
    const memoryUsage = process.memoryUsage();
    const memoryUsedInMB = memoryUsage.heapUsed / BYTES_IN_KIB / BYTES_IN_KIB;
    const memoryAvailableInMB = memoryUsage.heapTotal /
      BYTES_IN_KIB / BYTES_IN_KIB;
    const objCacheSizeInMB = memoryUsage.external / BYTES_IN_KIB / BYTES_IN_KIB;

    // Time variables
    const daysOnline = Math.floor(client.uptime / MS_IN_ONE_DAY);
    const hoursOnline = parseInt(String((client.uptime / MS_IN_ONE_HOUR) % HOURS_IN_ONE_DAY), 10);
    const minutesOnline = parseInt(String((client.uptime / MS_IN_ONE_MINUTE) % MINUTES_IN_ONE_HOUR), 10);
    const secondsOnline = parseInt(String((client.uptime / MS_IN_ONE_SECOND) % SECONDS_IN_ONE_MINUTE), 10);
    const msOnline = parseInt(String((client.uptime % MS_IN_ONE_SECOND)), 10);

    // Replying to the interaction with our embed data
    void interaction.editReply({
      content: '\u200b',
      embeds: [
        new EmbedBuilder()
          .setColor(Colors.Aqua)
          .setAuthor({
            name: `${client.user.tag}`,
            iconURL: client.user.displayAvatarURL()
          })
          .addFields([
            {
              name: 'Latency',
              value: stripIndents`
                ${getMsEmoji(latency)} **API Latency:** ${latency} ms
                ${getMsEmoji(fcLatency)} **Full Circle Latency:** ${fcLatency} ms
              `,
              inline: true
            },
            {
              name: 'Memory',
              value: stripIndents`
                💾 **Memory Usage:** ${memoryUsedInMB.toFixed(2)}/${memoryAvailableInMB.toFixed(2)} MB 
                ♻️ **Cache Size:** ${objCacheSizeInMB.toFixed(2)} MB
              `,
              inline: true
            },
            {
              name: 'Uptime',
              value: stripIndents`**📊 I've been online for ${daysOnline} days, ${hoursOnline} hours, ${minutesOnline} minutes and ${secondsOnline}.${String(msOnline).charAt(1)} seconds!**`,
              inline: false
            }
          ])
          .setFooter({
            text: 'Made with ❤️ by Mirasaki#0001 • Open to collaborate • me@mirasaki.dev'
          })
      ]
    });
  }
});

export default pingCommand;
