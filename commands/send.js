const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("send")
    .setDescription(
      "Sends most recent channel message to first server channel"
    ),

  async execute(interaction, client) {
    client.channels.fetch(interaction.channel.id).then((channel) => {
      channel.messages.fetch({ limit: 1 }).then((messages) => {
        messages.forEach(async (message) => {
          await interaction.guild.channels.cache
            .filter((c) => c.isTextBased())
            .find((x) => x.position === 0)
            .send(message.content);
        });
      });
    });
  },
};
