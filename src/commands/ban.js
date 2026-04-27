const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { logAction } = require('../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Ban a user from the server.')
    .addUserOption((o) => o.setName('user').setDescription('User to ban').setRequired(true))
    .addStringOption((o) => o.setName('reason').setDescription('Reason for the ban'))
    .addIntegerOption((o) =>
      o
        .setName('delete_days')
        .setDescription('Days of messages to delete (0-7)')
        .setMinValue(0)
        .setMaxValue(7),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .setDMPermission(false),

  async execute(interaction) {
    const target = interaction.options.getUser('user', true);
    const reason = interaction.options.getString('reason') ?? 'No reason provided';
    const deleteDays = interaction.options.getInteger('delete_days') ?? 0;

    if (target.id === interaction.user.id) {
      return interaction.reply({ content: 'You cannot ban yourself.', ephemeral: true });
    }
    if (target.id === interaction.client.user.id) {
      return interaction.reply({ content: 'I cannot ban myself.', ephemeral: true });
    }

    const member = await interaction.guild.members.fetch(target.id).catch(() => null);
    if (member) {
      if (!member.bannable) {
        return interaction.reply({
          content: 'I cannot ban this user. They may have a higher role than me.',
          ephemeral: true,
        });
      }
      if (member.roles.highest.position >= interaction.member.roles.highest.position) {
        return interaction.reply({
          content: 'You cannot ban a member with an equal or higher role.',
          ephemeral: true,
        });
      }
    }

    await interaction.deferReply();

    try {
      await target.send(`You have been banned from **${interaction.guild.name}**.
Reason: ${reason}`).catch(() => null);
      await interaction.guild.bans.create(target.id, {
        reason: `${interaction.user.tag}: ${reason}`,
        deleteMessageSeconds: deleteDays * 24 * 60 * 60,
      });

      await logAction(interaction.guild, {
        action: 'ban',
        moderator: interaction.user,
        target,
        reason,
        extra: { 'Messages deleted': `${deleteDays} day(s)` },
      });

      await interaction.editReply(`Banned **${target.tag}**. Reason: ${reason}`);
    } catch (err) {
      console.error(err);
      await interaction.editReply('Failed to ban that user.');
    }
  },
};