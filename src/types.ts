import { type CommandInteraction, type SlashCommandBuilder } from 'discord.js';

export interface SlashCommandConfig {
  data: SlashCommandBuilder
  execute: (interaction: CommandInteraction) => void | Promise<void>
}
