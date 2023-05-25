"use strict";
const { SlashCommandBuilder } = require("discord.js");
const fs = require("fs");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription("Lists all available commands"),

  async execute(interaction) {
    const commandFiles = fs
      .readdirSync("./commands")
      .filter((file) => file.endsWith(".js"));
    let command;
    let str = "";

    for (const file of commandFiles) {
      command = require(`./${file}`);
      str += `**Command:** ${command.data.name}, **Description:** ${command.data.description}\n`;
    }

    interaction
      .reply({
        content: str,
        ephemeral: true,
      })
      .catch((err) => console.error(err));
  },
};
