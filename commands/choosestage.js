"use strict";
const { SlashCommandBuilder } = require("discord.js");
const path = require("path");
const fs = require("fs");
const stages = require("../constants/stages");

const choices = stages.map((stage) => ({
  name: stage.name + " | Level " + stage.levelReq,
  value: stage.id,
}));

module.exports = {
  data: new SlashCommandBuilder()
    .setName("choosestage")
    .setDescription("Chooses the player's stage")
    .setDMPermission(false)
    .addIntegerOption((option) =>
      option
        .setName("name")
        .setDescription("The name of the player's new stage")
        .setRequired(true)
        .addChoices(...choices)
    ),

  async execute(interaction) {
    const gamesPath = path.relative(process.cwd(), "docs/games.txt");
    const userId = interaction.member.user.id;
    const re = new RegExp("^.*" + userId + ".*$", "gm");
    const stageIndex = interaction.options.getInteger("name");
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

        if (
          stages[stageIndex].levelReq >
          Math.floor(Math.sqrt(parseInt(gameInfo[1])) * 0.25)
        ) {
          interaction
            .reply({
              content:
                "You must be level " +
                stages[stageIndex].levelReq +
                " to choose this stage.",
              ephemeral: true,
            })
            .catch((err) => console.error(err));
          return;
        }

        gameInfo[5] = 0;
        gameInfo[6] = 0;
        gameInfo[7] = stageIndex;
        formatted = data.replace(re, gameInfo.join(","));

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
                  "You have chosen " +
                  stages[stageIndex].name +
                  " as your stage.",
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
