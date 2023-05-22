"use strict";
const { SlashCommandBuilder } = require("discord.js");
const path = require("path");
const fs = require("fs");
const creatures = require("../constants/creatures");
const relics = require("../constants/relics");
const stages = require("../constants/stages");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("viewgameinfo")
    .setDescription(
      "Displays player's game info (such as experience level or total drachmas)"
    ),

  async execute(interaction) {
    const gamesPath = path.relative(process.cwd(), "docs/games.txt");

    fs.readFile(gamesPath, "utf8", (err, data) => {
      try {
        if (err) {
          console.log(err);
          interaction
            .reply({
              content: "Something went wrong.",
              ephemeral: true,
            })
            .catch((err) => console.error(err));
          return;
        }

        const userId = interaction.member.user.id;
        const re = new RegExp("^.*" + userId + ".*$", "gm");
        let gameInfo;

        if (!re.test(data)) {
          interaction
            .reply({
              content: "You must join the game first.",
              ephemeral: true,
            })
            .catch((err) => console.error(err));
          return;
        }

        gameInfo = data.match(re)[0].split(",");
        interaction
          .reply({
            content: `Level: ${(
              Math.sqrt(parseInt(gameInfo[1])) * 0.25
            ).toFixed(2)} | ${gameInfo[1]} XP\nDrachmas: ${gameInfo[2]}
          \nSummon: ${creatures[gameInfo[3]].name}\nChosen relic: ${
              relics[gameInfo[4]].name
            }\nSummon HP: ${gameInfo[5]}\nSummon MP: ${gameInfo[6]}
          \nStage: ${stages[gameInfo[7]].name}\nEnemy creature: ${
              stages[gameInfo[7]].enemyCreatures[gameInfo[8]].name
            }\nEnemy creature HP: ${gameInfo[9]}`,
            ephemeral: true,
          })
          .catch((err) => console.error(err));
      } catch (err) {
        console.log(err);
        interaction
          .reply({
            content: "Something went wrong.",
            ephemeral: true,
          })
          .catch((err) => console.error(err));
      }
    });
  },
};
