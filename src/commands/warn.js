const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { logAction } = require('../utils/logger');
const { addWarning, listWarnings } = require('../utils/warnings');
const { applyThresholdAction } = require('../utils/thresholdActions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Warn a member. Repeated warnings can trigger automatic actions.')
    .addUserOption((o) => o.setName('user').setDescription('User to warn').setRequired(true))
    .addStringOption((o) => o.setName('reason').setDescription('Reason for the warning').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .setDMPermission(false),

  async execute(interaction) {
    const target = interaction.options.getUser('user', true);
    const reason = interaction.options.getString('reason', true);

    if (target.bot) {
      return interaction.reply({ content: 'You cannot warn bots.', ephemeral: true });
    }

    const member = await interaction.guild.members.fetch(target.id).catch(() => null);
    if (member && member.roles.highest.position >= interaction.member.roles.highest.position) {
      return interaction.reply({
        content: 'You cannot warn a member with an equal or higher role.',
        ephemeral: true,
      });
    }

    await interaction.deferReply();

    addWarning(interaction.guild.id, target.id, {
      moderatorId: interaction.user.id,
      reason,
    });

    const warnings = listWarnings(interaction.guild.id, target.id);

    await target
      .send(`You have been warned in **${interaction.guild.name}**.\nReason: ${reason}\nTotal warnings: ${warnings.length}`)
      .catch(() => null);

    await logAction(interaction.guild, {
      action: 'warn',
      moderator: interaction.user,
      target,
      reason,
      extra: { 'Total warnings': warnings.length },
    });

    const thresholdMessage = await applyThresholdAction(interaction.guild, target, warnings.length);

    await interaction.editReply(
      `Warned **${target.tag}**. Reason: ${reason}\nTotal warnings: **${warnings.length}**${
        thresholdMessage ? `\n${thresholdMessage}` : ''
      }`,
    );
  },
};