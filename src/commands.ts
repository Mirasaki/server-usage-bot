import path from 'node:path';
import { type RESTPostAPIChatInputApplicationCommandsJSONBody, Collection } from 'discord.js';
import { getFiles } from './util';
import { SlashCommand } from './classes';

// Define command-path declarations
export const commands = new Collection<string, SlashCommand>();
export const commandsPath = path.join(__dirname, '/commands');
export const commandFiles = getFiles(commandsPath);

/** Register/load all our commands */
export const loadCommands = (): Collection<string, SlashCommand> => {
  // Loop over every file path, initializing the command,
  // calling the constructor, and saving it in out collection
  for (const cmdPath of commandFiles) {
    // There is no way to say for sure the type of this
    // assignment will be Promise<ChatInputCommand>, hence,
    // We have to do some strong type/instance checking before continuing
    // We can't dynamically import .ts files using (await import)
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    let command: unknown = require(cmdPath);

    // Resolve default exports
    if (
      typeof command === 'object' &&
      command !== null &&
      'default' in command &&
      command.default instanceof SlashCommand
    ) command = command.default;

    // Check :any type instance - runtime type assertion
    if (!(command instanceof SlashCommand)) {
      throw new TypeError(`Expected an instance of SlashCommand to be exported\n    at ${cmdPath}`);
    }

    if ('data' in command && 'execute' in command) {
      commands.set(command.data.name, command);
      console.info(`Loaded slash command ${command.data.name}`);
    } else console.warn(`[WARNING] The command at ${cmdPath} is missing a required "data" or "execute" property.`);
  }

  // Always return commands collection
  return commands;
};

/** Resolve current command API data */
export const commandAPIData =
  (): RESTPostAPIChatInputApplicationCommandsJSONBody[] =>
    commands.map((e) => e.data.toJSON());
