const { SlashCommandBuilder } = require("discord.js");
const path = require("path");
const fs = require("fs");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("attack")
    .setDescription("Attacks enemy"),

  async execute(interaction, client) {
    try {
      const enemiesPath = path.relative(process.cwd(), "docs/enemies.txt");
      const userId = interaction.member.user.id;
      let re;
      let enemyHP;
      let newEnemyHP;
      let formatted;

      fs.readFile(enemiesPath, "utf8", function (err, data) {
        re = new RegExp("^.*" + userId + ".*$", "gm");

        if (!re.test(data)) {
          interaction.reply({
            content: "You must join the game first.",
            ephemeral: true,
          });
          return;
        }

        enemyHP = parseFloat(data.match(re)[0].split(",")[1]);
        newEnemyHP = enemyHP <= 0 ? 90 : enemyHP - 10;
        formatted = data.replace(re, userId + "," + newEnemyHP);

        if (err) return console.log(err);

        fs.writeFile(enemiesPath, formatted, "utf8", function (err) {
          if (err) return console.log(err);
        });

        interaction.reply({
          content: "Your enemy has " + newEnemyHP + " HP!",
          ephemeral: true,
        });
      });
    } catch (err) {
      console.error(err);
    }
  },
};
