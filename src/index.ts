// Import modules
import 'dotenv/config';
import { Client, Events, GatewayIntentBits } from 'discord.js';
import { commands, loadCommands } from './commands';

// Initialize our client
export const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// Check mode Argv
const modeArg = process.argv.find((arg) => arg.startsWith('mode='));

/** Our application main entry point, initializes the
 * application and logs in to our client */
export const main = async (): Promise<void> => {
  // Load our commands!
  loadCommands();

  // Exit before initializing listeners in test mode
  if ((modeArg?.endsWith('test')) ?? false) process.exit(0);

  // Log in to Discord with your client's token
  await client
    .login(process.env['DISCORD_BOT_TOKEN'])
    .catch((err) => {
      console.error('Error encountered while logging in to provided Discord bot token:');
      console.error(err);
    });
};

// When the client is ready, run this code (only once)
// We use 'c' for the event parameter to keep it separate from the already defined 'client'
client.once(Events.ClientReady, (c) => {
  console.log(`Ready! Logged in as "${c.user.username}"`);
});

client.on(Events.InteractionCreate, async (interaction) => {
  // Make sure it's a slash command interaction
  if (!interaction.isChatInputCommand()) return;

  // Resolve the command
  const command = commands.get(interaction.commandName);
  if (command == null) {
    console.error(`No command matching ${interaction.commandName} was found.`);
    return;
  }

  // Try to execute the command
  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(`Error encountered while executing the /${command.data.name} command`);
    console.error(error);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
    } else {
      await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
    }
  }
});

// Always initializes on import,
// meaning command data will always be populated
void main();
