"use strict";
const {
  SlashCommandBuilder,
  AttachmentBuilder,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
} = require("discord.js");
const sharp = require("sharp");
const creatures = require("../constants/creatures");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("viewsummons")
    .setDescription("Displays available summons")
    .setDMPermission(false),

  async execute(interaction) {
    const creature = interaction.customId
      ? creatures[interaction.customId.match(/creature_(\d+)/)[1] - 1]
      : creatures[0];
    const img = await sharp("./assets/creatures/" + creature.img)
      .resize(128, 128)
      .toBuffer();
    const attachment = new AttachmentBuilder(img, {
      name: creature.img,
      description: creature.name,
    });
    const embed = new EmbedBuilder()
      .setTitle(creature.name)
      .setDescription(
        `HP: ${creature.hp}
        Attack: ${creature.attackName} (${creature.attack}, ${creature.attackType})
        Speed: ${creature.speed}
        Defense: ${creature.defense}
        Critical: ${creature.critical}
        MP: ${creature.mp}
        MP regen: ${creature.mpRegen}
        Special: ${creature.specialName} (${creature.special}, ${creature.specialType}, cost: ${creature.specialCost})
        Special 2: ${creature.specialName2} (${creature.special2}, ${creature.specialType2}, cost: ${creature.specialCost2})` +
          "\n\n**Price:** " +
          creature.price +
          " XP"
      )
      .setThumbnail("attachment://" + creature.img);
    const previousButton = new ButtonBuilder()
      .setCustomId(
        creature.id === 1 ? "creature_1" : "creature_" + (creature.id - 1)
      )
      .setLabel("Previous")
      .setStyle(ButtonStyle.Primary);
    const nextButton = new ButtonBuilder()
      .setCustomId(
        creature.id === creatures.length
          ? "creature_" + creatures.length
          : "creature_" + (creature.id + 1)
      )
      .setLabel("Next")
      .setStyle(ButtonStyle.Primary);

    interaction
      .reply({
        embeds: [embed],
        ephemeral: true,
        files: [attachment],
        components: [
          new ActionRowBuilder().addComponents(previousButton, nextButton),
        ],
      })
      .catch((err) => console.error(err));
  },
};
