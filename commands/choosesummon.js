"use strict";
const path = require("path");
const { SlashCommandBuilder } = require("discord.js");
const fs = require("fs");
const creatures = require("../constants/creatures");
const stages = require("../constants/stages");

const choices = creatures.map((creature) => ({
  name: creature.name,
  value: creature.id - 1,
}));
const gamesPath = path.relative(process.cwd(), "data/games.txt");

const writeSummonData = (data, re, gameInfo, interaction) => {
  const formatted = data.replace(re, gameInfo.join(","));

  fs.writeFile(gamesPath, formatted, "utf8", (err) => {
    try {
      if (err) {
        console.log(err);
        interaction
          .reply({
            content: "Something went wrong with your transaction.",
            ephemeral: true,
          })
          .catch((err) => console.error(err));
        return;
      }

      interaction
        .reply({
          content:
            "You have chosen the " +
            creatures[gameInfo[3]].name +
            " as your summon.",
          ephemeral: true,
        })
        .catch((err) => console.error(err));
    } catch (err) {
      console.error(err);
      interaction
        .reply({
          content: "Something went wrong with your transaction.",
          ephemeral: true,
        })
        .catch((err) => console.error(err));
    }
  });
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName("choosesummon")
    .setDescription("Chooses the player's summon (this costs drachmas)")
    .setDMPermission(false)
    .addIntegerOption((option) =>
      option
        .setName("name")
        .setDescription("The name of the player's new summon")
        .setRequired(true)
        .addChoices(...choices)
    ),

  async execute(interaction) {
    const userId = interaction.member.user.id;
    const re = new RegExp("^.*" + userId + ".*$", "gm");
    const summonIndex = interaction.options.getInteger("name");
    let gameInfo;

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

        if (parseInt(gameInfo[1]) - creatures[summonIndex].price < 0) {
          interaction
            .reply({
              content: "You can't afford this summon.",
              ephemeral: true,
            })
            .catch((err) => console.error(err));
          return;
        }

        if (parseInt(gameInfo[3]) !== summonIndex) {
          gameInfo[1] = parseInt(gameInfo[1]) - creatures[summonIndex].price;
          gameInfo[3] = summonIndex;
          gameInfo[5] = 0;
          gameInfo[6] = 0;
        }

        if (
          gameInfo[7] &&
          stages[gameInfo[7]].levelReq >
            Math.floor(Math.sqrt(parseInt(gameInfo[1])) * 0.25)
        )
          gameInfo[7] = 0;

        writeSummonData(data, re, gameInfo, interaction);
      } catch (err) {
        console.error(err);
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
