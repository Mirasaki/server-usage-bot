import { Colors, SlashCommandBuilder } from 'discord.js';
import { SlashCommand } from '../classes';
import si, { type Systeminformation } from 'systeminformation';
import { stripIndents } from 'common-tags';
import { getRuntime, humanReadableBytes } from '../util';

type SpecsCacheType = [
  Systeminformation.CpuData,
  Systeminformation.MemLayoutData[],
  Systeminformation.GraphicsData,
  Systeminformation.OsData,
  Systeminformation.DiskLayoutData[],
];
let specsCache: SpecsCacheType;
const specs = async (): Promise<SpecsCacheType> => {
  if (Array.isArray(specsCache) && specsCache.length >= 1) return specsCache;
  specsCache = await Promise.all([
    await si.cpu(),
    await si.memLayout(),
    await si.graphics(),
    await si.osInfo(),
    await si.diskLayout()
  ]);
  return specsCache;
};

const specsCommand = new SlashCommand({
  data: new SlashCommandBuilder()
    .setName('specs')
    .setDescription('Display machine specs'),
  execute: async (interaction) => {
    // Initialize runtime timer
    const runtimeStart = process.hrtime.bigint();

    // Defer our reply
    await interaction.deferReply();

    // Resolve from specs(cache)
    const [
      cpu,
      memLayout,
      graphics,
      os,
      disks
    ] = await specs();

    // Debug logging
    // if (process.env['NODE_ENV'] !== 'production') {
    //   console.dir({
    //     cpu,
    //     memLayout,
    //     graphics,
    //     os,
    //     disks
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
      **Manufacturer:** ${cpu.manufacturer}
      **Brand:** ${cpu.brand}
      **Speed:** ${cpu.speed} GHz
      **Cores:** ${cpu.cores}
      **Physical Cores:** ${cpu.physicalCores}
    `,
      inline: true
    };
    const memoryFields = memLayout.map((m, i) => ({
      name: `Memory Bank ${i + 1}`,
      value: stripIndents`
        **Type:** ${m.type !== '' ? m.type : 'Virtualized'}
        **Clock Speed:** ${m.clockSpeed}MHz
        **Size:** ${humanReadableBytes(m.size)}
      `,
      inline: true
    }));
    const osField = {
      name: 'Operating System',
      value: stripIndents`
        **Platform:** ${os.platform}
        **Architecture:** ${os.arch}
        **Kernel:** ${os.kernel}
    `,
      inline: true
    };
    const disksField = {
      name: 'Disks / Storage',
      value: disks
        .map((d, i) => `• **#${i + 1} ${d.name}** (${d.type} @ ${humanReadableBytes(d.size)})`)
        .join('\n'),
      inline: true
    };
    const gpuFields = graphics.controllers.map((c, i) => ({
      name: `GPU ${i + 1}`,
      value: stripIndents`
        **Vendor:** ${c.vendor}
        **Model:** ${c.model}
        **Bus:** ${c.bus}
        **VRam:** ${humanReadableBytes((c.vram ?? 1536) * 1000 * 1000)}
        **Dynamic VRam:** ${c.vramDynamic ? '✅' : '🚫'}
      `,
      inline: true
    }));

    // Finally, display our specs
    void interaction.editReply({
      embeds: [
        {
          color: Colors.Aqua,
          title: 'System Specification',
          fields: [
            cpuField,
            ...memoryFields,
            osField,
            disksField,
            ...gpuFields
          ],
          footer: { text: `Analyzed system specs in: ${getRuntime(runtimeStart).ms} ms` }
        }
      ]
    });
  }
});

export default specsCommand;
