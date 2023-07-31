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
const relics = require("../constants/relics");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("viewrelics")
    .setDescription("Displays available relics")
    .setDMPermission(false),

  async execute(interaction) {
    const relic = interaction.customId
      ? relics[interaction.customId.match(/relic_(\d+)/)[1] - 1]
      : relics[0];
    const img = await sharp("./assets/relics/" + relic.img)
      .resize(46, 46)
      .toBuffer();
    const attachment = new AttachmentBuilder(img, {
      name: relic.img,
      description: relic.name,
    });
    const embed = new EmbedBuilder()
      .setTitle(relic.name)
      .setDescription(
        relic.description + "\n\n**Price:** " + relic.price + " drachmas"
      )
      .setThumbnail("attachment://" + relic.img);
    const previousButton = new ButtonBuilder()
      .setCustomId(relic.id === 1 ? "relic_1" : "relic_" + (relic.id - 1))
      .setLabel("Previous")
      .setStyle(ButtonStyle.Primary);
    const nextButton = new ButtonBuilder()
      .setCustomId(
        relic.id === relics.length
          ? "relic_" + relics.length
          : "relic_" + (relic.id + 1)
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
