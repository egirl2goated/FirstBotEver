const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { logAction } = require('../utils/logger');
const { parseDuration, formatDuration } = require('../utils/parseDuration');

const MAX_TIMEOUT_MS = 28 * 24 * 60 * 60 * 1000;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('timeout')
    .setDescription('Timeout a member for a duration (e.g. 10m, 1h, 2d).')
    .addUserOption((o) => o.setName('user').setDescription('User to timeout').setRequired(true))
    .addStringOption((o) =>
      o.setName('duration').setDescription('e.g. 30s, 10m, 1h, 1d (max 28d)').setRequired(true),
    )
    .addStringOption((o) => o.setName('reason').setDescription('Reason for the timeout'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .setDMPermission(false),

  async execute(interaction) {
    const target = interaction.options.getUser('user', true);
    const durationStr = interaction.options.getString('duration', true);
    const reason = interaction.options.getString('reason') ?? 'No reason provided';

    const ms = parseDuration(durationStr);
    if (!ms) {
      return interaction.reply({
        content: 'Invalid duration. Use formats like `30s`, `10m`, `1h`, `1d`.',
        ephemeral: true,
      });
    }
    if (ms > MAX_TIMEOUT_MS) {
      return interaction.reply({ content: 'Duration cannot exceed 28 days.', ephemeral: true });
    }

    const member = await interaction.guild.members.fetch(target.id).catch(() => null);
    if (!member) {
      return interaction.reply({ content: 'That user is not in this server.', ephemeral: true });
    }
    if (!member.moderatable) {
      return interaction.reply({
        content: 'I cannot timeout this user. They may have a higher role than me.',
        ephemeral: true,
      });
    }
    if (member.roles.highest.position >= interaction.member.roles.highest.position) {
      return interaction.reply({
        content: 'You cannot timeout a member with an equal or higher role.',
        ephemeral: true,
      });
    }

    await interaction.deferReply();
    try {
      await member.timeout(ms, `${interaction.user.tag}: ${reason}`);
      await target
        .send(`You have been timed out in **${interaction.guild.name}** for ${formatDuration(ms)}.\nReason: ${reason}`)
        .catch(() => null);

      await logAction(interaction.guild, {
        action: 'timeout',
        moderator: interaction.user,
        target,
        reason,
        extra: { Duration: formatDuration(ms) },
      });

      await interaction.editReply(`Timed out **${target.tag}** for ${formatDuration(ms)}. Reason: ${reason}`);
    } catch (err) {
      console.error(err);
      await interaction.editReply('Failed to timeout that user.');
    }
  },
};