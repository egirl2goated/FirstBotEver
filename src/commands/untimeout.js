const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { logAction } = require('../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('untimeout')
    .setDescription('Remove a timeout from a member.')
    .addUserOption((o) => o.setName('user').setDescription('User to remove timeout from').setRequired(true))
    .addStringOption((o) => o.setName('reason').setDescription('Reason for removing the timeout'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .setDMPermission(false),

  async execute(interaction) {
    const target = interaction.options.getUser('user', true);
    const reason = interaction.options.getString('reason') ?? 'No reason provided';

    const member = await interaction.guild.members.fetch(target.id).catch(() => null);
    if (!member) {
      return interaction.reply({ content: 'That user is not in this server.', ephemeral: true });
    }
    if (!member.isCommunicationDisabled()) {
      return interaction.reply({ content: 'That user is not currently timed out.', ephemeral: true });
    }

    await interaction.deferReply();
    try {
      await member.timeout(null, `${interaction.user.tag}: ${reason}`);

      await logAction(interaction.guild, {
        action: 'untimeout',
        moderator: interaction.user,
        target,
        reason,
      });

      await interaction.editReply(`Removed timeout from **${target.tag}**. Reason: ${reason}`);
    } catch (err) {
      console.error(err);
      await interaction.editReply('Failed to remove timeout.');
    }
  },
};