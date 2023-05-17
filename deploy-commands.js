"use strict";
require("dotenv").config();
const path = require("node:path");
const fs = require("node:fs");
const { REST, Routes } = require("discord.js");

const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs
  .readdirSync(commandsPath)
  .filter((file) => file.endsWith(".js"));
let command;
const commands = [];
let data;
const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

// loop through commands directory and add data from each command file to commands array
for (const file of commandFiles) {
  command = require(`./commands/${file}`);
  commands.push(command.data.toJSON());
}

// use the discord rest api to update the application commands for bot
(async () => {
  try {
    console.log(
      `Started refreshing ${commands.length} application (/) commands.`
    );
    data = await rest.put(Routes.applicationCommands(process.env.CLIENTID), {
      body: commands,
    });
    console.log(
      `Successfully reloaded ${data.length} application (/) commands.`
    );
  } catch (err) {
    console.error(err);
  }
})();
