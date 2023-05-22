"use strict";
const { SlashCommandBuilder } = require("discord.js");
const path = require("path");
const fs = require("fs");
const relics = require("../constants/relics");

const choices = relics.map((relic) => ({
  name: relic.name,
  value: relic.id - 1,
}));

module.exports = {
  data: new SlashCommandBuilder()
    .setName("chooserelic")
    .setDescription("Chooses the player's relic (this costs drachmas)")
    .addIntegerOption((option) =>
      option
        .setName("name")
        .setDescription("The name of the player's new relic")
        .setRequired(true)
        .addChoices(...choices)
    ),

  async execute(interaction) {
    const gamesPath = path.relative(process.cwd(), "docs/games.txt");
    const userId = interaction.member.user.id;
    const re = new RegExp("^.*" + userId + ".*$", "gm");
    const relicIndex = interaction.options.getInteger("name");
    let gameInfo;
    let formatted;

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

        if (parseInt(gameInfo[2]) - relics[relicIndex].price < 0) {
          interaction
            .reply({
              content: "You can't afford this relic.",
              ephemeral: true,
            })
            .catch((err) => console.error(err));
          return;
        }

        if (parseInt(gameInfo[4]) !== relicIndex) {
          gameInfo[2] = parseInt(gameInfo[2]) - relics[relicIndex].price;
          gameInfo[4] = relicIndex;
        }

        formatted = data.replace(re, gameInfo.join(","));
      } catch (err) {
        console.error(err);
        interaction
          .reply({
            content: "Something went wrong.",
            ephemeral: true,
          })
          .catch((err) => console.error(err));
      }

      fs.writeFile(gamesPath, formatted, "utf8", (err) => {
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

          interaction
            .reply({
              content:
                "You have chosen the " +
                relics[relicIndex].name +
                " as your relic.",
              ephemeral: true,
            })
            .catch((err) => console.error(err));
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
    });
  },
};
