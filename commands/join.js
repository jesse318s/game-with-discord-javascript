"use strict";
const { SlashCommandBuilder } = require("discord.js");
const path = require("path");
const fs = require("fs");

// verfies if user has joined the game
const verifyGameData = (gamesPath, re, interaction) => {
  return new Promise((resolve) => {
    fs.readFile(gamesPath, "utf8", (err, data) => {
      try {
        if (err) console.error(err);

        if (re.test(data)) resolve(true);

        resolve(false);
      } catch (err) {
        console.error(err);
        interaction.reply({
          content: "Something went wrong.",
          ephemeral: true,
        });
        resolve(false);
      }
    });
  });
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName("join")
    .setDescription("Joins user to game"),

  async execute(interaction) {
    const gamesPath = path.relative(process.cwd(), "docs/games.txt");
    const userId = interaction.member.user.id;
    const re = new RegExp("^.*" + userId + ".*$", "gm");
    const newLine =
      userId +
      "," +
      0 +
      "," +
      50 +
      "," +
      Math.floor(Math.random() * 4) +
      "," +
      0 +
      "," +
      0 +
      "," +
      0 +
      "," +
      0 +
      "," +
      0 +
      "," +
      0 +
      "\r\n";

    if (await verifyGameData(gamesPath, re, interaction)) {
      interaction.reply({
        content: "You've already joined the game.",
        ephemeral: true,
      });
      return;
    }

    fs.appendFile(gamesPath, newLine, "utf8", (err) => {
      try {
        if (err) {
          console.log(err);
          interaction.reply({
            content: "Something went wrong.",
            ephemeral: true,
          });
          return;
        }

        interaction.reply({
          content: "You joined the game!",
          ephemeral: true,
        });
      } catch (err) {
        console.error(err);
        interaction.reply({
          content: "Something went wrong.",
          ephemeral: true,
        });
      }
    });
  },
};
