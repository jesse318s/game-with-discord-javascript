"use strict";
const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const creatures = require("../constants/creatures");
const {
  pagination,
  ButtonTypes,
  ButtonStyles,
} = require("@devraelfreeze/discordjs-pagination");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("viewsummons")
    .setDescription("Displays available summons"),

  async execute(interaction) {
    const pages = [];
    let creature;
    let embed;

    for (let i = 0; i < creatures.length; i++) {
      creature = creatures[i];
      embed = new EmbedBuilder().setTitle(creature.name).setDescription(
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
