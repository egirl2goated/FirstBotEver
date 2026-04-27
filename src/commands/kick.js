const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { logAction } = require('../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Kick a member from the server.')
    .addUserOption((o) => o.setName('user').setDescription('User to kick').setRequired(true))
    .addStringOption((o) => o.setName('reason').setDescription('Reason for the kick'))
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
    .setDMPermission(false),

  async execute(interaction) {
    const target = interaction.options.getUser('user', true);
    const reason = interaction.options.getString('reason') ?? 'No reason provided';

    if (target.id === interaction.user.id) {
      return interaction.reply({ content: 'You cannot kick yourself.', ephemeral: true });
    }

    const member = await interaction.guild.members.fetch(target.id).catch(() => null);
    if (!member) {
      return interaction.reply({ content: 'That user is not in this server.', ephemeral: true });
    }
    if (!member.kickable) {
      return interaction.reply({
        content: 'I cannot kick this user. They may have a higher role than me.',
        ephemeral: true,
      });
    }
    if (member.roles.highest.position >= interaction.member.roles.highest.position) {
      return interaction.reply({
        content: 'You cannot kick a member with an equal or higher role.',
        ephemeral: true,
      });
    }

    await interaction.deferReply();
    try {
      await target.send(`You have been kicked from **${interaction.guild.name}**.\nReason: ${reason}`).catch(() => null);
      await member.kick(`${interaction.user.tag}: ${reason}`);

      await logAction(interaction.guild, {
        action: 'kick',
        moderator: interaction.user,
        target,
        reason,
      });

      await interaction.editReply(`Kicked **${target.tag}**. Reason: ${reason}`);
    } catch (err) {
      console.error(err);
      await interaction.editReply('Failed to kick that user.');
    }
  },
};