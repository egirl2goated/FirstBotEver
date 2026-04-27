const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { logAction } = require('../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('slowmode')
    .setDescription('Set slowmode (in seconds) for the current channel. 0 disables it.')
    .addIntegerOption((o) =>
      o.setName('seconds').setDescription('0-21600 seconds').setMinValue(0).setMaxValue(21600).setRequired(true),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .setDMPermission(false),

  async execute(interaction) {
    const seconds = interaction.options.getInteger('seconds', true);

    if (interaction.channel.type !== ChannelType.GuildText) {
      return interaction.reply({ content: 'This command only works in text channels.', ephemeral: true });
    }

    try {
      await interaction.channel.setRateLimitPerUser(seconds, `${interaction.user.tag} set slowmode`);
      await logAction(interaction.guild, {
        action: 'slowmode',
        moderator: interaction.user,
        reason: `Slowmode set to ${seconds}s`,
        extra: { Channel: `<#${interaction.channel.id}>` },
      });
      await interaction.reply(
        seconds === 0 ? 'Slowmode disabled.' : `Slowmode set to **${seconds}** second(s).`,
      );
    } catch (err) {
      console.error(err);
      await interaction.reply({ content: 'Failed to set slowmode.', ephemeral: true });
    }
  },
};