"use strict";
require("dotenv").config();
const { Client, Collection, Events, GatewayIntentBits } = require("discord.js");
const path = require("node:path");
const fs = require("node:fs");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});
const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs
  .readdirSync(commandsPath)
  .filter((file) => file.endsWith(".js"));
let filePath;
let command;

// initialize client commands as new collection
client.commands = new Collection();

// listen to the event that signals bot is ready to start working
client.on("ready", () => console.log(`logged in as ${client.user.tag}`));

// command handling
for (const file of commandFiles) {
  filePath = path.join(commandsPath, file);
  command = require(filePath);

  if ("data" in command && "execute" in command) {
    client.commands.set(command.data.name, command);
  } else {
    console.log(
      `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`
    );
  }
}

// event handling
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand() && !interaction.isButton()) return;

  if (interaction.isChatInputCommand())
    command = interaction.client.commands.get(interaction.commandName);

  if (interaction.isButton())
    command = interaction.client.commands.get("useskill");

  if (!command) {
    console.error(`No command matching ${interaction.commandName} was found.`);
    return;
  }

  try {
    await command.execute(interaction);
  } catch (err) {
    console.error(err);

    if (interaction.replied || interaction.deferred) {
      await interaction
        .followUp({
          content: "There was an error while executing this command!",
          ephemeral: true,
        })
        .catch((err) => console.error(err));
    } else {
      await interaction
        .reply({
          content: "There was an error while executing this command!",
          ephemeral: true,
        })
        .catch((err) => console.error(err));
    }
  }
});

// login to the server using bot token
client.login(process.env.TOKEN);
