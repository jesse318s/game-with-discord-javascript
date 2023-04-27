const { SlashCommandBuilder } = require("discord.js");
const path = require("path");
const fs = require("fs");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("join")
    .setDescription("Joins user to game"),

  async execute(interaction, client) {
    try {
      const enemiesPath = path.relative(process.cwd(), "docs/enemies.txt");
      const userId = interaction.member.user.id;
      let re;
      let newLine;

      fs.readFile(enemiesPath, "utf8", function (err, data) {
        re = new RegExp("^.*" + userId + ".*$", "gm");

        if (re.test(data)) {
          interaction.reply({
            content: "You've already joined the game.",
            ephemeral: true,
          });
          return;
        }

        newLine = userId + "," + 100 + "\r\n";

        if (err) return console.log(err);

        fs.appendFile(enemiesPath, newLine, "utf8", function (err) {
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
