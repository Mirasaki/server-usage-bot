import { REST, Routes } from 'discord.js';
import 'dotenv/config';
import { commandAPIData, loadCommands } from '../src/commands';

// Validate .env data
if (typeof process.env['DISCORD_BOT_TOKEN'] !== 'string') {
  throw Error('No "DISCORD_BOT_TOKEN" found in .env file - please provide your discord bot token');
}
if (typeof process.env['CLIENT_ID'] !== 'string') {
  throw Error('No "CLIENT_ID" found in .env file - please provide your discord client id');
}

// Resolve current command data
loadCommands();
const commandData = commandAPIData();

// Construct and prepare an instance of the REST module
const rest = new REST().setToken(process.env['DISCORD_BOT_TOKEN']);

// Deploy our commands - don't export
void (async () => {
  const cmdInfoStr = `application (/) command${commandData.length !== 1 ? 's' : ''}`;
  try {
    // Notify start
    console.log(`Started refreshing ${commandData.length} ${cmdInfoStr}.`);

    // The put method is used to fully refresh all commands in the guild with the current set
    await rest.put(
      Routes.applicationCommands(process.env['CLIENT_ID'] as string),
      { body: commandData }
    );

    // Notify finish, success
    console.log(`Successfully reloaded ${commandData.length} ${cmdInfoStr}.`);
  } catch (error) {
    console.error(`Error encountered while registering ${cmdInfoStr}:`);
    console.error(error);
  }
})();
