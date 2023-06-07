import { type CommandInteraction, type SlashCommandBuilder } from 'discord.js';
import { type SlashCommandConfig } from './types';

export class SlashCommand {
  data: SlashCommandBuilder;
  execute: (interaction: CommandInteraction) => void | Promise<void>;
  constructor (config: SlashCommandConfig) {
    this.data = config.data;
    this.execute = config.execute;
  }
}
