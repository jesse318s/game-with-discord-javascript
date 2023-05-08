const { SlashCommandBuilder } = require("discord.js");
const path = require("path");
const fs = require("fs");
const creatures = require("../constants/creatures");
const relics = require("../constants/relics");

// verfies if user has joined the game
const verifyGameData = (gamesPath, re) => {
  return new Promise((resolve, reject) => {
    try {
      fs.readFile(gamesPath, "utf8", (err, data) => {
        if (err) reject(err);

        if (re.test(data)) resolve(true);

        resolve(false);
      });
    } catch (err) {
      reject(err);
    }
  });
};

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

      re = new RegExp("^.*" + userId + ".*$", "gm");

      if (await verifyGameData(gamesPath, re)) {
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
        "," +
        0 +
        "\r\n";

      fs.appendFile(gamesPath, newLine, "utf8", (err) => {
        if (err) return console.error(err);

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
