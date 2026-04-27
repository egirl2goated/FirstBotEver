const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { logAction } = require('../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unban')
    .setDescription('Unban a user by ID.')
    .addStringOption((o) => o.setName('user_id').setDescription('User ID to unban').setRequired(true))
    .addStringOption((o) => o.setName('reason').setDescription('Reason for the unban'))
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .setDMPermission(false),

  async execute(interaction) {
    const userId = interaction.options.getString('user_id', true);
    const reason = interaction.options.getString('reason') ?? 'No reason provided';

    if (!/^\d{17,20}$/.test(userId)) {
      return interaction.reply({ content: 'That does not look like a valid user ID.', ephemeral: true });
    }

    await interaction.deferReply();
    try {
      const ban = await interaction.guild.bans.fetch(userId).catch(() => null);
      if (!ban) {
        return interaction.editReply('That user is not currently banned.');
      }
      await interaction.guild.bans.remove(userId, `${interaction.user.tag}: ${reason}`);

      await logAction(interaction.guild, {
        action: 'unban',
        moderator: interaction.user,
        target: ban.user,
        reason,
      });

      await interaction.editReply(`Unbanned **${ban.user.tag}**. Reason: ${reason}`);
    } catch (err) {
      console.error(err);
      await interaction.editReply('Failed to unban that user.');
    }
  },
};