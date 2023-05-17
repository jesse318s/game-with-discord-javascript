"use strict";
const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const relics = require("../constants/relics");
const {
  pagination,
  ButtonTypes,
  ButtonStyles,
} = require("@devraelfreeze/discordjs-pagination");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("viewrelics")
    .setDescription("Displays available relics"),

  async execute(interaction, client) {
    const pages = [];
    let relic;
    let embed;

    for (let i = 0; i < relics.length; i++) {
      relic = relics[i];
      embed = new EmbedBuilder()
        .setTitle(relic.name)
        .setDescription(
          relic.description + "\n\n**Price: " + relic.price + " drachmas**"
        );
      pages.push(embed);
    }

    await pagination({
      embeds: pages,
      author: interaction.member.user,
      interaction: interaction,
      ephemeral: true,
      time: 60000,
      disableButtons: true,
      fastSkip: true,
      pageTravel: false,
      buttons: [
        {
          type: ButtonTypes.previous,
          label: "Previous Page",
          style: ButtonStyles.Primary,
        },
        {
          type: ButtonTypes.next,
          label: "Next Page",
          style: ButtonStyles.Success,
        },
      ],
    });
  },
};
