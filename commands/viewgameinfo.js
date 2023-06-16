"use strict";
const {
  SlashCommandBuilder,
  AttachmentBuilder,
  EmbedBuilder,
} = require("discord.js");
const path = require("path");
const fs = require("fs");
const sharp = require("sharp");
const creatures = require("../constants/creatures");
const relics = require("../constants/relics");

const loadGameInfo = (gamesPath, re) => {
  return new Promise((resolve) => {
    fs.readFile(gamesPath, "utf8", (err, data) => {
      try {
        if (err) console.error(err);

        const gameInfo = data.match(re)[0].split(",");

        if (re.test(data)) resolve(gameInfo);

        resolve();
      } catch (err) {
        console.error(err);
        resolve(null);
      }
    });
  });
};

const denyGameInfo = async (interaction) => {
  await interaction
    .reply({
      content: "Please join the game if you haven't.",
      ephemeral: true,
    })
    .catch((err) => {
      console.error(err);
    });
  throw new Error(`Game info was denied for ${interaction.user.tag}.
    User ID: ${interaction.user.id}`);
};

const resizeImg = (i, gameInfo) => {
  return sharp(
    "./assets/" +
      (i == 3 ? "creatures/" : "relics/") +
      (i == 3 ? creatures[gameInfo[i]].img : relics[gameInfo[i]].img)
  )
    .resize(i == 3 ? 128 : 46, i == 3 ? 128 : 46)
    .toBuffer();
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName("viewgameinfo")
    .setDescription(
      "Displays player's game info (such as experience level or total drachmas)"
    )
    .setDMPermission(false),

  async execute(interaction) {
    const gamesPath = path.relative(process.cwd(), "docs/games.txt");
    const re = new RegExp("^.*" + interaction.member.user.id + ".*$", "gm");
    const gameInfo = await loadGameInfo(gamesPath, re);
    const imgFiles = [];
    let summon;
    let chosenRelic;
    let attachment;
    let gameInfoEmbed;

    gameInfo ?? (await denyGameInfo(interaction));
    summon = creatures[gameInfo[3]];
    chosenRelic = relics[gameInfo[4]];

    for (let i = 3; i < 5; i++) {
      attachment = new AttachmentBuilder(await resizeImg(i, gameInfo), {
        name: i == 3 ? creatures[gameInfo[i]].img : relics[gameInfo[i]].img,
        description:
          i == 3 ? creatures[gameInfo[i]].name : relics[gameInfo[i]].name,
      });
      imgFiles.push(attachment);
    }

    gameInfoEmbed = new EmbedBuilder()
      .setTitle("Game Info")
      .setDescription(
        `**Player**
        Level: ${(Math.sqrt(parseInt(gameInfo[1])) * 0.25).toFixed(2)} | ${
          gameInfo[1]
        } XP\nDrachmas: ${gameInfo[2]}
        Chosen relic: ${relics[gameInfo[4]].name}
      \n**Summon**
      Name: ${summon.name}
      HP: ${gameInfo[5]} / ${summon.hp + chosenRelic.hpMod}
      Attack: ${summon.attackName} (${summon.attack + chosenRelic.attackMod}, ${
          summon.attackType
        })
      Speed: ${summon.speed + chosenRelic.speedMod}
            Defense: ${summon.defense + chosenRelic.defenseMod}
            Critical: ${summon.critical + chosenRelic.criticalMod}
        MP: ${gameInfo[6]} / ${summon.mp + chosenRelic.mpMod}
        MP regen: ${summon.mpRegen + chosenRelic.mpRegenMod}
        Special: ${summon.specialName} (${
          summon.special + chosenRelic.specialMod
        }, ${summon.specialType}, cost: ${summon.specialCost})
        Special 2: ${summon.specialName2} (${
          summon.special2 + chosenRelic.specialMod
        }, ${summon.specialType2}, cost: ${summon.specialCost2})`
      )
      .setImage("attachment://" + summon.img)
      .setThumbnail("attachment://" + relics[gameInfo[4]].img);
    interaction
      .reply({
        embeds: [gameInfoEmbed],
        ephemeral: true,
        files: imgFiles,
      })
      .catch((err) => console.error(err));
  },
};
