const { SlashCommandBuilder } = require("discord.js");
const path = require("path");
const fs = require("fs");
const creatures = require("../constants/creatures");
const relics = require("../constants/relics");
const enemyCreatures = require("../constants/enemyCreatures");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("viewgameinfo")
    .setDescription("Attacks enemy or performs special"),

  async execute(interaction, client) {
    const gamesPath = path.relative(process.cwd(), "docs/games.txt");

    fs.readFile(gamesPath, "utf8", (err, data) => {
      try {
        if (err) {
          console.log(err);
          interaction.reply({
            content: "Something went wrong.",
            ephemeral: true,
          });
          return;
        }

        const userId = interaction.member.user.id;
        const re = new RegExp("^.*" + userId + ".*$", "gm");
        let gameInfo;

        if (!re.test(data)) {
          interaction.reply({
            content: "You must join the game first.",
            ephemeral: true,
          });
          return;
        }

        gameInfo = data.match(re)[0].split(",");
        interaction.reply({
          content: `Drachmas: ${gameInfo[1]}\nSummon: ${
            creatures[gameInfo[2]].name
          }\nChosen relic: ${relics[gameInfo[3]].name}\nSummon HP: ${
            gameInfo[4]
          }\nSummon MP: ${gameInfo[5]}\nEnemy creature: ${
            enemyCreatures[gameInfo[6]].name
          }\nEnemy creature HP: ${gameInfo[7]}`,
          ephemeral: true,
        });
      } catch (err) {
        console.log(err);
        interaction.reply({
          content: "Something went wrong.",
          ephemeral: true,
        });
      }
    });
  },
};
