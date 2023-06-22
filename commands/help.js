"use strict";
const { SlashCommandBuilder } = require("discord.js");
const fs = require("fs");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription("Lists available commands")
    .setDMPermission(false),

  async execute(interaction) {
    const commandFiles = fs
      .readdirSync("./commands")
      .filter((file) => file.endsWith(".js"));
    let str = "";

    for (const file of commandFiles) {
      const command = require(`./${file}`);

      str += `\u2022 **Command:** ${command.data.name}, **Description:** ${command.data.description}\n`;
    }

    interaction
      .reply({
        content: str,
        ephemeral: true,
      })
      .catch((err) => console.error(err));
  },
};
