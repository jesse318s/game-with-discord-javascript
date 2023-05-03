const { SlashCommandBuilder } = require("discord.js");
const path = require("path");
const fs = require("fs");
const creatures = require("../constants/creatures");
const relics = require("../constants/relics");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("join")
    .setDescription("Joins user to game"),

  async execute(interaction, client) {
    try {
      const gamesPath = path.relative(process.cwd(), "docs/games.txt");
      const userId = interaction.member.user.id;
      let re;
      let newLine;

      fs.readFile(gamesPath, "utf8", function (err, data) {
        re = new RegExp("^.*" + userId + ".*$", "gm");

        if (re.test(data)) {
          interaction.reply({
            content: "You've already joined the game.",
            ephemeral: true,
          });
          return;
        }

        newLine =
          userId +
          "," +
          0 +
          "," +
          Math.floor(Math.random() * creatures.length) +
          "," +
          Math.floor(Math.random() * relics.length) +
          "," +
          0 +
          "," +
          0 +
          "," +
          0 +
          "\r\n";

        if (err) return console.log(err);

        fs.appendFile(gamesPath, newLine, "utf8", function (err) {
          if (err) return console.log(err);
        });

        interaction.reply({
          content: "You joined the game!",
          ephemeral: true,
        });
      });
    } catch (err) {
      console.error(err);
    }
  },
};
